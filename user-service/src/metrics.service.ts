import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
    public register: client.Registry;

    // Define Prometheus metrics
    public httpRequestTotal: client.Counter<string>;
    public productServiceRequestsTotal: client.Counter<string>;
    public retryAttemptsTotal: client.Counter<string>;
    public circuitBreakerStateGauge: client.Gauge<string>;
    public circuitBreakerOpensTotal: client.Counter<string>;
    public circuitBreakerShortCircuitedTotal: client.Counter<string>;

    constructor() {
        this.register = new client.Registry();
        // Clear default metrics to avoid conflicts if running multiple times in dev
        this.register.clear();
        client.collectDefaultMetrics({ register: this.register });

        // Initialize custom metrics
        this.httpRequestTotal = new client.Counter({
            name: 'http_request_total',
            help: 'Total number of HTTP requests processed by the service',
            labelNames: ['method', 'path', 'status'],
            registers: [this.register],
        });

        this.productServiceRequestsTotal = new client.Counter({
            name: 'product_service_requests_total',
            help: 'Total number of requests made by User Service to Product Service',
            registers: [this.register],
        });

        this.retryAttemptsTotal = new client.Counter({
            name: 'retry_attempts_total',
            help: 'Total number of retry attempts made for Product Service requests',
            labelNames: ['service'], // Label to distinguish which service is being retried
            registers: [this.register],
        });

        this.circuitBreakerStateGauge = new client.Gauge({
            name: 'circuit_breaker_state',
            help: 'Current state of the circuit breaker (0=closed, 1=open, 2=half_open)',
            labelNames: ['service'], // Label to distinguish which service circuit breaker is for
            registers: [this.register],
        });

        this.circuitBreakerOpensTotal = new client.Counter({
            name: 'circuit_breaker_opens_total',
            help: 'Total number of times the circuit breaker has transitioned to open state',
            labelNames: ['service'],
            registers: [this.register],
        });

        this.circuitBreakerShortCircuitedTotal = new client.Counter({
            name: 'circuit_breaker_short_circuited_total',
            help: 'Total number of requests short-circuited by the circuit breaker (failed fast)',
            labelNames: ['service'],
            registers: [this.register],
        });
    }

    // Method to get all metrics in Prometheus format
    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}
