import { ScannerModule, ScanTarget, VulnerabilityResult } from './types';

const XSS_PAYLOADS = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    "'-alert(1)-'",
    '<svg/onload=alert(1)>',
];

const SQLI_PAYLOADS = [
    "' OR 1=1 --",
    "1' AND '1'='1",
    "1; DROP TABLE users--",
    "' UNION SELECT NULL--",
];

export class FirewallBypassTester implements ScannerModule {
    name = 'Firewall & WAF Tester';
    scanTypes = ['full', 'pentest'];

    async execute(target: ScanTarget): Promise<VulnerabilityResult[]> {
        const results: VulnerabilityResult[] = [];
        const baseUrl = this.buildBaseUrl(target.domain);

        console.log(`[${this.name}] Testing WAF on ${baseUrl}...`);

        // 1. XSS payload injection test
        console.log(`[${this.name}] Testing XSS payload rejection...`);
        let xssBlocked = 0;
        let xssTested = 0;

        for (const payload of XSS_PAYLOADS) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(`${baseUrl}/?q=${encodeURIComponent(payload)}`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'SentinelSec-Scanner/1.0' },
                });
                clearTimeout(timeout);
                xssTested++;

                // WAF should block with 403/406 or similar
                if (res.status === 403 || res.status === 406 || res.status === 429) {
                    xssBlocked++;
                } else {
                    // Check if payload is reflected in body
                    const body = await res.text().catch(() => '');
                    if (body.includes(payload)) {
                        results.push({
                            title: 'XSS Payload Reflected (No WAF Protection)',
                            description: `The XSS payload "${payload.substring(0, 30)}..." was reflected in the response body without being blocked or sanitized. This suggests no WAF or output encoding is in place.`,
                            severity: 'HIGH',
                            cvssScore: 7.5,
                            mitigation: 'Implement a WAF to block malicious payloads, and ensure all user input is properly encoded before rendering.',
                            scannerName: this.name,
                        });
                    }
                }
            } catch { /* timeout or network error, skip */ }
        }

        if (xssTested > 0 && xssBlocked === 0) {
            results.push({
                title: 'WAF Not Detected (XSS Payloads Not Blocked)',
                description: `None of the ${xssTested} XSS test payloads were blocked by a WAF. The server appears to have no web application firewall protecting against XSS attacks.`,
                severity: 'MEDIUM',
                cvssScore: 5.3,
                mitigation: 'Deploy a Web Application Firewall (WAF) such as Cloudflare, AWS WAF, or ModSecurity to filter malicious requests.',
                scannerName: this.name,
            });
        } else if (xssTested > 0 && xssBlocked === xssTested) {
            console.log(`[${this.name}] WAF detected: all ${xssTested} XSS payloads blocked.`);
        }

        // 2. SQL Injection payload test
        console.log(`[${this.name}] Testing SQL injection payload rejection...`);
        let sqliBlocked = 0;
        let sqliTested = 0;

        for (const payload of SQLI_PAYLOADS) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(`${baseUrl}/?id=${encodeURIComponent(payload)}`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'SentinelSec-Scanner/1.0' },
                });
                clearTimeout(timeout);
                sqliTested++;

                if (res.status === 403 || res.status === 406 || res.status === 429) {
                    sqliBlocked++;
                } else {
                    const body = await res.text().catch(() => '');
                    // Check for SQL error messages in response
                    const sqlErrors = ['sql syntax', 'mysql', 'postgresql', 'sqlite', 'ora-', 'unclosed quotation'];
                    const foundError = sqlErrors.find(e => body.toLowerCase().includes(e));
                    if (foundError) {
                        results.push({
                            title: 'SQL Error Message Disclosed',
                            description: `A SQL injection payload triggered a database error message containing "${foundError}". This reveals the database type and suggests input is passed to SQL queries without sanitization.`,
                            severity: 'CRITICAL',
                            cvssScore: 9.8,
                            mitigation: 'Use parameterized queries/prepared statements. Never concatenate user input into SQL. Suppress detailed error messages in production.',
                            scannerName: this.name,
                        });
                    }
                }
            } catch { /* skip */ }
        }

        if (sqliTested > 0 && sqliBlocked === 0) {
            results.push({
                title: 'WAF Not Blocking SQL Injection Payloads',
                description: `None of the ${sqliTested} SQL injection test payloads were blocked. The server may lack WAF protection against SQL injection attacks.`,
                severity: 'MEDIUM',
                cvssScore: 5.3,
                mitigation: 'Deploy a WAF with SQL injection rules enabled.',
                scannerName: this.name,
            });
        }

        // 3. Rate limiting test
        console.log(`[${this.name}] Testing rate limiting...`);
        try {
            let rateLimited = false;
            const rapidRequests = 20;

            for (let i = 0; i < rapidRequests; i++) {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(baseUrl, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'SentinelSec-Scanner/1.0' },
                });
                clearTimeout(timeout);

                if (res.status === 429) {
                    rateLimited = true;
                    console.log(`[${this.name}] Rate limited after ${i + 1} requests.`);
                    break;
                }
            }

            if (!rateLimited) {
                results.push({
                    title: 'No Rate Limiting Detected',
                    description: `Sent ${rapidRequests} rapid sequential requests without being rate-limited. The server has no apparent rate limiting, making it vulnerable to brute-force and DoS attacks.`,
                    severity: 'LOW',
                    cvssScore: 3.5,
                    mitigation: 'Implement rate limiting at the application or WAF level (e.g., nginx rate_limit, Cloudflare Rate Limiting).',
                    scannerName: this.name,
                });
            }
        } catch { /* skip */ }

        // 4. Header spoofing test
        console.log(`[${this.name}] Testing header spoofing...`);
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(baseUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'SentinelSec-Scanner/1.0',
                    'X-Forwarded-For': '127.0.0.1',
                    'X-Real-IP': '127.0.0.1',
                    'X-Originating-IP': '127.0.0.1',
                },
            });
            clearTimeout(timeout);

            // If we can access with spoofed headers and get 200, the server trusts them
            if (res.status === 200) {
                results.push({
                    title: 'IP Spoofing Headers Accepted',
                    description: 'The server accepts requests with spoofed X-Forwarded-For headers without validation. If the application uses these headers for IP-based access control, this could bypass restrictions.',
                    severity: 'LOW',
                    cvssScore: 3.0,
                    mitigation: 'Configure the reverse proxy/load balancer to strip or overwrite X-Forwarded-For headers from untrusted sources.',
                    scannerName: this.name,
                });
            }
        } catch { /* skip */ }

        console.log(`[${this.name}] Completed. Found ${results.length} findings.`);
        return results;
    }

    private buildBaseUrl(domain: string): string {
        if (domain.startsWith('http://') || domain.startsWith('https://')) return domain;
        return `https://${domain}`;
    }
}
