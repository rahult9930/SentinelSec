import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });

    // Request logging middleware
    app.use((req: any, res: any, next: any) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const logger = new Logger('HTTP');
            logger.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        });
        next();
    });

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    Logger.log(`SentinelSec Backend is running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
