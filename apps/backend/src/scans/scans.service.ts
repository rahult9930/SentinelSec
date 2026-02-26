import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScansService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('scans-queue') private scansQueue: Queue,
    ) { }

    async findAll() {
        return this.prisma.scan.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                asset: { select: { domain: true, id: true } },
                triggeredBy: { select: { email: true } },
                _count: { select: { vulnerabilities: true } },
            },
        });
    }

    async quickScan(url: string, userId: string, scanType?: string, concurrentRequests?: number, durationSeconds?: number) {
        // Normalize domain
        let domain = url.trim();
        if (!domain.startsWith('http')) domain = `https://${domain}`;

        let hostname: string;
        try {
            hostname = new URL(domain).hostname;
        } catch {
            hostname = domain.replace(/^https?:\/\//, '').split('/')[0];
        }

        // Auto-create or find existing asset
        let asset = await this.prisma.asset.findFirst({ where: { domain: hostname } });
        if (!asset) {
            asset = await this.prisma.asset.create({
                data: { domain: hostname, ports: [], services: [] },
            });
        }

        // Create scan
        const scan = await this.prisma.scan.create({
            data: {
                assetId: asset.id,
                triggeredById: userId,
                status: 'PENDING',
            },
        });

        // Queue the job with scanType and load test config
        await this.scansQueue.add('execute-scan', {
            scanId: scan.id,
            assetId: asset.id,
            domain: domain,
            ip: asset.ip,
            ports: asset.ports,
            scanType: scanType || 'full',
            loadTestConfig: (scanType === 'loadtest' && concurrentRequests) ? {
                concurrentRequests: Math.min(concurrentRequests, 1000),
                durationSeconds: Math.min(durationSeconds || 10, 60),
            } : undefined,
        });

        return { scan, asset };
    }

    async triggerScan(assetId: string, userId: string) {
        const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new NotFoundException('Asset not found');

        const scan = await this.prisma.scan.create({
            data: {
                assetId,
                triggeredById: userId,
                status: 'PENDING',
            },
        });

        await this.scansQueue.add('execute-scan', {
            scanId: scan.id,
            assetId: asset.id,
            domain: asset.domain,
            ip: asset.ip,
            ports: asset.ports,
            scanType: 'full',
        });

        return scan;
    }

    async getScanStatus(scanId: string) {
        const scan = await this.prisma.scan.findUnique({
            where: { id: scanId },
            include: {
                vulnerabilities: {
                    orderBy: [
                        { severity: 'asc' },
                        { cvssScore: 'desc' },
                    ],
                },
                asset: true,
                triggeredBy: { select: { email: true } },
            },
        });
        if (!scan) throw new NotFoundException('Scan not found');
        return scan;
    }
}
