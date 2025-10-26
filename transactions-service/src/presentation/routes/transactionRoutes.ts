import { Router, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/TransactionController';
import { TransactionService } from '../../application/services/TransactionService';
import { TransactionRepository } from '../../infrastructure/repositories/TransactionRepository';
import { CustomerService } from '../../infrastructure/services/CustomerService';
import { RabbitMQBroker } from '../../infrastructure/messaging/RabbitMQBroker';
import { TransactionEventPublisher } from '../../infrastructure/messaging/TransactionEventPublisher';
import { prisma } from '../../config/database';
import { authenticateToken } from '../../shared/middlewares/auth';
import { createRateLimiter } from '../../shared/middlewares/rateLimiter';

import { RequestWithCorrelationId } from '../../middlewares/correlationId';

/**
 * @swagger
 * tags:
 *   - name: 💰 Transações
 *     description: |
 *       **Sistema Completo de Transações Financeiras**
 *       
 *       Gerencie todas as operações financeiras da sua aplicação com segurança e eficiência.
 *       
 *       **🚀 Recursos Principais:**
 *       - ✅ Criação de transações em tempo real
 *       - 🔍 Consulta detalhada por ID
 *       - 📋 Histórico completo por usuário
 *       - 🔒 Autenticação JWT obrigatória
 *       - 🚦 Rate limiting inteligente
 *       - 📊 Paginação otimizada
 *       - 🔔 Notificações automáticas
 *       
 *       **💡 Casos de Uso:**
 *       - Transferências P2P
 *       - Pagamentos comerciais
 *       - Depósitos e saques
 *       - Relatórios financeiros
 *       - Auditoria de movimentações
 *       
 *       **🛡️ Segurança:**
 *       - Validação rigorosa de dados
 *       - Verificação de saldo automática
 *       - Logs de auditoria completos
 *       - Rate limiting por endpoint
 */

const router = Router();

// Database connection is always available now

const transactionRepository = new TransactionRepository(prisma);
const customerService = new CustomerService();
const messageBroker = new RabbitMQBroker();
const transactionEventPublisher = new TransactionEventPublisher(messageBroker);
const transactionService = new TransactionService(transactionRepository, customerService, transactionEventPublisher);
const transactionController = new TransactionController(transactionService);

const transactionRateLimit = process.env['NODE_ENV'] === 'test' 
  ? createRateLimiter(60000, 5)
  : createRateLimiter(60000, 10);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: 🚀 Criar Nova Transação
 *     description: |
 *       Endpoint principal para criação de transações financeiras seguras.
 *       
 *       **⚡ Rate Limiting:**
 *       - Produção: 10 transações por minuto
 *       - Teste: 5 transações por minuto
 *       
 *       **🔒 Autenticação:**
 *       - JWT Bearer Token obrigatório
 *       - Validação automática de usuário
 *     tags: [💰 Transações]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  transactionRateLimit,
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.createTransaction(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: 🔍 Buscar Transação por ID
 *     description: |
 *       Recupera informações detalhadas de uma transação específica.
 *       
 *       **📊 Informações Incluídas:**
 *       - Status atual e histórico
 *       - Valores e descrições
 *       - Usuários envolvidos
 *       - Timestamps completos
 *       
 *       **🔒 Autenticação:**
 *       - JWT Bearer Token obrigatório
 *     tags: [💰 Transações]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.getTransactionById(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/transactions/user/{userId}:
 *   get:
 *     summary: 📋 Listar Transações do Usuário
 *     description: |
 *       Recupera o histórico completo de transações de um usuário com paginação inteligente.
 *       
 *       **📄 Paginação Otimizada:**
 *       - Máximo 100 itens por página
 *       - Ordenação por data (mais recentes primeiro)
 *       - Contadores de total automáticos
 *       
 *       **🚀 Performance:**
 *       - Cache automático para consultas frequentes
 *       - Índices otimizados no banco
 *       - Queries eficientes
 *       
 *       **🔒 Autenticação:**
 *       - JWT Bearer Token obrigatório
 *     tags: [💰 Transações]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/user/:userId',
  authenticateToken,
  async (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
    try {
      await transactionController.getTransactionsByUserId(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as transactionRoutes };