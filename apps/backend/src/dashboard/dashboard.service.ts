import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const [
            totalAssets,
            monitoredAssets,
            activeScans,
            completedScans,
            totalVulnerabilities,
            criticalVulns,
            highVulns,
            mediumVulns,
            lowVulns,
            recentScans,
            avgScore,
        ] = await Promise.all([
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
}
