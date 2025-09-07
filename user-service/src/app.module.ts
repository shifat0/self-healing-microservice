import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsService } from './metrics.service';
import { LoggerModule } from 'nestjs-pino';

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: {
                formatters: {
                    level: (label: unknown) => {
                        return { level: String(label).toUpperCase() };
                    },
                    log: (object: Record<string, unknown>) => {
                        return {
                            ...object,
                            service: 'user-service',
                        };
                    },
                },
                timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
                // transport:
                //     process.env.NODE_ENV === 'production'
                //         ? undefined
                //         : {
                //               target: 'pino-pretty',
                //               options: {
                //                   colorize: true,
                //               },
                //           },
            },
        }),
    ],
    controllers: [AppController],
    providers: [AppService, MetricsService],
})
export class AppModule {}
