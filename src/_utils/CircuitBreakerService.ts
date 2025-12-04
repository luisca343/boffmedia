import { Injectable } from '@nestjs/common';

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  requestTimeout: number;
}

interface Circuit {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

@Injectable()
export class CircuitBreakerService {
  private circuits = new Map<string, Circuit>();

  private defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 3,
    resetTimeout: 60000, // 1 minute
    requestTimeout: 10000, // 10 seconds
  };

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(key);

    // Check if circuit is open
    if (circuit.state === 'OPEN') {
      const now = Date.now();
      if (now - circuit.lastFailureTime < opts.resetTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${key}. Service temporarily unavailable.`);
      }
      // Try to recover
      circuit.state = 'HALF_OPEN';
      console.log(`🟡 Circuit breaker transitioning to HALF_OPEN for ${key}`);
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), opts.requestTimeout)
        ),
      ]);

      // Success - reset circuit
      if (circuit.state === 'HALF_OPEN') {
        console.log(`🟢 Circuit breaker recovered for ${key}`);
      }
      circuit.failures = 0;
      circuit.state = 'CLOSED';
      return result;
    } catch (error) {
      circuit.failures++;
      circuit.lastFailureTime = Date.now();

      if (circuit.failures >= opts.failureThreshold) {
        circuit.state = 'OPEN';
        console.error(`🔴 Circuit breaker OPEN for ${key} after ${circuit.failures} failures`);
      }

      throw error;
    }
  }

  private getOrCreateCircuit(key: string): Circuit {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
      });
    }
    return this.circuits.get(key)!;
  }

  getCircuitState(key: string): string {
    return this.circuits.get(key)?.state || 'CLOSED';
  }

  getAllCircuits(): Map<string, Circuit> {
    return this.circuits;
  }

  resetCircuit(key: string): void {
    const circuit = this.circuits.get(key);
    if (circuit) {
      circuit.failures = 0;
      circuit.state = 'CLOSED';
      circuit.lastFailureTime = 0;
      console.log(`🔄 Circuit breaker manually reset for ${key}`);
    }
  }
}
