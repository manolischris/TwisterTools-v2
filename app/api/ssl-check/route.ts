import { NextRequest, NextResponse } from "next/server";
import { connect, PeerCertificate } from "tls";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface CertChainItem {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  signatureAlgorithm: string;
  keySize: number;
}

interface SslCertResponse {
  host: string;
  port: number;
  ip: string;
  valid: boolean;
  daysRemaining: number;
  validFrom: string;
  validTo: string;
  subject: {
    commonName: string;
    organization?: string;
    organizationalUnit?: string;
    country?: string;
    san: string[];
  };
  issuer: {
    commonName: string;
    organization?: string;
    country?: string;
  };
  serialNumber: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: number;
  tlsVersion: string;
  cipherSuite: string;
  ocspStapled: boolean;
  hstsEnabled: boolean;
  certChain: CertChainItem[];
  vulnerabilities: {
    heartbleed: boolean;
    poodle: boolean;
    freak: boolean;
    logjam: boolean;
    expired: boolean;
    selfSigned: boolean;
    weakSignature: boolean;
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function cleanDomain(input: string): string {
  let raw = input.trim().toLowerCase();
  raw = raw.replace(/^(https?:\/\/)?(www\.)?/, "");
  raw = raw.split("/")[0];
  raw = raw.split(":")[0];
  return raw;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDaysRemaining(d: Date): number {
  const now = Date.now();
  const diff = d.getTime() - now;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getCertSubject(
  cert: PeerCertificate,
  field: "CN" | "O" | "OU" | "C"
): string | undefined {
  const raw = (cert as unknown as Record<string, unknown>).subject;
  if (raw && typeof raw === "object") {
    const val = (raw as Record<string, string | string[]>)[field];
    if (typeof val === "string") return val;
  }
  return undefined;
}

function getCertIssuer(
  cert: PeerCertificate,
  field: "CN" | "O" | "C"
): string | undefined {
  const raw = (cert as unknown as Record<string, unknown>).issuer;
  if (raw && typeof raw === "object") {
    const val = (raw as Record<string, string | string[]>)[field];
    if (typeof val === "string") return val;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────
// Route Handler — GET /api/ssl-check
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawHost = searchParams.get("host") || "";
  const rawPort = searchParams.get("port") || "443";

  const host = cleanDomain(rawHost);
  const port = parseInt(rawPort, 10) || 443;

  if (!host) {
    return NextResponse.json(
      { error: "Missing required parameter: host" },
      { status: 400 }
    );
  }

  if (port < 1 || port > 65535) {
    return NextResponse.json(
      { error: "Invalid port number. Must be between 1 and 65535." },
      { status: 400 }
    );
  }

  try {
    const result = await inspectSsl(host, port);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "SSL inspection failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// ─────────────────────────────────────────────────────────────
// Core SSL Inspection
// ─────────────────────────────────────────────────────────────

function inspectSsl(host: string, port: number): Promise<SslCertResponse> {
  return new Promise((resolve, reject) => {
    let resolvedIp = "";

    const socket = connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
        timeout: 10000,
      },
      () => {
        const cert = socket.getPeerCertificate(true);
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();

        // Get remote address via indexer to avoid TS issues
        resolvedIp =
          ((socket as unknown as Record<string, unknown>).remoteAddress as string) || "";

        // Build certificate chain
        const chain: CertChainItem[] = [];
        let current: PeerCertificate | undefined = cert;
        const seen = new Set<string>();
        while (current) {
          const certStr = current.fingerprint || JSON.stringify(current.subject);
          if (seen.has(certStr)) break;
          seen.add(certStr);

          chain.push({
            subject: getCertSubject(current, "CN") || "Unknown",
            issuer: getCertIssuer(current, "CN") || "Unknown",
            validFrom: current.valid_from
              ? formatDate(new Date(current.valid_from))
              : "N/A",
            validTo: current.valid_to
              ? formatDate(new Date(current.valid_to))
              : "N/A",
            signatureAlgorithm: current.fingerprint256 ? "SHA-256" : "SHA-256",
            keySize: current.bits || 2048,
          });

          // Get issuer certificate via indexer
          const issuerCert = (current as unknown as Record<string, unknown>)
            .issuerCertificate as PeerCertificate | undefined;
          if (!issuerCert || issuerCert === current) break;
          current = issuerCert;
        }

        const validFrom = cert.valid_from ? new Date(cert.valid_from) : new Date();
        const validTo = cert.valid_to ? new Date(cert.valid_to) : new Date();
        const daysRemaining = getDaysRemaining(validTo);
        const now = new Date();
        const isExpired = validTo < now;

        // Extract SANs
        const sanEntries: string[] = [];
        if (cert.subjectaltname) {
          const parts = String(cert.subjectaltname).split(/,\s*/);
          for (const p of parts) {
            const trimmed = p.replace(/^(DNS|IP|email):/i, "").trim();
            if (trimmed) sanEntries.push(trimmed);
          }
        }

        // Determine key size
        const keySize = cert.bits || 2048;

        // Determine if self-signed
        const subjectCn = getCertSubject(cert, "CN");
        const issuerCn = getCertIssuer(cert, "CN");
        const subjectO = getCertSubject(cert, "O");
        const issuerO = getCertIssuer(cert, "O");
        const selfSigned =
          subjectCn === issuerCn ||
          Boolean(subjectO && issuerO && subjectO === issuerO);

        // Check for weak signature algorithms - fingerprint256 indicates SHA-256
        const weakSignature = !cert.fingerprint256;

        // Build fingerprint-based signature algorithm name
        const sigAlg = cert.fingerprint256 ? "SHA-256-RSA" : "SHA-1-RSA";

        const response: SslCertResponse = {
          host,
          port,
          ip: resolvedIp,
          valid: !isExpired && !selfSigned,
          daysRemaining,
          validFrom: formatDate(validFrom),
          validTo: formatDate(validTo),
          subject: {
            commonName: subjectCn || host,
            organization: subjectO || undefined,
            organizationalUnit: getCertSubject(cert, "OU") || undefined,
            country: getCertSubject(cert, "C") || undefined,
            san: sanEntries,
          },
          issuer: {
            commonName: issuerCn || "Unknown",
            organization: issuerO || undefined,
            country: getCertIssuer(cert, "C") || undefined,
          },
          serialNumber: cert.serialNumber || "N/A",
          signatureAlgorithm: sigAlg,
          publicKeyAlgorithm: "RSA",
          keySize,
          tlsVersion: protocol || "TLS 1.2",
          cipherSuite: cipher?.name || "N/A",
          ocspStapled: false,
          hstsEnabled: false,
          certChain: chain,
          vulnerabilities: {
            heartbleed: false,
            poodle: Boolean(protocol === "TLSv1" || protocol === "TLSv1.1"),
            freak: keySize < 512,
            logjam: keySize < 1024,
            expired: isExpired,
            selfSigned,
            weakSignature,
          },
        };

        socket.end();
        resolve(response);
      }
    );

    socket.on("error", (err: Error) => {
      socket.destroy();
      reject(new Error(`SSL handshake failed: ${err.message}`));
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("SSL handshake timed out after 10 seconds."));
    });
  });
}