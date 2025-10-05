import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { UsersModule } from './users/users.module';

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
        UsersModule,
    ],
})
export class AppModule {}
