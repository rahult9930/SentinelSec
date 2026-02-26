export interface ScanTarget {
    scanId: string;
    assetId: string;
    domain: string;
    ip: string | null;
    ports: number[];
    scanType?: 'full' | 'pentest' | 'loadtest';
    loadTestConfig?: {
        concurrentRequests: number;
        durationSeconds: number;
    };
}

export interface VulnerabilityResult {
    title: string;
    description: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    cvssScore?: number;
    mitigation?: string;
    scannerName?: string;
}

export interface ScannerModule {
    name: string;
    scanTypes: string[];
    execute(target: ScanTarget): Promise<VulnerabilityResult[]>;
}
