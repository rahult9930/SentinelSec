import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './db';
import { WebVulnerabilityScanner } from './scanners/web-vuln-scanner';
import { FirewallBypassTester } from './scanners/firewall-tester';
import { SSLScanner } from './scanners/ssl-scanner';
import { LoadTester } from './scanners/load-tester';
import * as dotenv from 'dotenv';
import { ScanTarget, ScannerModule } from './scanners/types';

dotenv.config();

const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

const allScanners: ScannerModule[] = [
    new WebVulnerabilityScanner(),
    new FirewallBypassTester(),
    new SSLScanner(),
    new LoadTester(),
];

const worker = new Worker(
    'scans-queue',
    async (job) => {
        const target: ScanTarget = job.data;
        const scanType = target.scanType || 'full';

        // Filter scanners based on scan type
        const activeScanners = allScanners.filter(s => s.scanTypes.includes(scanType));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`[Job ${job.id}] Starting ${scanType.toUpperCase()} scan for ${target.domain}`);
        console.log(`  Scanners: ${activeScanners.map(s => s.name).join(', ')}`);
        console.log(`${'='.repeat(60)}`);

        await prisma.scan.update({
            where: { id: target.scanId },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });

        let vulnerabilitiesCount = 0;
        let totalSeverityScore = 0;

        for (const scanner of activeScanners) {
            console.log(`\n--- Running: ${scanner.name} ---`);
            try {
                const results = await scanner.execute(target);

                for (const res of results) {
                    await prisma.vulnerability.create({
                        data: {
                            scanId: target.scanId,
                            title: res.title,
                            description: res.description,
                            severity: res.severity,
                            cvssScore: res.cvssScore,
                            mitigation: res.mitigation,
                        },
                    });
                    vulnerabilitiesCount++;

                    const weights: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                    totalSeverityScore += weights[res.severity] || 1;
                }
            } catch (err: any) {
                console.error(`[${scanner.name}] Scanner failed:`, err.message);
            }
        }

        const maxScore = 10;
        const computedScore = Math.max(0, Math.round((maxScore - (totalSeverityScore * 0.4)) * 10) / 10);

        await prisma.scan.update({
            where: { id: target.scanId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                score: computedScore,
            },
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log(`[Job ${job.id}] ${scanType.toUpperCase()} scan completed for ${target.domain}`);
        console.log(`  Findings: ${vulnerabilitiesCount} | Score: ${computedScore}/10`);
        console.log(`${'='.repeat(60)}\n`);
    },
    { connection: redisConnection }
);

worker.on('ready', () => {
    console.log('SentinelSec Scanner Engine is listening for jobs...');
    console.log(`Registered scanners: ${allScanners.map(s => `${s.name} [${s.scanTypes}]`).join(', ')}`);
});

worker.on('failed', async (job, err) => {
    console.error(`[Job ${job?.id}] Failed:`, err.message);
    if (job?.data?.scanId) {
        await prisma.scan.update({
            where: { id: job.data.scanId },
            data: { status: 'FAILED' },
        });
    }
});
