import { UserEventPublisher } from '../UserEventPublisher';
import { IMessageBroker } from '../../../domain/interfaces/IMessageBroker';
import { rabbitmqConfig } from '../../../config/rabbitmq';

describe('UserEventPublisher', () => {
  let publisher: UserEventPublisher;
  let mockBroker: jest.Mocked<IMessageBroker>;

  beforeEach(() => {
    mockBroker = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
      isConnected: jest.fn().mockReturnValue(true),
    };

    publisher = new UserEventPublisher(mockBroker);
  });

  describe('publishBankingDataUpdated', () => {
    it('should publish banking data updated event successfully', async () => {
      const userId = '123';
      const bankingData = {
        userId: '123',
        updatedFields: ['bankCode', 'agency'],
        updatedAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishBankingDataUpdated(userId, bankingData);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        rabbitmqConfig.queues.bankingDataUpdated,
        {
          eventType: 'BankingDataUpdated',
          userId,
          timestamp: expect.any(String),
          data: bankingData,
        },
        {
          correlationId: bankingData.correlationId,
          persistent: true,
        }
      );
    });

    it('should handle publish errors', async () => {
      const error = new Error('Publish failed');
      mockBroker.publish.mockRejectedValue(error);

      const userId = '123';
      const bankingData = {
        userId: '123',
        updatedFields: ['bankCode', 'agency'],
        updatedAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await expect(publisher.publishBankingDataUpdated(userId, bankingData)).rejects.toThrow(
        'Failed to publish banking data updated event'
      );
    });
  });

  describe('publishAuthenticationEvent', () => {
    it('should publish authentication event successfully', async () => {
      const userId = '123';
      const authData = {
        userId: '123',
        action: 'login' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
      };

      await publisher.publishAuthenticationEvent(userId, authData);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        rabbitmqConfig.queues.authenticationEvents,
        {
          eventType: 'UserAuthenticated',
          userId,
          timestamp: expect.any(String),
          data: authData,
        },
        {
          correlationId: authData.correlationId,
          persistent: true,
        }
      );
    });

    it('should handle authentication event publish errors', async () => {
      const error = new Error('Publish failed');
      mockBroker.publish.mockRejectedValue(error);

      const userId = '123';
      const authData = {
        userId: '123',
        action: 'login' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
      };

      await expect(publisher.publishAuthenticationEvent(userId, authData)).rejects.toThrow(
        'Failed to publish authentication event'
      );
    });
  });

  describe('event structure', () => {
    it('should include required event properties for banking data', async () => {
      const userId = '123';
      const bankingData = {
        userId: '123',
        updatedFields: ['bankCode', 'agency'],
        updatedAt: new Date(),
        correlationId: 'test-correlation-id',
      };

      await publisher.publishBankingDataUpdated(userId, bankingData);

      const publishCall = mockBroker.publish.mock.calls[0];
      const eventData = publishCall[1];

      expect(eventData).toHaveProperty('eventType');
      expect(eventData).toHaveProperty('userId');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('data');
      expect(eventData.eventType).toBe('BankingDataUpdated');
      expect(eventData.userId).toBe(userId);
      expect(typeof eventData.timestamp).toBe('string');
    });

    it('should include required event properties for authentication', async () => {
      const userId = '123';
      const authData = {
        userId: '123',
        action: 'login' as const,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        correlationId: 'test-correlation-id',
      };

      await publisher.publishAuthenticationEvent(userId, authData);

      const publishCall = mockBroker.publish.mock.calls[0];
      const eventData = publishCall[1];

      expect(eventData).toHaveProperty('eventType');
      expect(eventData).toHaveProperty('userId');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('data');
      expect(eventData.eventType).toBe('UserAuthenticated');
      expect(eventData.userId).toBe(userId);
      expect(typeof eventData.timestamp).toBe('string');
    });
  });
});