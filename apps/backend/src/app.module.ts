import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AssetsModule } from './assets/assets.module';
import { ScansModule } from './scans/scans.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        AssetsModule,
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            },
        }),
        ScansModule,
        DashboardModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
