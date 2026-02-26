import { ScannerModule, ScanTarget, VulnerabilityResult } from './types';

const SECURITY_HEADERS = [
    { header: 'strict-transport-security', name: 'Strict-Transport-Security (HSTS)', severity: 'MEDIUM' as const, cvss: 5.0 },
    { header: 'x-frame-options', name: 'X-Frame-Options', severity: 'MEDIUM' as const, cvss: 4.3 },
    { header: 'x-content-type-options', name: 'X-Content-Type-Options', severity: 'LOW' as const, cvss: 3.1 },
    { header: 'content-security-policy', name: 'Content-Security-Policy', severity: 'MEDIUM' as const, cvss: 5.8 },
    { header: 'x-xss-protection', name: 'X-XSS-Protection', severity: 'LOW' as const, cvss: 2.5 },
    { header: 'referrer-policy', name: 'Referrer-Policy', severity: 'LOW' as const, cvss: 2.0 },
    { header: 'permissions-policy', name: 'Permissions-Policy', severity: 'LOW' as const, cvss: 2.0 },
];

const SENSITIVE_PATHS = [
    { path: '/.env', name: '.env file exposure' },
    { path: '/.git/config', name: 'Git repository exposure' },
    { path: '/wp-admin/', name: 'WordPress admin panel' },
    { path: '/phpmyadmin/', name: 'phpMyAdmin exposure' },
    { path: '/server-status', name: 'Apache server-status' },
    { path: '/elmah.axd', name: 'ELMAH error log exposure' },
    { path: '/.DS_Store', name: '.DS_Store file exposure' },
    { path: '/robots.txt', name: 'robots.txt reconnaissance' },
    { path: '/sitemap.xml', name: 'sitemap.xml reconnaissance' },
    { path: '/crossdomain.xml', name: 'crossdomain.xml found' },
    { path: '/.well-known/security.txt', name: 'security.txt' },
    { path: '/backup.sql', name: 'SQL backup file exposure' },
    { path: '/dump.sql', name: 'SQL dump file exposure' },
    { path: '/config.php', name: 'PHP config file exposure' },
    { path: '/web.config', name: 'IIS web.config exposure' },
];

export class WebVulnerabilityScanner implements ScannerModule {
    name = 'Web Vulnerability Scanner';
    scanTypes = ['full', 'pentest'];
    async execute(target: ScanTarget): Promise<VulnerabilityResult[]> {
        const results: VulnerabilityResult[] = [];
        const baseUrl = this.buildBaseUrl(target.domain);

        console.log(`[${this.name}] Scanning ${baseUrl}...`);

        // 1. Fetch the main page
        let mainResponse: Response | null = null;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            mainResponse = await fetch(baseUrl, {
                signal: controller.signal,
                redirect: 'follow',
                headers: { 'User-Agent': 'SentinelSec-Scanner/1.0 (Security Audit)' },
            });
            clearTimeout(timeout);
        } catch (err: any) {
            console.log(`[${this.name}] Could not reach ${baseUrl}: ${err.message}`);
            results.push({
                title: 'Target Unreachable',
                description: `Could not establish connection to ${baseUrl}. Error: ${err.message}`,
                severity: 'HIGH',
                cvssScore: 0,
                mitigation: 'Verify the domain is correct and the server is running.',
                scannerName: this.name,
            });
            return results;
        }

        // 2. Check security headers
        console.log(`[${this.name}] Checking security headers...`);
        for (const hdr of SECURITY_HEADERS) {
            const value = mainResponse.headers.get(hdr.header);
            if (!value) {
                results.push({
                    title: `Missing Security Header: ${hdr.name}`,
                    description: `The response from ${baseUrl} does not include the "${hdr.header}" header. This header helps protect against common web attacks.`,
                    severity: hdr.severity,
                    cvssScore: hdr.cvss,
                    mitigation: `Configure your web server to include the "${hdr.header}" response header.`,
                    scannerName: this.name,
                });
            }
        }

        // 3. Server information leakage
        console.log(`[${this.name}] Checking server info leakage...`);
        const serverHeader = mainResponse.headers.get('server');
        if (serverHeader && /\d/.test(serverHeader)) {
            results.push({
                title: 'Server Version Information Disclosure',
                description: `The "Server" header reveals: "${serverHeader}". Exposing version info helps attackers find known CVEs.`,
                severity: 'LOW',
                cvssScore: 3.0,
                mitigation: 'Configure the server to suppress or genericize the Server header.',
                scannerName: this.name,
            });
        }

