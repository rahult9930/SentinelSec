import { AssetsService } from './assets.service';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    create(body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        ip: string | null;
        ports: number[];
        services: string[];
        isMonitored: boolean;
    }>;
    findAll(): Promise<({
        _count: {
            scans: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        ip: string | null;
        ports: number[];
        services: string[];
        isMonitored: boolean;
    })[]>;
    findOne(id: string): Promise<{
        scans: ({
            _count: {
                vulnerabilities: number;
            };
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        ip: string | null;
        ports: number[];
        services: string[];
        isMonitored: boolean;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        ip: string | null;
        ports: number[];
        services: string[];
        isMonitored: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        domain: string;
        ip: string | null;
        ports: number[];
        services: string[];
        isMonitored: boolean;
    }>;
}
