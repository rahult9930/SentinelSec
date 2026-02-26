import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        stats: {
            totalAssets: number;
            monitoredAssets: number;
            activeScans: number;
            completedScans: number;
            totalVulnerabilities: number;
            firewallScore: number | null;
        };
        vulnerabilityBreakdown: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        recentScans: {
            id: string;
            target: string;
            status: import(".prisma/client").$Enums.ScanStatus;
            score: number | null;
            vulnerabilities: number;
            createdAt: Date;
            startedAt: Date | null;
            completedAt: Date | null;
        }[];
    }>;
}
