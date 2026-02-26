import { ScannerModule, ScanTarget, VulnerabilityResult } from './types';
import * as https from 'https';
import * as tls from 'tls';

export class SSLScanner implements ScannerModule {
    name = 'SSL/TLS Scanner';
    scanTypes = ['full', 'pentest'];

    async execute(target: ScanTarget): Promise<VulnerabilityResult[]> {
        const results: VulnerabilityResult[] = [];
        const hostname = target.domain.replace(/^https?:\/\//, '').split('/')[0];

        console.log(`[${this.name}] Checking TLS certificate for ${hostname}...`);

        try {
            const certInfo = await this.getCertificate(hostname);

            // Check expiry
            const expiryDate = new Date(certInfo.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
                results.push({
                    title: 'SSL Certificate Expired',
                    description: `The SSL certificate for ${hostname} expired on ${certInfo.valid_to}. Browsers will show security warnings and connections may be rejected.`,
                    severity: 'CRITICAL',
                    cvssScore: 9.0,
                    mitigation: 'Renew the SSL certificate immediately through your certificate authority or use Let\'s Encrypt for free certs.',
                    scannerName: this.name,
                });
            } else if (daysUntilExpiry < 30) {
                results.push({
                    title: 'SSL Certificate Expiring Soon',
                    description: `The SSL certificate for ${hostname} expires in ${daysUntilExpiry} days (on ${certInfo.valid_to}). Renew it before it expires to avoid service disruption.`,
                    severity: 'MEDIUM',
                    cvssScore: 4.0,
                    mitigation: 'Renew the SSL certificate before it expires. Consider setting up auto-renewal.',
                    scannerName: this.name,
                });
            }

            // Check issuer (self-signed)
            if (certInfo.issuer && certInfo.subject &&
                JSON.stringify(certInfo.issuer) === JSON.stringify(certInfo.subject)) {
                results.push({
                    title: 'Self-Signed SSL Certificate',
                    description: `The SSL certificate for ${hostname} is self-signed. Browsers will show trust warnings and MITM attacks become easier.`,
                    severity: 'HIGH',
                    cvssScore: 6.5,
                    mitigation: 'Use a certificate from a trusted Certificate Authority (CA) like Let\'s Encrypt, DigiCert, or Comodo.',
                    scannerName: this.name,
                });
            }

            // Check validity start
            const validFrom = new Date(certInfo.valid_from);
            if (validFrom > now) {
                results.push({
                    title: 'SSL Certificate Not Yet Valid',
                    description: `The SSL certificate for ${hostname} is not valid until ${certInfo.valid_from}.`,
                    severity: 'HIGH',
                    cvssScore: 7.0,
                    mitigation: 'Check the server clock and certificate dates.',
                    scannerName: this.name,
                });
            }

            // Report certificate details as informational
            console.log(`[${this.name}] Certificate: issued by ${certInfo.issuer?.O || 'Unknown'}, expires in ${daysUntilExpiry} days`);

        } catch (err: any) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                results.push({
                    title: 'SSL/TLS Connection Failed',
                    description: `Could not establish a TLS connection to ${hostname}:443. The server may not support HTTPS.`,
                    severity: 'HIGH',
                    cvssScore: 7.0,
                    mitigation: 'Enable HTTPS on the server with a valid SSL certificate.',
                    scannerName: this.name,
                });
            } else if (err.message?.includes('self-signed') || err.message?.includes('DEPTH_ZERO_SELF_SIGNED')) {
                results.push({
                    title: 'Self-Signed SSL Certificate',
                    description: `The SSL certificate for ${hostname} is self-signed or has an untrusted chain.`,
                    severity: 'HIGH',
                    cvssScore: 6.5,
                    mitigation: 'Use a certificate from a trusted CA.',
                    scannerName: this.name,
                });
            } else {
                console.log(`[${this.name}] TLS error: ${err.message}`);
            }
        }

        console.log(`[${this.name}] Completed. Found ${results.length} findings.`);
        return results;
    }

    private getCertificate(hostname: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const socket = tls.connect(
                {
                    host: hostname,
                    port: 443,
                    rejectUnauthorized: false,
                    servername: hostname,
                    timeout: 10000,
                },
                () => {
                    const cert = socket.getPeerCertificate(true);
                    socket.destroy();
                    if (cert && Object.keys(cert).length > 0) {
                        resolve(cert);
                    } else {
                        reject(new Error('No certificate returned'));
                    }
                }
            );
            socket.on('error', reject);
            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('TLS connection timed out'));
            });
        });
    }
}
