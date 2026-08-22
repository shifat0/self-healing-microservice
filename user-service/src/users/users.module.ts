import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MetricsService } from 'src/metrics.service';
import { MetricsController } from 'src/metrics.controller';

@Module({
    controllers: [UsersController, MetricsController],
    providers: [UsersService, MetricsService],
})
export class UsersModule {}
