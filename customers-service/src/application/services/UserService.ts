import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../../config/database';
import { RedisConnection } from '../../config/redis';
import { logger } from '../../config/logger';
import { IUserEventPublisher } from '../../domain/interfaces/IMessageBroker';
import { RegisterRequest, LoginRequest, UpdateUserRequest } from '../../types/user.types';

export class UserService {
  private prisma = DatabaseConnection.getInstance();
  private redis = RedisConnection.getInstance();

  constructor(private userEventPublisher: IUserEventPublisher) {}

  async register(data: RegisterRequest, correlationId: string) {
    const { name, email, password, cpf, address } = data;

    if (!name || !email || !password) {
      throw new Error('Nome, email e senha são obrigatórios');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          cpf: cpf || null,
          address: address || null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          isActive: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Publicar evento de usuário registrado
      try {
        await this.userEventPublisher.publishUserRegistered(user.id, {
          userId: user.id,
          eventType: 'USER_REGISTERED',
          timestamp: new Date().toISOString(),
          data: {
            name: user.name,
            email: user.email,
            isActive: user.isActive,
            ...(user.address && { address: user.address }),
          },
        }, correlationId);
      } catch (error) {
        logger.error('Failed to publish user registered event:', error);
      }

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error('Erro interno do servidor');
    }
  }

  async login(data: LoginRequest, correlationId: string, ipAddress?: string, userAgent?: string) {
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        address: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        bankingDetails: {
          select: {
            id: true,
            bankCode: true,
            agencyNumber: true,
            accountNumber: true,
            accountType: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env['JWT_SECRET'] || 'default-secret',
      { expiresIn: '24h' }
    );

    await this.redis.setEx(`user:${user.id}:token`, 86400, token);

    // Publicar evento de autenticação
    try {
      await this.userEventPublisher.publishAuthenticationEvent(user.id, {
        userId: user.id,
        action: 'login',
        timestamp: new Date(),
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        correlationId,
      });
    } catch (error) {
      logger.error('Failed to publish authentication event:', error);
    }

    const { password: _, ...userWithoutPassword } = user;

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      correlationId
    });

    return {
      user: userWithoutPassword,
      token
    };
  }

  async updateUser(userId: string, data: UpdateUserRequest, correlationId: string) {
    const { name, email, address, bankingDetails } = data;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        throw new Error('Email já está em uso por outro usuário');
      }
    }

    const updatedFields: string[] = [];

    if (name && name !== existingUser.name) updatedFields.push('name');
    if (email && email !== existingUser.email) updatedFields.push('email');
    if (address && address !== existingUser.address) updatedFields.push('address');

    await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address })
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          isActive: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

    if (bankingDetails) {
      const existingBankingDetails = await this.prisma.bankingDetails.findUnique({
        where: { userId }
      });

      if (existingBankingDetails) {
        await this.prisma.bankingDetails.update({
          where: { userId },
          data: {
            ...(bankingDetails.bankCode && { bankCode: bankingDetails.bankCode }),
            ...(bankingDetails.agencyNumber && { agencyNumber: bankingDetails.agencyNumber }),
            ...(bankingDetails.accountNumber && { accountNumber: bankingDetails.accountNumber }),
            ...(bankingDetails.accountType && { accountType: bankingDetails.accountType })
          }
        });
      } else {
        await this.prisma.bankingDetails.create({
          data: {
            userId,
            bankCode: bankingDetails.bankCode || '',
            agencyNumber: bankingDetails.agencyNumber || '',
            accountNumber: bankingDetails.accountNumber || '',
            accountType: bankingDetails.accountType || 'checking'
          }
        });
      }

      if (bankingDetails.bankCode) updatedFields.push('bankCode');
      if (bankingDetails.agencyNumber) updatedFields.push('agencyNumber');
      if (bankingDetails.accountNumber) updatedFields.push('accountNumber');
      if (bankingDetails.accountType) updatedFields.push('accountType');
    }

    // Publicar evento de dados bancários atualizados se houve mudanças
    if (updatedFields.length > 0) {
      try {
        await this.userEventPublisher.publishBankingDataUpdated(userId, {
          userId,
          updatedFields,
          updatedAt: new Date(),
          correlationId,
        });
      } catch (error) {
        logger.error('Failed to publish banking data updated event:', error);
      }
    }

    const finalUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        isActive: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        bankingDetails: {
          select: {
            id: true,
            bankCode: true,
            agencyNumber: true,
            accountNumber: true,
            accountType: true
          }
        }
      }
    });

    logger.info('User updated successfully', {
      userId,
      updatedFields,
      correlationId
    });

    return finalUser;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        isActive: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        bankingDetails: {
          select: {
            id: true,
            bankCode: true,
            agencyNumber: true,
            accountNumber: true,
            accountType: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}