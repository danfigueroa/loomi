import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../config/database';
import { RedisConnection } from '../config/redis';
import { logger } from '../config/logger';
import type { RequestWithCorrelationId } from '../middlewares/correlationId';
import type { IUserEventPublisher } from '../domain/interfaces/IMessageBroker';
import type {
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  UpdateUserRequest,
  UpdateProfilePictureRequest,
} from '../types/user.types';
import type { AuthenticatedRequest } from '../types/auth.types';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nome completo do usuário
 *           example: "João Silva Santos"
 *         email:
 *           type: string
 *           format: email
 *           description: Email único do usuário
 *           example: "joao.silva@email.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           maxLength: 100
 *           description: Senha segura (mínimo 6 caracteres)
 *           example: "minhasenha123"
 *         cpf:
 *           type: string
 *           pattern: '^[0-9]{11}$'
 *           description: CPF do usuário (apenas números)
 *           example: "12345678901"
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Endereço completo do usuário
 *           example: "Rua das Flores, 123, Centro, São Paulo - SP"
 *
 *     UserLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@email.com"
 *         password:
 *           type: string
 *           description: Senha do usuário
 *           example: "minhasenha123"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         name:
 *           type: string
 *           description: Nome completo do usuário
 *           example: "João Silva Santos"
 *         email:
 *           type: string
 *           format: email
 *           description: Email do usuário
 *           example: "joao.silva@email.com"
 *         cpf:
 *           type: string
 *           description: CPF do usuário
 *           example: "12345678901"
 *         address:
 *           type: string
 *           description: Endereço do usuário
 *           example: "Rua das Flores, 123, Centro, São Paulo - SP"
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           description: URL da foto de perfil
 *           example: "https://example.com/profile.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da conta
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica se o login foi bem-sucedido
 *           example: true
 *         token:
 *           type: string
 *           description: JWT token para autenticação
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Login realizado com sucesso"
 *
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica se o registro foi bem-sucedido
 *           example: true
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Usuário criado com sucesso"
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: Nome completo do usuário
 *           example: "João Silva Santos"
 *         cpf:
 *           type: string
 *           pattern: '^[0-9]{11}$'
 *           description: CPF do usuário (apenas números)
 *           example: "12345678901"
 *         address:
 *           type: string
 *           maxLength: 500
 *           description: Endereço completo do usuário
 *           example: "Rua das Flores, 123, Centro, São Paulo - SP"
 */

class UserController {
  private prisma = DatabaseConnection.getInstance();
  private redis = RedisConnection.getInstance();
  private userEventPublisher: IUserEventPublisher;

  constructor(userEventPublisher: IUserEventPublisher) {
    this.userEventPublisher = userEventPublisher;
  }

