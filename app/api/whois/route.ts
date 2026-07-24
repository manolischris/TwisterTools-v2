import { NextRequest, NextResponse } from "next/server";
import { connect } from "net";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface WhoisResult {
  domain: string;
  registrar: string;
  creationDate: string;
  updatedDate: string;
  expirationDate: string;
  ageYears: number;
  ageDays: number;
  totalDays: number;
  nameServers: string[];
  dnssec: string;
}

interface RdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, unknown[][]];
}

// ─────────────────────────────────────────────────────────────
// Domain Cleaning & Validation
// ─────────────────────────────────────────────────────────────

function cleanDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "");
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  return domain;
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

// ─────────────────────────────────────────────────────────────
// WHOIS Raw Lookup via Port 43 (Native Node.js net module)
// ─────────────────────────────────────────────────────────────

const WHOIS_SERVERS: Record<string, string> = {
  com: "whois.verisign-grs.com",
  net: "whois.verisign-grs.com",
  org: "whois.pir.org",
  info: "whois.afilias.net",
  biz: "whois.neulevel.biz",
  io: "whois.nic.io",
  co: "whois.nic.co",
  me: "whois.nic.me",
  tv: "whois.nic.tv",
  app: "whois.nic.google",
  dev: "whois.nic.google",
  cloud: "whois.nic.cloud",
  pro: "whois.registrypro.pro",
  name: "whois.nic.name",
  mobi: "whois.nic.mobi",
  edu: "whois.educause.edu",
  gov: "whois.nic.gov",
  uk: "whois.nic.uk",
  eu: "whois.eurid.eu",
  de: "whois.denic.de",
  fr: "whois.nic.fr",
  it: "whois.nic.it",
  es: "whois.nic.es",
  nl: "whois.domain-registry.nl",
  ru: "whois.tcinet.ru",
  au: "whois.auda.org.au",
  ca: "whois.cira.ca",
  jp: "whois.jprs.jp",
  cn: "whois.cnnic.cn",
  br: "whois.registro.br",
  in: "whois.registry.in",
  us: "whois.nic.us",
  cc: "whois.nic.cc",
  ws: "whois.nic.ws",
  xyz: "whois.nic.xyz",
  top: "whois.nic.top",
  club: "whois.nic.club",
  shop: "whois.nic.shop",
  online: "whois.nic.online",
  tech: "whois.nic.tech",
  space: "whois.nic.space",
  website: "whois.nic.website",
  press: "whois.nic.press",
  site: "whois.nic.site",
};

function getWhoisServer(domain: string): string {
  const tld = domain.split(".").pop()?.toLowerCase() || "";
  return WHOIS_SERVERS[tld] || `whois.nic.${tld}`;
}

function whoisLookup(domain: string, timeout = 10000): Promise<string> {
  const server = getWhoisServer(domain);

  return new Promise((resolve, reject) => {
    const socket = connect(
      { host: server, port: 43, timeout },
      () => {
        socket.write(domain + "\r\n");
      }
    );

    let data = "";

    socket.on("data", (chunk: Buffer) => {
      data += chunk.toString("utf-8");
    });

    socket.on("end", () => {
      resolve(data);
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      reject(new Error(`WHOIS connection failed for ${server}: ${err.message}`));
    });

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`WHOIS query timed out for ${server}`));
    });
  });
}

// ─────────────────────────────────────────────────────────────
// RDAP Fallback Lookup
// ─────────────────────────────────────────────────────────────

