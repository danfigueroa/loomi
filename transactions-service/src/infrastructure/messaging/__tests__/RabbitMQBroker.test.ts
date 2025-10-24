import { RabbitMQBroker } from '../RabbitMQBroker';
import { rabbitmqConfig } from '../../../config/rabbitmq';
import amqp from 'amqplib';

// Mock do amqplib
jest.mock('amqplib');
const mockAmqp = amqp as jest.Mocked<typeof amqp>;

describe('RabbitMQBroker', () => {
  let broker: RabbitMQBroker;
  let mockConnection: any;
  let mockChannel: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock connection e channel
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
      publish: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockResolvedValue({}),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue({}),
    };

    mockConnection = {
      createChannel: jest.fn().mockResolvedValue(mockChannel),
      close: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
    };

    mockAmqp.connect.mockResolvedValue(mockConnection);

    broker = new RabbitMQBroker();
  });

  afterEach(async () => {
    if (broker.isConnected()) {
      await broker.disconnect();
    }
  });

  describe('connect', () => {
    it('should connect to RabbitMQ successfully', async () => {
      await broker.connect();

      expect(mockAmqp.connect).toHaveBeenCalledWith(
        rabbitmqConfig.url,
        rabbitmqConfig.connectionOptions
      );
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(broker.isConnected()).toBe(true);
    });

    it('should setup exchanges and queues on connect', async () => {
      await broker.connect();

      // Verificar se exchanges foram criados
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        rabbitmqConfig.exchanges.transactions,
        'topic',
        { durable: true }
      );
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        rabbitmqConfig.exchanges.users,
        'topic',
        { durable: true }
      );

      // Verificar se filas foram criadas
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        rabbitmqConfig.queues.transactionCreated,
        { durable: true }
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        rabbitmqConfig.queues.transactionProcessed,
        { durable: true }
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockAmqp.connect.mockRejectedValue(error);

      await expect(broker.connect()).rejects.toThrow('Connection failed');
      expect(broker.isConnected()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      await broker.connect();
      const firstCallCount = mockAmqp.connect.mock.calls.length;

      await broker.connect();
      expect(mockAmqp.connect.mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await broker.connect();
      await broker.disconnect();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
      expect(broker.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', async () => {
      await expect(broker.disconnect()).resolves.not.toThrow();
    });
  });

  describe('publish', () => {
    beforeEach(async () => {
      await broker.connect();
    });

    it('should publish message successfully', async () => {
      const queue = 'test-queue';
      const message = { id: '123', data: 'test' };
      const options = { persistent: true };

      await broker.publish(queue, message, options);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        '',
        queue,
        Buffer.from(JSON.stringify(message)),
        options
      );
    });

    it('should throw error when not connected', async () => {
      await broker.disconnect();

      await expect(broker.publish('test-queue', {})).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });

    it('should handle publish errors', async () => {
      mockChannel.publish.mockReturnValue(false);

      await expect(broker.publish('test-queue', {})).rejects.toThrow(
        'Failed to publish message'
      );
    });
  });

  describe('consume', () => {
    beforeEach(async () => {
      await broker.connect();
    });

    it('should consume messages successfully', async () => {
      const queue = 'test-queue';
      const handler = jest.fn();
      const options = { noAck: false };

      await broker.consume(queue, handler, options);

      expect(mockChannel.consume).toHaveBeenCalledWith(
        queue,
        expect.any(Function),
        options
      );
    });

    it('should handle message processing', async () => {
      const queue = 'test-queue';
      const handler = jest.fn().mockResolvedValue(undefined);
      const message = {
        content: Buffer.from(JSON.stringify({ test: 'data' })),
        properties: {},
      };

      // Simular o callback do consume
      mockChannel.consume.mockImplementation((q, callback) => {
        callback(message);
        return Promise.resolve({});
      });

      await broker.consume(queue, handler);

      expect(handler).toHaveBeenCalledWith(
        { test: 'data' },
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should throw error when not connected', async () => {
      await broker.disconnect();

      await expect(broker.consume('test-queue', jest.fn())).rejects.toThrow(
        'Not connected to RabbitMQ'
      );
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(broker.isConnected()).toBe(false);
    });

    it('should return true when connected', async () => {
      await broker.connect();
      expect(broker.isConnected()).toBe(true);
    });
  });
});