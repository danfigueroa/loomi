import type { Request, Response } from 'express';
import { Router } from 'express';
import type { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';

/**
 * @swagger
 * tags:
 *   - name: 👥 Usuários
 *     description: |
 *       **Sistema Completo de Gerenciamento de Usuários**
 *
 *       Gerencie todo o ciclo de vida dos usuários da sua aplicação com segurança e eficiência.
 *
 *       **🚀 Recursos Principais:**
 *       - ✅ Registro seguro com validações
 *       - 🔐 Autenticação JWT robusta
 *       - 👤 Perfis personalizáveis
 *       - 📊 Gestão completa de dados
 *       - 🔒 Segurança avançada
 *       - 📱 Suporte a fotos de perfil
 *
 *       **💡 Casos de Uso:**
 *       - Onboarding de novos usuários
 *       - Autenticação e autorização
 *       - Gestão de perfis pessoais
 *       - Administração de contas
 *       - Integração com sistemas externos
 *
 *       **🛡️ Segurança:**
 *       - Hash seguro de senhas (bcrypt)
 *       - Tokens JWT com expiração
 *       - Validação rigorosa de dados
 *       - Logs de auditoria completos
 *       - Proteção contra ataques comuns
 */

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

  /**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: 🚀 Registrar Novo Usuário
 *     description: |
 *       Endpoint otimizado para criação de contas com validações completas e segurança avançada.
 *
 *       **✨ Destaques:**
 *       - Validação automática de email único
 *       - Hash seguro da senha
 *       - Campos opcionais flexíveis
 *       - Eventos de notificação automáticos
 *     tags: [👥 Usuários]
 */
  router.post('/register', (req: Request, res: Response) => userController.register(req as any, res));

  /**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 🔐 Fazer Login
 *     description: |
 *       Autenticação segura com geração de JWT token para acesso às rotas protegidas.
 *
 *       **✨ Destaques:**
 *       - Verificação segura de credenciais
 *       - Token JWT com expiração configurável
 *       - Cache de sessão no Redis
 *       - Logs de auditoria automáticos
 *     tags: [👥 Usuários]
 */
  router.post('/login', (req: Request, res: Response) => userController.login(req as any, res));

  /**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: 👤 Obter Perfil do Usuário
 *     description: |
 *       Recupera informações completas do perfil do usuário autenticado.
 *
 *       **📊 Informações Incluídas:**
 *       - Dados pessoais completos
 *       - Foto de perfil (se disponível)
 *       - Timestamps de criação e atualização
 *       - Status da conta
 *
 *       **🔒 Segurança:**
 *       - Requer autenticação JWT
 *       - Acesso apenas aos próprios dados
 *     tags: [👥 Usuários]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ✅ Perfil recuperado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *             examples:
 *               perfil_completo:
 *                 summary: Perfil Completo
 *                 value:
 *                   success: true
 *                   user:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     name: "João Silva Santos"
 *                     email: "joao.silva@email.com"
 *                     cpf: "12345678901"
 *                     address: "Rua das Flores, 123, Centro, São Paulo - SP"
 *                     profilePicture: "https://example.com/profile.jpg"
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *       401:
 *         description: 🔒 Token inválido ou ausente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 👤 Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
  router.get('/profile', authenticateToken as any, (req: Request, res: Response) => userController.getProfile(req as any, res));

  /**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Atualizar perfil do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva Santos"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.santos@example.com"
 *               address:
 *                 type: string
 *                 example: "Av. Paulista, 456"
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/photo.jpg"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       401:
 *         description: Token inválido
 *       409:
 *         description: Email já em uso
 */
  router.put('/profile', authenticateToken as any, (req: Request, res: Response) => userController.updateProfile(req as any, res));

  /**
 * @swagger
 * /api/users/{userId}:
 *   patch:
 *     summary: Atualizar dados do usuário por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva Santos"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao.santos@example.com"
 *               address:
 *                 type: string
 *                 example: "Av. Paulista, 456"
 *               bankingDetails:
 *                 type: object
 *                 properties:
 *                   bankCode:
 *                     type: string
 *                     example: "001"
 *                   agencyNumber:
 *                     type: string
 *                     example: "1234"
 *                   accountNumber:
 *                     type: string
 *                     example: "567890"
 *                   accountType:
 *                     type: string
 *                     example: "checking"
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 *       409:
 *         description: Email já em uso
 */
  router.patch('/:userId', (req: Request, res) => userController.updateUserById(req as any, res));

  /**
 * @swagger
 * /api/users/{userId}/profile-picture:
 *   patch:
 *     summary: Atualizar foto de perfil do usuário
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 example: "https://example.com/photo.jpg"
 *     responses:
 *       200:
 *         description: Foto de perfil atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Usuário não encontrado
 */
  router.patch('/:userId/profile-picture', (req: Request, res) => userController.updateProfilePicture(req as any, res));

  /**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Obter usuário por ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
  router.get('/:userId', (req: Request, res) => userController.getUserById(req as any, res));

  return router;
}