async function rdapLookup(domain: string): Promise<WhoisResult | null> {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Extract events
    const events = data.events || [];
    const creationEvent = events.find((e: { eventAction: string }) => e.eventAction === "registration");
    const updatedEvent = events.find((e: { eventAction: string }) => e.eventAction === "last changed");
    const expirationEvent = events.find((e: { eventAction: string }) => e.eventAction === "expiration");

    const creationDate = creationEvent?.eventDate?.split("T")[0] || "";
    const updatedDate = updatedEvent?.eventDate?.split("T")[0] || "";
    const expirationDate = expirationEvent?.eventDate?.split("T")[0] || "";

    // Calculate age
    const now = new Date();
    const created = creationDate ? new Date(creationDate) : now;
    const totalDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const ageYears = Math.floor(totalDays / 365);
    const ageDays = totalDays % 365;

    // Extract registrar
    let registrar = "Unknown";
    const entities: RdapEntity[] = data.entities || [];
    for (const entity of entities) {
      if (entity.roles?.includes("registrar") && entity.vcardArray) {
        const vcard = entity.vcardArray[1];
        for (const field of vcard) {
          if (field[0] === "fn") {
            registrar = String(field[3] || field[2] || field[1] || "Unknown");
            break;
          }
        }
        if (registrar !== "Unknown") break;
      }
    }

    // Extract nameservers
    const nameServers: string[] = (data.nameservers || []).map(
      (ns: { ldhName?: string }) => ns.ldhName || ""
    ).filter(Boolean);

    // DNSSEC
    const dnssec = data.secureDNS?.delegationSigned ? "signedDelegation" : "unsigned";

    return {
      domain,
      registrar,
      creationDate,
      updatedDate: updatedDate || creationDate,
      expirationDate,
      ageYears,
      ageDays,
      totalDays,
      nameServers,
      dnssec,
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// WHOIS Raw Data Parser (handles multiple TLD formats)
// ─────────────────────────────────────────────────────────────

function parseWhoisData(raw: string, domain: string): Partial<WhoisResult> {
  // Normalize line endings
  const lines = raw.split(/\r?\n/);

  // Common WHOIS field extraction (case-insensitive)
  const fieldMap: Record<string, string[]> = {
    registrar: [
      "Registrar:",
      "registrar:",
      "Sponsoring Registrar:",
      "Registry Registrant ID:",
      "Registrar IANA ID:",
    ],
    creationDate: [
      "Creation Date:",
      "created:",
      "Creation Date (dd/mm/yyyy):",
      "Domain Registration Date:",
      "Domain Create Date:",
      "registered:",
      "Domain Record Activated:",
      "date_created:",
    ],
    updatedDate: [
      "Updated Date:",
      "last updated:",
      "Modified:",
      "last-modified:",
      "changed:",
      "domain_last_modified:",
      "Modified Date:",
    ],
    expirationDate: [
      "Expiration Date:",
      "Registry Expiry Date:",
      "Expiry Date:",
      "expire:",
      "paid-till:",
      "Registrar Registration Expiration Date:",
      "Domain Expiration Date:",
      "Domain Deletion Date:",
      "date_expires:",
    ],
  };

  const result: Record<string, string> = {};

  for (const [key, prefixes] of Object.entries(fieldMap)) {
    for (const line of lines) {
      const trimmed = line.trim();
      for (const prefix of prefixes) {
        if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
          const value = trimmed.substring(prefix.length).trim();
          if (value && !result[key]) {
            result[key] = value;
          }
        }
      }
    }
  }

  // Normalize date formats (handle DD/MM/YYYY or YYYY-MM-DD)
  function normalizeDate(raw: string): string {
    const trimmed = raw.replace(/^["']|["']$/g, "").trim();
    const parts = trimmed.split(/\s+/)[0]; // Take first part before timezone
    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(parts)) {
      return parts.substring(0, 10);
    }
    // Try DD/MM/YYYY
    const dmy = parts.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    // Try DD-MM-YYYY
    const dmy2 = parts.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmy2) return `${dmy2[3]}-${dmy2[2]}-${dmy2[1]}`;
    // Try "before YYYY-MM-DD" or similar
    const ymd = parts.match(/(\d{4}-\d{2}-\d{2})/);
    if (ymd) return ymd[1];
    // Try "DD Mon YYYY" (e.g., "21-Jul-2026")
    const dmy3 = parts.match(/(\d{2})[- ]([A-Za-z]{3})[- ](\d{4})/);
    if (dmy3) {
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
      };
      const month = months[dmy3[2].toLowerCase()] || "01";
      return `${dmy3[3]}-${month}-${dmy3[1]}`;
    }
    return parts;
  }

  // Extract nameservers
  const nameServers: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (
      (trimmed.startsWith("name server:") || trimmed.startsWith("nameserver:")) &&
      !trimmed.includes("//")
    ) {
      const ns = trimmed.replace(/^(name server:|nameserver:)\s*/i, "").trim();
      if (ns && !nameServers.includes(ns)) {
        nameServers.push(ns);
      }
    }
  }

  // Also try "nserver:" (some TLDs)
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith("nserver:")) {
      const ns = trimmed.replace(/^nserver:\s*/i, "").split(/\s+/)[0].trim();
      if (ns && !nameServers.includes(ns)) {
        nameServers.push(ns);
      }
    }
  }

  // Extract DNSSEC
  let dnssec = "unsigned";
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    if (
      trimmed.includes("dnssec") &&
      (trimmed.includes("signed") || trimmed.includes("yes") || trimmed.includes("active"))
    ) {
      dnssec = "signedDelegation";
      break;
    }
  }

  // Extract registrar from "Registrar:" line specifically
  let registrar = result.registrar || "Unknown";
  // Remove trailing organization/abuse info from registrar line
  if (registrar.includes(" (")) {
    registrar = registrar.split(" (")[0].trim();
  }

  // Calculate dates
  const creationRaw = result.creationDate || "";
  const expirationRaw = result.expirationDate || "";
  const creationDate = creationRaw ? normalizeDate(creationRaw) : "";
  const updatedDate = result.updatedDate ? normalizeDate(result.updatedDate) : creationDate;
  const expirationDate = expirationRaw ? normalizeDate(expirationRaw) : "";

  // Calculate age
  const now = new Date();
  let ageYears = 0;
  let ageDays = 0;
  let totalDays = 0;

  if (creationDate) {
    const created = new Date(creationDate);
    if (!isNaN(created.getTime())) {
      totalDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      ageYears = Math.floor(totalDays / 365);
      ageDays = totalDays % 365;
    }
  }

  return {
    registrar,
    creationDate,
    updatedDate,
    expirationDate,
    ageYears,
    ageDays,
    totalDays,
    nameServers: [...new Set(nameServers)].slice(0, 4),
    dnssec,
  };
}

