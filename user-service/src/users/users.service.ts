import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { Logger as PinoLogger } from 'pino';
import { MetricsService } from 'src/metrics.service';

enum CircuitBreakerState {
    CLOSED,
    OPEN,
    HALF_OPEN,
}

@Injectable()
export class UsersService {
    private readonly logger: PinoLogger = new Logger(
        UsersService.name,
    ) as unknown as PinoLogger;

    private readonly retryAttempts: number = 3;
    private readonly retryInitialDelay: number = 500;

    // A simple in-memory "database" for demonstration
    private users: User[] = [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' },
        { id: '3', name: 'Charlie', email: 'charlie@example.com' },
    ];

    // Inject MetricsService
    constructor(private readonly metricsService: MetricsService) {
        // Initialize Prometheus gauge for circuit breaker state
        this.metricsService.circuitBreakerStateGauge.set(
            { service: 'product-service' },
            this.convertCircuitStateToNumber(this.circuitState),
        );
    }

    // Circuit Breaker Configuration
    private circuitState: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold: number = 3; // Number of consecutive failures to open the circuit
    private readonly resetTimeout: number = 10000; // Time in ms after which to attempt to close the circuit (e.g., 10 seconds)
    private readonly halfOpenTestCount: number = 1; // Number of requests to allow in HALF_OPEN state

    getUserById(id: string): User | undefined {
        return this.users.find((user) => user.id === id);
    }

    private convertCircuitStateToNumber(state: CircuitBreakerState): number {
        switch (state) {
            case CircuitBreakerState.CLOSED:
                return 0;
            case CircuitBreakerState.OPEN:
                return 1;
            case CircuitBreakerState.HALF_OPEN:
                return 2;
            default:
                return -1;
        }
    }

    private async retry<T>(
        fn: () => Promise<T>,
        retriesLeft: number,
        delay: number,
    ): Promise<T> {
        try {
            const result = await fn();
            this.resetFailureCount();
            return result;
        } catch (error) {
            const err = error as Error;
            this.metricsService.retryAttemptsTotal.inc({
                service: 'product-service',
            });
            this.recordFailure();
            this.logger.warn({
                message: `Attempt failed, retrying in ${delay}ms. Retries left: ${retriesLeft}.`,
                retriesLeft,
                delay,
                error: err.message,
                component: 'retry',
            });
            if (retriesLeft === 0) {
                this.logger.error({
                    message: `Max retries reached. Failed to execute function.`,
                    error: err.message,
                    component: 'retry',
                });
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.retry(fn, retriesLeft - 1, delay * 2);
        }
    }

    // Circuit Breaker Logic
    private recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (
            this.failureCount >= this.failureThreshold &&
            this.circuitState === CircuitBreakerState.CLOSED
        ) {
            this.logger.warn({
                message: 'Circuit Breaker: Threshold reached. Opening circuit!',
                component: 'circuit-breaker',
            });
            this.circuitState = CircuitBreakerState.OPEN;
            this.metricsService.circuitBreakerOpensTotal.inc({
                service: 'product-service',
            });
            this.metricsService.circuitBreakerStateGauge.set(
                { service: 'product-service' },
                this.convertCircuitStateToNumber(this.circuitState),
            );
        }
    }

    private resetFailureCount(): void {
        if (this.circuitState !== CircuitBreakerState.CLOSED) {
            this.logger.info({
                message:
                    'Circuit Breaker: Resetting failure count and closing circuit.',
                component: 'circuit-breaker',
            });
            this.circuitState = CircuitBreakerState.CLOSED;
            this.metricsService.circuitBreakerStateGauge.set(
                { service: 'product-service' },
                this.convertCircuitStateToNumber(this.circuitState),
            );
        }
        this.failureCount = 0;
    }

    private checkCircuit(): boolean {
        if (this.circuitState === CircuitBreakerState.OPEN) {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.logger.info({
                    message:
                        'Circuit Breaker: Timeout elapsed. Moving to HALF_OPEN state.',
                    component: 'circuit-breaker',
                });
                this.circuitState = CircuitBreakerState.HALF_OPEN;
                this.metricsService.circuitBreakerStateGauge.set(
                    { service: 'product-service' },
                    this.convertCircuitStateToNumber(this.circuitState),
                );
                this.failureCount = 0;
                return true;
            } else {
                this.logger.warn({
                    message:
                        'Circuit Breaker: Circuit is OPEN. Request rejected immediately.',
                    component: 'circuit-breaker',
                });
                this.metricsService.circuitBreakerShortCircuitedTotal.inc({
                    service: 'product-service',
                });
                return false;
            }
        } else if (this.circuitState === CircuitBreakerState.HALF_OPEN) {
            if (this.failureCount < this.halfOpenTestCount) {
                this.logger.info({
                    message: `Circuit Breaker: Circuit is HALF_OPEN. Allowing test request.`,
                    testCount: `${this.failureCount + 1}/${this.halfOpenTestCount}`,
                    component: 'circuit-breaker',
                });
                return true;
            } else {
                this.logger.warn({
                    message:
                        'Circuit Breaker: Test requests failed in HALF_OPEN. Re-opening circuit.',
                    component: 'circuit-breaker',
                });
                this.circuitState = CircuitBreakerState.OPEN;
                this.lastFailureTime = Date.now();
                this.metricsService.circuitBreakerStateGauge.set(
                    { service: 'product-service' },
                    this.convertCircuitStateToNumber(this.circuitState),
                );
                return false;
            }
        }
        this.metricsService.circuitBreakerStateGauge.set(
            { service: 'product-service' },
            this.convertCircuitStateToNumber(this.circuitState),
        );
        return true;
    }

    create() {
        return 'This action adds a new user';
    }

    // Method to call the Product Service with retry and circuit breaker logic
    async getRecommendedProduct(): Promise<Product> {
        this.metricsService.productServiceRequestsTotal.inc();

        if (!this.checkCircuit()) {
            throw new InternalServerErrorException(
                'Product service is currently unavailable (circuit open).',
            );
        }

        const productFetcher = async () => {
            const response = await fetch('http://localhost:3001/products/101');
            if (!response.ok) {
                this.logger.warn({
                    message: 'Product service response was not OK.',
                    status: response.status,
                    statusText: response.statusText,
                    component: 'http-call',
                });
                throw new Error(
                    `HTTP error! Status: ${response.status} - ${response.statusText}`,
                );
            }
            const product = (await response.json()) as Product;
            return product;
        };

        try {
            const result = await this.retry(
                productFetcher,
                this.retryAttempts,
                this.retryInitialDelay,
            );
            this.logger.info({
                message: 'Successfully fetched recommended product.',
                component: 'http-call',
            });
            return result;
        } catch (error) {
            const err = error as Error;
            this.logger.error({
                message:
                    'Failed to fetch recommended product after multiple retries or circuit open.',
                error: err.message,
                component: 'app-service',
            });
            throw new InternalServerErrorException(
                'Failed to retrieve recommended product due to upstream service issues.',
            );
        }
    }
}
