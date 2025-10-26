import { TransactionEventPublisher } from '../TransactionEventPublisher';
import { IMessageBroker } from '../../../domain/interfaces/IMessageBroker';
import { rabbitmqConfig } from '../../../config/rabbitmq';

describe('TransactionEventPublisher', () => {
  let publisher: TransactionEventPublisher;
  let mockBroker: jest.Mocked<IMessageBroker>;

  beforeEach(() => {
    mockBroker = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
    };

    publisher = new TransactionEventPublisher(mockBroker);
  });

  describe('publishTransactionCreated', () => {
    it('should publish transaction created event successfully', async () => {
      const transactionId = '123';
      const transactionData = {
        transactionId: '123',
        fromUserId: '456',
        toUserId: '789',
        amount: 100.50,
        type: 'credit',
        description: 'Test transaction',
        createdAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishTransactionCreated(transactionId, transactionData);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        rabbitmqConfig.queues.transactionCreated,
        {
          eventType: 'TransactionCreated',
          transactionId,
          timestamp: expect.any(String),
          data: transactionData,
        },
        {
          correlationId: transactionData.correlationId,
          persistent: true,
        }
      );
    });

    it('should handle publish errors', async () => {
      const error = new Error('Publish failed');
      mockBroker.publish.mockRejectedValue(error);

      const transactionId = '123';
      const transactionData = {
        transactionId: '123',
        fromUserId: '456',
        toUserId: '789',
        amount: 100.50,
        type: 'credit',
        description: 'Test transaction',
        createdAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await expect(publisher.publishTransactionCreated(transactionId, transactionData)).rejects.toThrow(
        'Failed to publish transaction created event'
      );
    });
  });

  describe('publishTransactionProcessed', () => {
    it('should publish transaction processed event successfully', async () => {
      const transactionId = '123';
      const transactionData = {
        transactionId: '123',
        status: 'completed',
        processedAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishTransactionProcessed(transactionId, transactionData);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        rabbitmqConfig.queues.transactionProcessed,
        {
          eventType: 'TransactionProcessed',
          transactionId,
          timestamp: expect.any(String),
          data: transactionData,
        },
        {
          correlationId: transactionData.correlationId,
          persistent: true,
        }
      );
    });
  });

  describe('publishTransactionCancelled', () => {
    it('should publish transaction cancelled event successfully', async () => {
      const transactionId = '123';
      const transactionData = {
        transactionId: '123',
        reason: 'User requested cancellation',
        cancelledAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishTransactionCancelled(transactionId, transactionData);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        rabbitmqConfig.queues.transactionCancelled,
        {
          eventType: 'TransactionCancelled',
          transactionId,
          timestamp: expect.any(String),
          data: transactionData,
        },
        {
          correlationId: transactionData.correlationId,
          persistent: true,
        }
      );
    });
  });

  describe('event structure', () => {
    it('should include required event properties', async () => {
      const transactionId = '123';
      const transactionData = {
        transactionId: '123',
        fromUserId: '456',
        toUserId: '789',
        amount: 100.50,
        type: 'credit',
        description: 'Test transaction',
        createdAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishTransactionCreated(transactionId, transactionData);

      const publishCall = mockBroker.publish.mock.calls[0];
      const eventData = publishCall?.[1];

      expect(eventData).toHaveProperty('eventType');
      expect(eventData).toHaveProperty('transactionId');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('data');
      expect(eventData.eventType).toBe('TransactionCreated');
      expect(eventData.transactionId).toBe(transactionId);
      expect(typeof eventData.timestamp).toBe('string');
    });
  });
});