// ─────────────────────────────────────────────────────────────
// Main Lookup Orchestrator
// ─────────────────────────────────────────────────────────────

async function performLookup(domain: string): Promise<WhoisResult> {
  // Try WHOIS port 43 first
  try {
    const rawWhois = await whoisLookup(domain);
    if (rawWhois && rawWhois.length > 50) {
      const parsed = parseWhoisData(rawWhois, domain);

      // Only return if we got meaningful data
      if (parsed.creationDate || parsed.registrar !== "Unknown") {
        return {
          domain,
          registrar: parsed.registrar || "Unknown",
          creationDate: parsed.creationDate || "",
          updatedDate: parsed.updatedDate || parsed.creationDate || "",
          expirationDate: parsed.expirationDate || "",
          ageYears: parsed.ageYears || 0,
          ageDays: parsed.ageDays || 0,
          totalDays: parsed.totalDays || 0,
          nameServers: parsed.nameServers || [],
          dnssec: parsed.dnssec || "unsigned",
        };
      }
    }
  } catch (whoisError) {
    console.warn(`WHOIS port 43 failed for ${domain}:`, (whoisError as Error).message);
  }

  // Fallback to RDAP
  console.info(`Falling back to RDAP for ${domain}...`);
  const rdapResult = await rdapLookup(domain);
  if (rdapResult) {
    return rdapResult;
  }

  // Both failed — throw
  throw new Error(
    `Unable to retrieve WHOIS data for "${domain}". Both port 43 WHOIS and RDAP fallback failed. The domain may not exist or the registry may be temporarily unavailable.`
  );
}

// ─────────────────────────────────────────────────────────────
// Next.js API Route Handler
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawDomain = searchParams.get("domain") || "";
  const domain = cleanDomain(rawDomain);

  if (!domain) {
    return NextResponse.json(
      { error: "Missing 'domain' query parameter. Usage: /api/whois?domain=example.com" },
      { status: 400 }
    );
  }

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      {
        error: `Invalid domain format: "${domain}". Please enter a valid domain name (e.g., example.com).`,
      },
      { status: 400 }
    );
  }

  try {
    const result = await performLookup(domain);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unexpected WHOIS lookup error occurred.";
    return NextResponse.json(
      { error: message, domain },
      { status: 502 }
    );
  }
}