  /**
   * @swagger
   * /api/users/register:
   *   post:
   *     summary: 🚀 Registrar Novo Usuário
   *     description: |
   *       Cria uma nova conta de usuário no sistema com validações completas e segurança avançada.
   *
   *       **🔐 Recursos de Segurança:**
   *       - ✅ Hash seguro da senha com bcrypt
   *       - ✅ Validação de email único
   *       - ✅ Sanitização de dados de entrada
   *       - ✅ Logs de auditoria automáticos
   *       - ✅ Eventos de notificação
   *
   *       **📋 Validações Automáticas:**
   *       - Email em formato válido
   *       - Senha com mínimo de 6 caracteres
   *       - Nome com 2-100 caracteres
   *       - CPF apenas números (opcional)
   *       - Endereço até 500 caracteres (opcional)
   *
   *       **🎯 Casos de Uso:**
   *       - Cadastro de novos clientes
   *       - Onboarding de usuários
   *       - Criação de contas empresariais
   *       - Registro via aplicativo mobile
   *     tags: [👥 Usuários]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserRegisterRequest'
   *           examples:
   *             usuario_completo:
   *               summary: Cadastro Completo
   *               description: Exemplo com todos os campos preenchidos
   *               value:
   *                 name: "João Silva Santos"
   *                 email: "joao.silva@email.com"
   *                 password: "minhasenha123"
   *                 cpf: "12345678901"
   *                 address: "Rua das Flores, 123, Centro, São Paulo - SP"
   *             usuario_basico:
   *               summary: Cadastro Básico
   *               description: Exemplo apenas com campos obrigatórios
   *               value:
   *                 name: "Maria Oliveira"
   *                 email: "maria.oliveira@email.com"
   *                 password: "senha456"
   *             usuario_empresarial:
   *               summary: Cadastro Empresarial
   *               description: Exemplo para conta empresarial
   *               value:
   *                 name: "Empresa XYZ Ltda"
   *                 email: "contato@empresaxyz.com"
   *                 password: "senhaempresa789"
   *                 address: "Av. Paulista, 1000, Bela Vista, São Paulo - SP"
   *     responses:
   *       201:
   *         description: ✅ Usuário criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/RegisterResponse'
   *             examples:
   *               sucesso:
   *                 summary: Registro Bem-sucedido
   *                 value:
   *                   success: true
   *                   user:
   *                     id: "550e8400-e29b-41d4-a716-446655440000"
   *                     name: "João Silva Santos"
   *                     email: "joao.silva@email.com"
   *                     cpf: "12345678901"
   *                     address: "Rua das Flores, 123, Centro, São Paulo - SP"
   *                     profilePicture: null
   *                     createdAt: "2024-01-15T10:30:00Z"
   *                     updatedAt: "2024-01-15T10:30:00Z"
   *                   message: "Usuário criado com sucesso"
   *       400:
   *         description: ❌ Dados inválidos ou campos obrigatórios ausentes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               campos_obrigatorios:
   *                 summary: Campos Obrigatórios
   *                 value:
   *                   success: false
   *                   error: "Nome, email e senha são obrigatórios"
   *                   correlationId: "req-123456"
   *       409:
   *         description: ⚠️ Email já está em uso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               email_existente:
   *                 summary: Email Já Cadastrado
   *                 value:
   *                   success: false
   *                   error: "Usuário já existe com este email"
   *                   correlationId: "req-123456"
   *       500:
   *         description: 🔥 Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async register(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { name, email, password, cpf, address }: RegisterRequest = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          success: false,
          error: 'Nome, email e senha são obrigatórios',
          correlationId: req.correlationId,
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Usuário já existe com este email',
          correlationId: req.correlationId,
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
          address: address || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          isActive: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.redis.setEx(`user:${user.id}:password`, 86400, hashedPassword);

      try {
        await this.userEventPublisher.publishAuthenticationEvent(user.id, {
          userId: user.id,
          action: 'login',
          timestamp: new Date(),
          correlationId: req.correlationId,
        });
      } catch (error) {
        logger.error('Failed to publish authentication event:', error);
      }

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        correlationId: req.correlationId,
      });

      res.status(201).json({
        success: true,
        data: {
          user,
          message: 'Usuário registrado com sucesso',
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error registering user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
      });
    }
  }

  /**
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: 🔐 Fazer Login
   *     description: |
   *       Autentica um usuário no sistema e retorna um JWT token para acesso às rotas protegidas.
   *
   *       **🔒 Recursos de Segurança:**
   *       - ✅ Verificação segura de senha com bcrypt
   *       - ✅ Geração de JWT token com expiração
   *       - ✅ Cache de sessão no Redis
   *       - ✅ Logs de auditoria de login
   *       - ✅ Proteção contra ataques de força bruta
   *
   *       **⚡ Performance:**
   *       - Cache inteligente de dados do usuário
   *       - Tokens JWT otimizados
   *       - Validação rápida de credenciais
   *
   *       **🎯 Casos de Uso:**
   *       - Login via web app
   *       - Autenticação mobile
   *       - Integração com sistemas externos
   *       - SSO (Single Sign-On)
   *     tags: [👥 Usuários]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserLoginRequest'
   *           examples:
   *             login_padrao:
   *               summary: Login Padrão
   *               description: Exemplo de login com email e senha
   *               value:
   *                 email: "joao.silva@email.com"
   *                 password: "minhasenha123"
   *             login_empresarial:
   *               summary: Login Empresarial
   *               description: Exemplo de login para conta empresarial
   *               value:
   *                 email: "admin@empresa.com"
   *                 password: "senhaempresa456"
   *     responses:
   *       200:
   *         description: ✅ Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *             examples:
   *               login_sucesso:
   *                 summary: Login Bem-sucedido
   *                 value:
   *                   success: true
   *                   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZW1haWwuY29tIiwiaWF0IjoxNjQyNjgwMDAwLCJleHAiOjE2NDI3NjY0MDB9.example"
   *                   user:
   *                     id: "550e8400-e29b-41d4-a716-446655440000"
   *                     name: "João Silva Santos"
   *                     email: "joao.silva@email.com"
   *                     cpf: "12345678901"
   *                     address: "Rua das Flores, 123, Centro, São Paulo - SP"
   *                     profilePicture: null
   *                     createdAt: "2024-01-15T10:30:00Z"
   *                     updatedAt: "2024-01-15T10:30:00Z"
   *                   message: "Login realizado com sucesso"
   *       400:
   *         description: ❌ Dados inválidos ou campos obrigatórios ausentes
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               campos_obrigatorios:
   *                 summary: Campos Obrigatórios
   *                 value:
   *                   success: false
   *                   error: "Email e senha são obrigatórios"
   *                   correlationId: "req-123456"
   *       401:
   *         description: 🔒 Credenciais inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               credenciais_invalidas:
   *                 summary: Email ou Senha Incorretos
   *                 value:
   *                   success: false
   *                   error: "Email ou senha inválidos"
   *                   correlationId: "req-123456"
   *       404:
   *         description: 👤 Usuário não encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       500:
   *         description: 🔥 Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async login(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios',
          correlationId: req.correlationId,
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
          isActive: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId,
        });
        return;
      }

      const storedPassword = await this.redis.get(`user:${user.id}:password`);
      if (!storedPassword) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId,
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, storedPassword);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
          correlationId: req.correlationId,
        });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env['JWT_SECRET'] || 'default-secret',
        { expiresIn: '24h' },
      );

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user,
          token,
          message: 'Login realizado com sucesso',
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error logging in user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Token de autenticação inválido',
          correlationId: req.correlationId,
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
              accountType: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId,
        });
        return;
      }

      logger.info('User profile retrieved', {
        userId: user.id,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...user,
            isActive: user.isActive,
          },
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error getting user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { name, email, address, profilePicture }: UpdateProfileRequest = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Token de autenticação inválido',
          correlationId: req.correlationId,
        });
        return;
      }

      if (email) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          res.status(409).json({
            success: false,
            error: 'Email já está em uso por outro usuário',
            correlationId: req.correlationId,
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
          ...(profilePicture && { profilePicture }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info('User profile updated', {
        userId: updatedUser.id,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Perfil atualizado com sucesso',
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error updating user profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
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
          correlationId: req.correlationId,
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
              accountType: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId,
        });
        return;
      }

      logger.info('User retrieved by ID', {
        userId: user.id,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...user,
            isActive: user.isActive,
          },
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error getting user by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
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
          correlationId: req.correlationId,
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId,
        });
        return;
      }

      if (email && email !== existingUser.email) {
        const emailInUse = await this.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: existingUser.id },
          },
        });

        if (emailInUse) {
          res.status(409).json({
            success: false,
            error: 'Email já está em uso por outro usuário',
            correlationId: req.correlationId,
          });
          return;
        }
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
        },
      });

      if (bankingDetails) {
        const existingBankingDetails = await this.prisma.bankingDetails.findUnique({
          where: { userId },
        });

        if (existingBankingDetails) {
          await this.prisma.bankingDetails.update({
            where: { userId },
            data: {
              ...(bankingDetails.bankCode && { bankCode: bankingDetails.bankCode }),
              ...(bankingDetails.agencyNumber && { agencyNumber: bankingDetails.agencyNumber }),
              ...(bankingDetails.accountNumber && { accountNumber: bankingDetails.accountNumber }),
              ...(bankingDetails.accountType && { accountType: bankingDetails.accountType }),
            },
          });
        } else {
          await this.prisma.bankingDetails.create({
            data: {
              userId,
              bankCode: bankingDetails.bankCode || '',
              agencyNumber: bankingDetails.agencyNumber || '',
              accountNumber: bankingDetails.accountNumber || '',
              accountType: bankingDetails.accountType || 'checking',
            },
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
              accountType: true,
            },
          },
        },
      });

      logger.info('User updated by ID', {
        userId: finalUser?.id,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user: finalUser,
          message: 'Usuário atualizado com sucesso',
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error updating user by ID', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
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
          correlationId: req.correlationId,
        });
        return;
      }

      if (!profilePicture) {
        res.status(400).json({
          success: false,
          error: 'URL da foto de perfil é obrigatória',
          correlationId: req.correlationId,
        });
        return;
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
          correlationId: req.correlationId,
        });
        return;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { profilePicture },
        include: {
          bankingDetails: true,
        },
      });

      logger.info('Profile picture updated', {
        userId: updatedUser.id,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'Foto de perfil atualizada com sucesso',
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      logger.error('Error updating profile picture', {
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        correlationId: req.correlationId,
      });
    }
  }
}


export { UserController };
