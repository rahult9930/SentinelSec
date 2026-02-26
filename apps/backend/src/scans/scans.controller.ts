import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ScansService } from './scans.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScansController {
    constructor(private readonly scansService: ScansService) { }

    @Get()
    findAll() {
        return this.scansService.findAll();
    }

    @Post('quick')
    quickScan(@Body() body: { url: string; scanType?: string; concurrentRequests?: number; durationSeconds?: number }, @Request() req: any) {
        return this.scansService.quickScan(body.url, req.user.userId, body.scanType, body.concurrentRequests, body.durationSeconds);
    }

    @Post(':assetId')
    triggerScan(@Param('assetId') assetId: string, @Request() req: any) {
        return this.scansService.triggerScan(assetId, req.user.userId);
    }

    @Get(':id/status')
    getScanStatus(@Param('id') id: string) {
        return this.scansService.getScanStatus(id);
    }
}
