import { ScannerModule, ScanTarget, VulnerabilityResult } from './types';

export class LoadTester implements ScannerModule {
    name = 'Load & Resilience Tester';
    scanTypes = ['full', 'loadtest'];

    async execute(target: ScanTarget): Promise<VulnerabilityResult[]> {
        const results: VulnerabilityResult[] = [];
        const baseUrl = this.buildBaseUrl(target.domain);

        // Configurable params from job data (defaults for 'full' scans)
        const maxConcurrent = target.loadTestConfig?.concurrentRequests || 30;
        const testDurationMs = (target.loadTestConfig?.durationSeconds || 5) * 1000;
        const batchSize = Math.min(maxConcurrent, Math.max(10, Math.ceil(maxConcurrent / 5)));

        console.log(`[${this.name}] Load test on ${baseUrl}: ${maxConcurrent} requests, ${testDurationMs / 1000}s duration, batches of ${batchSize}`);

        const responseTimes: number[] = [];
        const errors: string[] = [];
        let totalRequests = 0;
        let successCount = 0;
        let errorCount = 0;
        let timedOutCount = 0;
        const statusCodes: Record<number, number> = {};

        const startTime = Date.now();

        while (Date.now() - startTime < testDurationMs && totalRequests < maxConcurrent) {
            const batchCount = Math.min(batchSize, maxConcurrent - totalRequests);
            const batchPromises = [];

            for (let i = 0; i < batchCount; i++) {
                batchPromises.push(this.timedRequest(baseUrl));
                totalRequests++;
            }

            const batchResults = await Promise.allSettled(batchPromises);

            for (const res of batchResults) {
                if (res.status === 'fulfilled') {
                    const r = res.value;
                    if (r.error) {
                        errorCount++;
                        if (r.timedOut) timedOutCount++;
                        errors.push(r.error);
                    } else {
                        successCount++;
                        responseTimes.push(r.duration);
                        statusCodes[r.statusCode!] = (statusCodes[r.statusCode!] || 0) + 1;
                    }
                } else {
                    errorCount++;
                }
            }

            // Brief pause between batches
            if (Date.now() - startTime < testDurationMs && totalRequests < maxConcurrent) {
                const remainingBatches = Math.ceil((maxConcurrent - totalRequests) / batchSize);
                const remainingTime = testDurationMs - (Date.now() - startTime);
                const delayMs = Math.max(50, Math.floor(remainingTime / (remainingBatches + 1)));
                await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 500)));
            }
        }

        const elapsed = Date.now() - startTime;

        if (responseTimes.length === 0) {
            results.push({
                title: 'Load Test Failed — Server Unreachable',
                description: `All ${totalRequests} requests failed. The server may be down or blocking automated requests.`,
                severity: 'HIGH',
                cvssScore: 0,
                mitigation: 'Verify the server is running and accessible.',
                scannerName: this.name,
            });
            return results;
        }

        // Calculate metrics
        responseTimes.sort((a, b) => a - b);
        const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
        const minTime = responseTimes[0];
        const maxTime = responseTimes[responseTimes.length - 1];
        const p50Index = Math.floor(responseTimes.length * 0.5);
        const p50Time = responseTimes[p50Index] || avgTime;
        const p95Index = Math.floor(responseTimes.length * 0.95);
        const p95Time = responseTimes[p95Index] || maxTime;
        const p99Index = Math.floor(responseTimes.length * 0.99);
        const p99Time = responseTimes[p99Index] || maxTime;
        const errorRate = ((errorCount / totalRequests) * 100).toFixed(1);
        const reqPerSec = (totalRequests / (elapsed / 1000)).toFixed(1);

        console.log(`[${this.name}] Results: ${totalRequests} reqs, avg=${avgTime}ms, p95=${p95Time}ms, p99=${p99Time}ms, errors=${errorRate}%`);

        const statusSummary = Object.entries(statusCodes).map(([code, count]) => `${code}: ${count}`).join(', ');

        results.push({
            title: 'Load Test Results Summary',
            description: [
                `**Test Parameters:** ${totalRequests} requests in ${(elapsed / 1000).toFixed(1)}s (${reqPerSec} req/s), batches of ${batchSize}`,
                `**Response Times:** avg=${avgTime}ms, min=${minTime}ms, max=${maxTime}ms, p50=${p50Time}ms, p95=${p95Time}ms, p99=${p99Time}ms`,
                `**Success Rate:** ${successCount}/${totalRequests} (${((successCount / totalRequests) * 100).toFixed(1)}%)`,
                `**Status Codes:** ${statusSummary}`,
                errorCount > 0 ? `**Errors:** ${errorCount} (${timedOutCount} timeouts)` : '',
            ].filter(Boolean).join('\n'),
            severity: 'LOW',
            cvssScore: 0,
            mitigation: 'This is an informational finding from the load test.',
            scannerName: this.name,
        });

        // Degradation warnings
        if (avgTime > 3000) {
            results.push({
                title: 'Slow Average Response Time Under Load',
                description: `Average response time was ${avgTime}ms under ${totalRequests} concurrent requests. This indicates the server may struggle under moderate traffic.`,
                severity: 'MEDIUM',
                cvssScore: 4.0,
                mitigation: 'Optimize server performance: enable caching, use a CDN, review database queries, or scale horizontally.',
                scannerName: this.name,
            });
        }

        if (p95Time > 5000) {
            results.push({
                title: 'High P95 Latency Under Load',
                description: `The 95th percentile response time was ${p95Time}ms. 5% of users would experience severe delays.`,
                severity: 'MEDIUM',
                cvssScore: 4.5,
                mitigation: 'Investigate slow responses: check for blocking I/O, unoptimized queries, or resource contention.',
                scannerName: this.name,
            });
        }

        if (p99Time > 10000) {
            results.push({
                title: 'Extreme P99 Latency',
                description: `The 99th percentile response time was ${p99Time}ms. The worst 1% of requests take over 10 seconds.`,
                severity: 'HIGH',
                cvssScore: 6.0,
                mitigation: 'Review server timeout settings, connection pool limits, and backend service dependencies.',
                scannerName: this.name,
            });
        }

        const errorRateNum = parseFloat(errorRate);
        if (errorRateNum > 10) {
            results.push({
                title: 'High Error Rate Under Load',
                description: `${errorRate}% of requests failed during the load test (${errorCount}/${totalRequests}). The server cannot reliably handle this concurrency level.`,
                severity: errorRateNum > 50 ? 'CRITICAL' : errorRateNum > 25 ? 'HIGH' : 'MEDIUM',
                cvssScore: errorRateNum > 50 ? 8.0 : errorRateNum > 25 ? 7.0 : 5.0,
                mitigation: 'Review server logs, increase connection limits, and consider load balancing or auto-scaling.',
                scannerName: this.name,
            });
        }

        if (timedOutCount > 0) {
            results.push({
                title: `${timedOutCount} Requests Timed Out`,
                description: `${timedOutCount} out of ${totalRequests} requests timed out (>10s). The server is struggling under this load level.`,
                severity: timedOutCount > totalRequests / 2 ? 'HIGH' : 'MEDIUM',
                cvssScore: timedOutCount > totalRequests / 2 ? 6.5 : 4.0,
                mitigation: 'Investigate server resource utilization and optimize for concurrency.',
                scannerName: this.name,
            });
        }

        // Connection refused (server crashed or rejected)
        const connRefused = errors.filter(e => e.includes('ECONNREFUSED') || e.includes('ECONNRESET')).length;
        if (connRefused > 0) {
            results.push({
                title: `Server Rejected ${connRefused} Connections`,
                description: `${connRefused} requests were refused/reset by the server. This may indicate the server ran out of connection slots or crashed under load.`,
                severity: connRefused > totalRequests / 4 ? 'CRITICAL' : 'HIGH',
                cvssScore: connRefused > totalRequests / 4 ? 9.0 : 7.0,
                mitigation: 'Increase max connections on the server, check worker/thread pool settings, and verify the server remained up during the test.',
                scannerName: this.name,
            });
        }

        return results;
    }

    private async timedRequest(url: string): Promise<{ duration: number; statusCode?: number; error?: string; timedOut?: boolean }> {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(url, {
                signal: controller.signal,
                headers: { 'User-Agent': 'SentinelSec-LoadTest/1.0' },
            });
            clearTimeout(timeout);
            // Read body to ensure connection is fully measured
            await res.text().catch(() => { });
            return { duration: Date.now() - start, statusCode: res.status };
        } catch (err: any) {
            return {
                duration: Date.now() - start,
                error: err.message,
                timedOut: err.name === 'AbortError',
            };
        }
    }

    private buildBaseUrl(domain: string): string {
        if (domain.startsWith('http://') || domain.startsWith('https://')) return domain;
        return `https://${domain}`;
    }
}
