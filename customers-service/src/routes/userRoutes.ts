import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middlewares/auth';

export function createUserRoutes(userController: UserController): Router {
  const router = Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               cpf:
 *                 type: string
 *                 example: "12345678901"
 *               address:
 *                 type: string
 *                 example: "Rua das Flores, 123"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já existe
 */
router.post('/register', (req: Request, res: Response) => userController.register(req as any, res));

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', (req: Request, res: Response) => userController.login(req as any, res));

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obter perfil do usuário
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do usuário
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Usuário não encontrado
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