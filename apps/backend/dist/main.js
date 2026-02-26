"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    });
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            const logger = new common_1.Logger('HTTP');
            logger.log(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        });
        next();
    });
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    common_1.Logger.log(`SentinelSec Backend is running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map