        const poweredBy = mainResponse.headers.get('x-powered-by');
        if (poweredBy) {
            results.push({
                title: 'Technology Stack Disclosure (X-Powered-By)',
                description: `The "X-Powered-By" header reveals: "${poweredBy}". This discloses the backend technology.`,
                severity: 'LOW',
                cvssScore: 2.5,
                mitigation: 'Remove the X-Powered-By header from responses.',
                scannerName: this.name,
            });
        }

        // 4. HTTPS redirect check
        console.log(`[${this.name}] Checking HTTPS redirect...`);
        try {
            const httpUrl = `http://${target.domain}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const httpRes = await fetch(httpUrl, {
                signal: controller.signal,
                redirect: 'manual',
                headers: { 'User-Agent': 'SentinelSec-Scanner/1.0' },
            });
            clearTimeout(timeout);

            if (httpRes.status < 300 || httpRes.status >= 400) {
                results.push({
                    title: 'HTTP to HTTPS Redirect Missing',
                    description: `The site at http://${target.domain} does not redirect to HTTPS (status: ${httpRes.status}). Users accessing the site over HTTP are not protected.`,
                    severity: 'MEDIUM',
                    cvssScore: 4.8,
                    mitigation: 'Configure a 301 redirect from HTTP to HTTPS on the web server.',
                    scannerName: this.name,
                });
            }
        } catch { /* skip if can't reach HTTP */ }

        // 5. Cookie security
        console.log(`[${this.name}] Checking cookie security...`);
        const setCookies = mainResponse.headers.getSetCookie?.() || [];
        for (const cookie of setCookies) {
            const issues: string[] = [];
            if (!/httponly/i.test(cookie)) issues.push('HttpOnly');
            if (!/secure/i.test(cookie)) issues.push('Secure');
            if (!/samesite/i.test(cookie)) issues.push('SameSite');

            if (issues.length > 0) {
                const cookieName = cookie.split('=')[0]?.trim() || 'unknown';
                results.push({
                    title: `Insecure Cookie: "${cookieName}"`,
                    description: `Cookie "${cookieName}" is missing flags: ${issues.join(', ')}. This may allow session hijacking or CSRF attacks.`,
                    severity: issues.includes('HttpOnly') ? 'MEDIUM' : 'LOW',
                    cvssScore: issues.includes('HttpOnly') ? 5.0 : 3.0,
                    mitigation: `Set the missing flags (${issues.join(', ')}) on the cookie.`,
                    scannerName: this.name,
                });
            }
        }

        // 6. Sensitive path probing
        console.log(`[${this.name}] Probing ${SENSITIVE_PATHS.length} sensitive paths...`);
        const pathResults = await Promise.allSettled(
            SENSITIVE_PATHS.map(async (sp) => {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const res = await fetch(`${baseUrl}${sp.path}`, {
                        signal: controller.signal,
                        redirect: 'follow',
                        headers: { 'User-Agent': 'SentinelSec-Scanner/1.0' },
                    });
                    clearTimeout(timeout);

                    if (res.status === 200) {
                        const body = await res.text().catch(() => '');
                        // Avoid false positives: check if it's a real file, not a custom 404
                        if (body.length > 10 && !body.toLowerCase().includes('not found') && !body.toLowerCase().includes('404')) {
                            return sp;
                        }
                    }
                } catch { /* unreachable path, skip */ }
                return null;
            })
        );

        for (const result of pathResults) {
            if (result.status === 'fulfilled' && result.value) {
                const sp = result.value;
                const isCritical = ['.env', '.git', 'backup.sql', 'dump.sql', 'config.php'].some(s => sp.path.includes(s));
                results.push({
                    title: `Sensitive Path Accessible: ${sp.name}`,
                    description: `The path "${sp.path}" returned a 200 OK response, suggesting the file or directory is publicly accessible.`,
                    severity: isCritical ? 'CRITICAL' : 'MEDIUM',
                    cvssScore: isCritical ? 9.0 : 5.0,
                    mitigation: `Block access to "${sp.path}" using server configuration. If the file is not needed, remove it.`,
                    scannerName: this.name,
                });
            }
        }

        console.log(`[${this.name}] Completed. Found ${results.length} findings.`);
        return results;
    }

    private buildBaseUrl(domain: string): string {
        if (domain.startsWith('http://') || domain.startsWith('https://')) return domain;
        return `https://${domain}`;
    }
}
