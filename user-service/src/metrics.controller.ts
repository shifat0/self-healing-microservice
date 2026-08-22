import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get('metrics')
    async getMetrics(
        @Res({ passthrough: true }) res: Response,
    ): Promise<string> {
        res.set('Content-Type', this.metricsService.register.contentType);
        return this.metricsService.getMetrics();
    }
}
