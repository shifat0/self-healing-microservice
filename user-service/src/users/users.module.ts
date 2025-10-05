import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MetricsService } from 'src/metrics.service';

@Module({
    controllers: [UsersController],
    providers: [UsersService, MetricsService],
})
export class UsersModule {}
