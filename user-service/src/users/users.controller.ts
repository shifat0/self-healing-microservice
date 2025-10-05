import {
    Controller,
    Get,
    NotFoundException,
    Param,
    Req,
    Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { MetricsService } from 'src/metrics.service';
import type { Request, Response } from 'express';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly metricsService: MetricsService,
    ) {}

    private async recordHttpRequest(
        req: Request,
        res: Response,
        next: () => any,
    ) {
        try {
            // const start = Date.now();
            res.on('finish', () => {
                // const duration = Date.now() - start; // Not used for now, but useful for histograms
                this.metricsService.httpRequestTotal.inc({
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                });
            });
            await next();
        } catch (error) {
            console.error('Error recording HTTP request:', error);
        }
    }

    // Endpoint to get user details by ID
    @Get('/:id')
    async getUser(
        @Param('id') id: string,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<any> {
        try {
            await this.recordHttpRequest(req, res, () => {
                const user = this.usersService.getUserById(id);
                if (!user) {
                    throw new NotFoundException('User not found');
                }

                res.status(200).json({ data: user });
            });
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }

    // New endpoint to get user details along with a recommended product
    // This demonstrates inter-service communication
    @Get('/:id/recommendation')
    async getUserWithRecommendation(@Param('id') id: string): Promise<any> {
        const user = this.usersService.getUserById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found.`);
        }

        try {
            // Call the Product Service internally.
            // 'product-service' is the hostname provided by Docker Compose's internal DNS.
            const recommendedProduct =
                await this.usersService.getRecommendedProduct();
            return {
                user,
                recommendedProduct,
            };
        } catch (error) {
            console.error('Error fetching recommended product:', error);
            // In a real application, you might return a default product,
            // or handle the error gracefully (e.g., return user without recommendation).
            return {
                user,
                recommendedProduct: { error: 'Could not fetch recommendation' },
            };
        }
    }

    // Health check endpoint
    @Get('health')
    healthCheck(): string {
        return 'User Service is healthy!';
    }

    @Get('metrics')
    async getPrometheusMetrics(
        @Res({ passthrough: true }) res: Response,
    ): Promise<string> {
        res.set('Content-Type', this.metricsService.register.contentType);
        return await this.metricsService.getMetrics();
    }
}
