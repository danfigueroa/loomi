import { Response } from 'express';
import { ITransactionService } from '../../domain/interfaces/ITransactionService';
import { AppError } from '../../shared/errors/AppError';
import { RequestWithCorrelationId } from '../../middlewares/correlationId';
import { 
  createTransactionSchema, 
  getTransactionByIdSchema, 
  getTransactionsByUserSchema,
  paginationSchema 
} from '../../shared/validation/TransactionValidation';

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionRequest:
 *       type: object
 *       required:
 *         - fromUserId
 *         - toUserId
 *         - amount
 *       properties:
 *         fromUserId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que está enviando a transação
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         toUserId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que está recebendo a transação
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         amount:
 *           type: number
 *           format: decimal
 *           minimum: 0.01
 *           maximum: 999999.99
 *           description: Valor da transação em reais
 *           example: 150.75
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Descrição opcional da transação
 *           example: "Pagamento de serviços de consultoria"
 *         type:
 *           type: string
 *           enum: [TRANSFER, DEPOSIT, WITHDRAWAL]
 *           description: Tipo da transação
 *           example: "TRANSFER"
 *     
 *     TransactionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da transação
 *           example: "550e8400-e29b-41d4-a716-446655440002"
 *         fromUserId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário remetente
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         toUserId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário destinatário
 *           example: "550e8400-e29b-41d4-a716-446655440001"
 *         amount:
 *           type: number
 *           format: decimal
 *           description: Valor da transação
 *           example: 150.75
 *         description:
 *           type: string
 *           description: Descrição da transação
 *           example: "Pagamento de serviços de consultoria"
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED]
 *           description: Status atual da transação
 *           example: "PENDING"
 *         type:
 *           type: string
 *           enum: [TRANSFER, DEPOSIT, WITHDRAWAL]
 *           description: Tipo da transação
 *           example: "TRANSFER"
 *         externalReference:
 *           type: string
 *           description: Referência externa da transação
 *           example: "REF-2024-001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da transação
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 *           example: "2024-01-15T10:30:00Z"
 *         processedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Data de processamento da transação
 *           example: "2024-01-15T10:35:00Z"
 *     
 *     CreateTransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica se a operação foi bem-sucedida
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/TransactionResponse'
 *         message:
 *           type: string
 *           description: Mensagem de sucesso
 *           example: "Transaction created successfully"
 *     
 *     GetTransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica se a operação foi bem-sucedida
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/TransactionResponse'
 *     
 *     TransactionListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica se a operação foi bem-sucedida
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TransactionResponse'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *               description: Página atual
 *               example: 1
 *             limit:
 *               type: number
 *               description: Itens por página
 *               example: 10
 *             total:
 *               type: number
 *               description: Total de transações
 *               example: 25
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export class TransactionController {
  constructor(private transactionService: ITransactionService) {}

  /**
   * @swagger
   * /api/transactions:
   *   post:
   *     summary: 🚀 Criar Nova Transação
   *     description: |
   *       Cria uma nova transação financeira entre dois usuários. 
   *       
   *       **Funcionalidades:**
   *       - ✅ Validação automática de usuários
   *       - ✅ Verificação de saldo disponível
   *       - ✅ Processamento em tempo real
   *       - ✅ Notificações automáticas
   *       - ✅ Rastreamento completo
   *       
   *       **Casos de Uso:**
   *       - Transferências entre contas
   *       - Pagamentos de serviços
   *       - Depósitos e saques
   *       - Transações comerciais
   *     tags: [💰 Transações]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TransactionRequest'
   *           examples:
   *             transferencia_simples:
   *               summary: Transferência Simples
   *               description: Exemplo de uma transferência básica entre usuários
   *               value:
   *                 fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                 toUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                 amount: 150.75
   *                 description: "Pagamento de serviços de consultoria"
   *                 type: "TRANSFER"
   *             pagamento_comercial:
   *               summary: Pagamento Comercial
   *               description: Exemplo de pagamento para estabelecimento comercial
   *               value:
   *                 fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                 toUserId: "550e8400-e29b-41d4-a716-446655440002"
   *                 amount: 89.90
   *                 description: "Compra na loja XYZ - Pedido #12345"
   *                 type: "TRANSFER"
   *             deposito:
   *               summary: Depósito
   *               description: Exemplo de depósito em conta
   *               value:
   *                 fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                 toUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                 amount: 500.00
   *                 description: "Depósito via PIX"
   *                 type: "DEPOSIT"
   *     responses:
   *       201:
   *         description: ✅ Transação criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CreateTransactionResponse'
   *             examples:
   *               sucesso:
   *                 summary: Transação Criada
   *                 value:
   *                   success: true
   *                   data:
   *                     id: "550e8400-e29b-41d4-a716-446655440002"
   *                     fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                     toUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                     amount: 150.75
   *                     description: "Pagamento de serviços de consultoria"
   *                     status: "PENDING"
   *                     type: "TRANSFER"
   *                     externalReference: "REF-2024-001"
   *                     createdAt: "2024-01-15T10:30:00Z"
   *                     updatedAt: "2024-01-15T10:30:00Z"
   *                   message: "Transaction created successfully"
   *       400:
   *         description: ❌ Dados inválidos ou regra de negócio violada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               valor_invalido:
   *                 summary: Valor Inválido
   *                 value:
   *                   error: "Amount must be greater than zero"
   *                   code: "INVALID_AMOUNT"
   *                   correlationId: "req-123456"
   *                   timestamp: "2024-01-15T10:30:00Z"
   *               mesmo_usuario:
   *                 summary: Mesmo Usuário
   *                 value:
   *                   error: "Cannot transfer to the same user"
   *                   code: "SAME_USER_TRANSFER"
   *                   correlationId: "req-123456"
   *                   timestamp: "2024-01-15T10:30:00Z"
   *       401:
   *         description: 🔒 Token de autenticação inválido ou ausente
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
   *       429:
   *         description: 🚦 Muitas tentativas - Rate limit excedido
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
  async createTransaction(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { error, value } = createTransactionSchema.validate(req.body);
      
      if (error) {
        throw new AppError(error.details[0]?.message || 'Validation error', 400);
      }

      const transaction = await this.transactionService.createTransaction(value);
      
      res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaction created successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * @swagger
   * /api/transactions/{id}:
   *   get:
   *     summary: 🔍 Buscar Transação por ID
   *     description: |
   *       Recupera os detalhes completos de uma transação específica pelo seu ID único.
   *       
   *       **Informações Retornadas:**
   *       - 📊 Status atual da transação
   *       - 💰 Valor e descrição
   *       - 👥 Usuários envolvidos
   *       - 📅 Timestamps de criação e processamento
   *       - 🔗 Referência externa (se disponível)
   *       
   *       **Casos de Uso:**
   *       - Consulta de comprovantes
   *       - Acompanhamento de status
   *       - Auditoria de transações
   *       - Suporte ao cliente
   *     tags: [💰 Transações]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID único da transação
   *         example: "550e8400-e29b-41d4-a716-446655440002"
   *     responses:
   *       200:
   *         description: ✅ Transação encontrada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/GetTransactionResponse'
   *             examples:
   *               transacao_pendente:
   *                 summary: Transação Pendente
   *                 value:
   *                   success: true
   *                   data:
   *                     id: "550e8400-e29b-41d4-a716-446655440002"
   *                     fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                     toUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                     amount: 150.75
   *                     description: "Pagamento de serviços de consultoria"
   *                     status: "PENDING"
   *                     type: "TRANSFER"
   *                     externalReference: "REF-2024-001"
   *                     createdAt: "2024-01-15T10:30:00Z"
   *                     updatedAt: "2024-01-15T10:30:00Z"
   *               transacao_concluida:
   *                 summary: Transação Concluída
   *                 value:
   *                   success: true
   *                   data:
   *                     id: "550e8400-e29b-41d4-a716-446655440003"
   *                     fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                     toUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                     amount: 89.90
   *                     description: "Compra na loja XYZ"
   *                     status: "COMPLETED"
   *                     type: "TRANSFER"
   *                     externalReference: "REF-2024-002"
   *                     createdAt: "2024-01-15T09:15:00Z"
   *                     updatedAt: "2024-01-15T09:20:00Z"
   *                     processedAt: "2024-01-15T09:20:00Z"
   *       400:
   *         description: ❌ ID da transação inválido
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: 🔒 Token de autenticação inválido ou ausente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: 🔍 Transação não encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               nao_encontrada:
   *                 summary: Transação Não Encontrada
   *                 value:
   *                   error: "Transaction not found"
   *                   code: "TRANSACTION_NOT_FOUND"
   *                   correlationId: "req-123456"
   *                   timestamp: "2024-01-15T10:30:00Z"
   *       500:
   *         description: 🔥 Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getTransactionById(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const { error, value } = getTransactionByIdSchema.validate(req.params);
      
      if (error) {
        throw new AppError(error.details[0]?.message || 'Validation error', 400);
      }

      const transaction = await this.transactionService.getTransactionById(value.id);
      
      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * @swagger
   * /api/transactions/user/{userId}:
   *   get:
   *     summary: 📋 Listar Transações do Usuário
   *     description: |
   *       Recupera o histórico completo de transações de um usuário específico com paginação inteligente.
   *       
   *       **Recursos Avançados:**
   *       - 📄 Paginação otimizada para performance
   *       - 🔄 Ordenação por data (mais recentes primeiro)
   *       - 📊 Contadores de total de registros
   *       - 🚀 Cache automático para consultas frequentes
   *       - 🔍 Filtros por status e tipo (futuro)
   *       
   *       **Informações por Transação:**
   *       - 💰 Valores e descrições
   *       - 📅 Datas de criação e processamento
   *       - 🎯 Status atual detalhado
   *       - 👥 Informações dos usuários envolvidos
   *       
   *       **Casos de Uso:**
   *       - Extrato bancário digital
   *       - Relatórios financeiros
   *       - Auditoria de movimentações
   *       - Análise de padrões de gastos
   *     tags: [💰 Transações]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID único do usuário
   *         example: "550e8400-e29b-41d4-a716-446655440000"
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Número da página para paginação
   *         example: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: Quantidade de itens por página (máximo 100)
   *         example: 10
   *     responses:
   *       200:
   *         description: ✅ Lista de transações recuperada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TransactionListResponse'
   *             examples:
   *               historico_completo:
   *                 summary: Histórico com Múltiplas Transações
   *                 value:
   *                   success: true
   *                   data:
   *                     - id: "550e8400-e29b-41d4-a716-446655440002"
   *                       fromUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                       toUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                       amount: 150.75
   *                       description: "Pagamento de serviços de consultoria"
   *                       status: "COMPLETED"
   *                       type: "TRANSFER"
   *                       externalReference: "REF-2024-001"
   *                       createdAt: "2024-01-15T10:30:00Z"
   *                       updatedAt: "2024-01-15T10:35:00Z"
   *                       processedAt: "2024-01-15T10:35:00Z"
   *                     - id: "550e8400-e29b-41d4-a716-446655440003"
   *                       fromUserId: "550e8400-e29b-41d4-a716-446655440001"
   *                       toUserId: "550e8400-e29b-41d4-a716-446655440000"
   *                       amount: 89.90
   *                       description: "Reembolso de compra"
   *                       status: "COMPLETED"
   *                       type: "TRANSFER"
   *                       externalReference: "REF-2024-002"
   *                       createdAt: "2024-01-14T15:20:00Z"
   *                       updatedAt: "2024-01-14T15:25:00Z"
   *                       processedAt: "2024-01-14T15:25:00Z"
   *                   pagination:
   *                     page: 1
   *                     limit: 10
   *                     total: 25
   *               lista_vazia:
   *                 summary: Usuário Sem Transações
   *                 value:
   *                   success: true
   *                   data: []
   *                   pagination:
   *                     page: 1
   *                     limit: 10
   *                     total: 0
   *       400:
   *         description: ❌ Parâmetros de consulta inválidos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             examples:
   *               parametros_invalidos:
   *                 summary: Parâmetros Inválidos
   *                 value:
   *                   error: "Invalid pagination parameters"
   *                   code: "INVALID_PAGINATION"
   *                   correlationId: "req-123456"
   *                   timestamp: "2024-01-15T10:30:00Z"
   *       401:
   *         description: 🔒 Token de autenticação inválido ou ausente
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
   *       500:
   *         description: 🔥 Erro interno do servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */
  async getTransactionsByUserId(req: RequestWithCorrelationId, res: Response): Promise<void> {
    try {
      const paramsValidation = getTransactionsByUserSchema.validate(req.params);
      const queryValidation = paginationSchema.validate(req.query);
      
      if (paramsValidation.error) {
        throw new AppError(paramsValidation.error.details[0]?.message || 'Validation error', 400);
      }
      
      if (queryValidation.error) {
        throw new AppError(queryValidation.error.details[0]?.message || 'Validation error', 400);
      }

      const { userId } = paramsValidation.value;
      const { page, limit } = queryValidation.value;

      const result = await this.transactionService.getTransactionsByUserId(
        userId, 
        page, 
        limit
      );
      
      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: {
          page,
          limit,
          total: result.total,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}