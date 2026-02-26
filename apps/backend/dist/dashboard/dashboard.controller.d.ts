import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
