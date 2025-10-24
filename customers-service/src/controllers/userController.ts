import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../config/database';
import { RedisConnection } from '../config/redis';
import { logger } from '../config/logger';
import { RequestWithCorrelationId } from '../middlewares/correlationId';
import { IUserEventPublisher } from '../domain/interfaces/IMessageBroker';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  address?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateProfileRequest {
  name?: string;
  email?: string;
  address?: string;
  profilePicture?: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  address?: string;
  bankingDetails?: {
    bankCode?: string;
    agencyNumber?: string;
    accountNumber?: string;
    accountType?: string;
  };
}

interface UpdateProfilePictureRequest {
  profilePicture: string;
}

class UserController {
  private prisma = DatabaseConnection.getInstance();
  private redis = RedisConnection.getInstance();
  private userEventPublisher: IUserEventPublisher;

  constructor(userEventPublisher: IUserEventPublisher) {
    this.userEventPublisher = userEventPublisher;
  }

  async register(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { name, email, password, cpf, address }: RegisterRequest = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Nome, email e senha são obrigatórios',
          correlationId: req.correlationId
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Usuário já existe com este email',
          correlationId: req.correlationId
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          cpf: cpf || null,
          address: address || null
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

      await this.redis.setEx(`user:${user.id}:password`, 86400, hashedPassword);

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        correlationId: req.correlationId
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          message: 'Usuário registrado com sucesso'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error registering user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async login(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios',
          correlationId: req.correlationId
        });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId
        });
        return;
      }

      const storedPassword = await this.redis.get(`user:${user.id}:password`);
      if (!storedPassword) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, storedPassword);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId
        });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env['JWT_SECRET'] || 'default-secret',
        { expiresIn: '24h' }
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: {
          user,
          token,
          message: 'Login realizado com sucesso'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error logging in user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async getProfile(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Token de autenticação inválido',
          correlationId: req.correlationId
        });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
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
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId
        });
        return;
      }

      logger.info('User profile retrieved', {
        userId: user.id,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: {
          user
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error getting user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async updateProfile(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { name, email, address, profilePicture }: UpdateProfileRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Token de autenticação inválido',
          correlationId: req.correlationId
        });
        return;
      }

      if (email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });

        if (existingUser) {
          res.status(409).json({
            success: false,
            error: 'Email já está em uso por outro usuário',
            correlationId: req.correlationId
          });
          return;
        }
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
          ...(profilePicture && { profilePicture })
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info('User profile updated', {
        userId: updatedUser.id,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Perfil atualizado com sucesso'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error updating user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async getUserById(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório',
          correlationId: req.correlationId
        });
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
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
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId
        });
        return;
      }

      logger.info('User retrieved by ID', {
        userId: user.id,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: {
          user
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error getting user by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async updateUserById(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { name, email, address, bankingDetails }: UpdateUserRequest = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório',
          correlationId: req.correlationId
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId
        });
        return;
      }

      if (email && email !== existingUser.email) {
        const emailInUse = await this.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: existingUser.id }
          }
        });

        if (emailInUse) {
          res.status(409).json({
            success: false,
            error: 'Email já está em uso por outro usuário',
            correlationId: req.correlationId
          });
          return;
        }
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address })
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
      }

      const finalUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
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

      logger.info('User updated by ID', {
        userId: finalUser?.id,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: {
          user: finalUser,
          message: 'Usuário atualizado com sucesso'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error updating user by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }

  async updateProfilePicture(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { profilePicture }: UpdateProfilePictureRequest = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório',
          correlationId: req.correlationId
        });
        return;
      }

      if (!profilePicture) {
        res.status(400).json({
          success: false,
          error: 'URL da foto de perfil é obrigatória',
          correlationId: req.correlationId
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId
        });
        return;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture },
        include: {
          bankingDetails: true
        }
      });

      logger.info('Profile picture updated', {
        userId: updatedUser.id,
        correlationId: req.correlationId
      });
      
      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Foto de perfil atualizada com sucesso'
        },
        correlationId: req.correlationId
      });
    } catch (error) {
      logger.error('Error updating profile picture', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId
      });
    }
  }
}

// Export será feito no index.ts após injeção de dependências
export { UserController };