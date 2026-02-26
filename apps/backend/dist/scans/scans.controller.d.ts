import { ScansService } from './scans.service';
export declare class ScansController {
    private readonly scansService;
    constructor(scansService: ScansService);
    findAll(): Promise<({
        asset: {
            id: string;
            domain: string;
        };
        _count: {
            vulnerabilities: number;
        };
        triggeredBy: {
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        assetId: string;
        triggeredById: string | null;
        status: import(".prisma/client").$Enums.ScanStatus;
        score: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    quickScan(body: {
        url: string;
        scanType?: string;
        concurrentRequests?: number;
        durationSeconds?: number;
    }, req: any): Promise<{
        scan: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            assetId: string;
            triggeredById: string | null;
            status: import(".prisma/client").$Enums.ScanStatus;
            score: number | null;
            startedAt: Date | null;
            completedAt: Date | null;
        };
        asset: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            domain: string;
            ip: string | null;
            ports: number[];
            services: string[];
            isMonitored: boolean;
        };
    }>;
    triggerScan(assetId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        assetId: string;
        triggeredById: string | null;
        status: import(".prisma/client").$Enums.ScanStatus;
        score: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
    getScanStatus(id: string): Promise<{
        asset: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            domain: string;
            ip: string | null;
            ports: number[];
            services: string[];
            isMonitored: boolean;
        };
        vulnerabilities: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            cvssScore: number | null;
            severity: string;
            scanId: string;
            title: string;
            description: string;
            mitigation: string | null;
            isFixed: boolean;
        }[];
        triggeredBy: {
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        assetId: string;
        triggeredById: string | null;
        status: import(".prisma/client").$Enums.ScanStatus;
        score: number | null;
        startedAt: Date | null;
        completedAt: Date | null;
    }>;
}
