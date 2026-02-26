import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'scans-queue',
        }),
    ],
    controllers: [ScansController],
    providers: [ScansService],
})
export class ScansModule { }
