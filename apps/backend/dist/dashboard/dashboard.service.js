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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const [totalAssets, monitoredAssets, activeScans, completedScans, totalVulnerabilities, criticalVulns, highVulns, mediumVulns, lowVulns, recentScans, avgScore,] = await Promise.all([
            this.prisma.asset.count(),
            this.prisma.asset.count({ where: { isMonitored: true } }),
            this.prisma.scan.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
            this.prisma.scan.count({ where: { status: 'COMPLETED' } }),
            this.prisma.vulnerability.count(),
            this.prisma.vulnerability.count({ where: { severity: 'CRITICAL' } }),
            this.prisma.vulnerability.count({ where: { severity: 'HIGH' } }),
            this.prisma.vulnerability.count({ where: { severity: 'MEDIUM' } }),
            this.prisma.vulnerability.count({ where: { severity: 'LOW' } }),
            this.prisma.scan.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    asset: { select: { domain: true } },
                    _count: { select: { vulnerabilities: true } },
                },
            }),
            this.prisma.scan.aggregate({
                _avg: { score: true },
                where: { status: 'COMPLETED', score: { not: null } },
            }),
        ]);
        const firewallScore = avgScore._avg.score !== null
            ? Math.round(avgScore._avg.score * 10)
            : null;
        return {
            stats: {
                totalAssets,
                monitoredAssets,
                activeScans,
                completedScans,
                totalVulnerabilities,
                firewallScore,
            },
            vulnerabilityBreakdown: {
                critical: criticalVulns,
                high: highVulns,
                medium: mediumVulns,
                low: lowVulns,
            },
            recentScans: recentScans.map((scan) => ({
                id: scan.id,
                target: scan.asset.domain,
                status: scan.status,
                score: scan.score,
                vulnerabilities: scan._count.vulnerabilities,
                createdAt: scan.createdAt,
                startedAt: scan.startedAt,
                completedAt: scan.completedAt,
            })),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map