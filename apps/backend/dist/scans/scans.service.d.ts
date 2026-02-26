import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class ScansService {
    private prisma;
    private scansQueue;
    constructor(prisma: PrismaService, scansQueue: Queue);
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
    quickScan(url: string, userId: string, scanType?: string, concurrentRequests?: number, durationSeconds?: number): Promise<{
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
    triggerScan(assetId: string, userId: string): Promise<{
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
    getScanStatus(scanId: string): Promise<{
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
