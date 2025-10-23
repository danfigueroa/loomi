import { logger } from '@/config/logger';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export class CustomersServiceClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private circuitBreaker: CircuitBreakerState;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000;

  constructor() {
    this.baseUrl = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:3001';
    this.timeout = parseInt(process.env.HTTP_TIMEOUT || '5000');
    this.maxRetries = parseInt(process.env.HTTP_MAX_RETRIES || '3');
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    };
  }

  async getUserById(userId: string, correlationId?: string): Promise<User | null> {
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is OPEN - customers service unavailable');
    }

    try {
      const user = await this.executeWithRetry(
        () => this.makeRequest(`/api/users/${userId}`, correlationId),
        correlationId
      );

      this.onSuccess();
      return user;
    } catch (error) {
      this.onFailure();
      logger.error('Failed to get user from customers service', {
        userId,
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    correlationId?: string,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      const delay = this.calculateBackoffDelay(attempt);
      logger.warn('Retrying request to customers service', {
        attempt,
        maxRetries: this.maxRetries,
        delay,
        correlationId
      });

      await this.sleep(delay);
      return this.executeWithRetry(operation, correlationId, attempt + 1);
    }
  }

  private async makeRequest(endpoint: string, correlationId?: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      if (now - this.circuitBreaker.lastFailureTime > this.recoveryTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        logger.info('Circuit breaker moved to HALF_OPEN state');
        return false;
      }
      return true;
    }
    return false;
  }

  private onSuccess(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      logger.info('Circuit breaker moved to CLOSED state');
    }
  }

  private onFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      logger.warn('Circuit breaker moved to OPEN state', {
        failures: this.circuitBreaker.failures,
        threshold: this.failureThreshold
      });
    }
  }

  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return delay + Math.random() * 1000;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}