"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let ScansService = class ScansService {
    prisma;
    scansQueue;
    constructor(prisma, scansQueue) {
        this.prisma = prisma;
        this.scansQueue = scansQueue;
    }
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
    async quickScan(url, userId, scanType, concurrentRequests, durationSeconds) {
        let domain = url.trim();
        if (!domain.startsWith('http'))
            domain = `https://${domain}`;
        let hostname;
        try {
            hostname = new URL(domain).hostname;
        }
        catch {
            hostname = domain.replace(/^https?:\/\//, '').split('/')[0];
        }
        let asset = await this.prisma.asset.findFirst({ where: { domain: hostname } });
        if (!asset) {
            asset = await this.prisma.asset.create({
                data: { domain: hostname, ports: [], services: [] },
            });
        }
        const scan = await this.prisma.scan.create({
            data: {
                assetId: asset.id,
                triggeredById: userId,
                status: 'PENDING',
            },
        });
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
    async triggerScan(assetId, userId) {
        const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
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
    async getScanStatus(scanId) {
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
        if (!scan)
            throw new common_1.NotFoundException('Scan not found');
        return scan;
    }
};
exports.ScansService = ScansService;
exports.ScansService = ScansService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('scans-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], ScansService);
//# sourceMappingURL=scans.service.js.map