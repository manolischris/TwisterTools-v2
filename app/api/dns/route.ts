import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json(
      { error: "Domain parameter is required." },
      { status: 400 }
    );
  }

  // Sanitize input
  let cleanDomain = domain.trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].split(":")[0];

  if (!cleanDomain || !cleanDomain.includes(".")) {
    return NextResponse.json(
      { error: "Please enter a valid domain name (e.g., example.com)." },
      { status: 400 }
    );
  }

  try {
    // 1. Direct Node Native DNS Resolution for exact primary IP match
    let resolvedIps: string[] = [];
    try {
      resolvedIps = await dns.resolve4(cleanDomain);
    } catch {
      // Fallback to Google Public DoH if native lookup fails
      const dohRes = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=A`,
        { cache: "no-store" }
      );
      if (dohRes.ok) {
        const dohData = await dohRes.json();
        if (dohData.Answer) {
          resolvedIps = dohData.Answer.filter((a: { type: number }) => a.type === 1).map((a: { data: string }) => a.data);
        }
      }
    }

    if (resolvedIps.length === 0) {
      return NextResponse.json(
        { error: `No active A records found for domain "${cleanDomain}".` },
        { status: 444 }
      );
    }

    // Sort deterministically so the primary IP never changes on refresh
    resolvedIps.sort();
    const primaryIp = resolvedIps[0];

    // Format records for table display
    const records = resolvedIps.map((ip) => ({
      type: "A",
      name: cleanDomain,
      value: ip,
      ttl: 300,
    }));

    // 2. Fetch Geolocation & ISP Data for primary IP
    let geoData = {
      isp: "Unknown ISP",
      org: "Unknown Org",
      country: "Unknown Country",
      countryCode: "XX",
      regionName: "Unknown Region",
      city: "Unknown City",
      as: "N/A",
      reverse: cleanDomain,
    };

    try {
      const geoRes = await fetch(
        `http://ip-api.com/json/${primaryIp}?fields=status,country,countryCode,regionName,city,isp,org,as,reverse`,
        { next: { revalidate: 3600 } }
      );
      if (geoRes.ok) {
        const fetched = await geoRes.json();
        if (fetched.status === "success") {
          geoData = fetched;
        }
      }
    } catch {
      /* Fallback gracefully */
    }

    return NextResponse.json({
      domain: cleanDomain,
      ipAddress: primaryIp,
      ipVersion: primaryIp.includes(":") ? "IPv6" : "IPv4",
      hostname: geoData.reverse || cleanDomain,
      isp: geoData.isp || "N/A",
      organization: geoData.org || "N/A",
      country: geoData.country || "N/A",
      countryCode: geoData.countryCode || "XX",
      region: geoData.regionName || "N/A",
      city: geoData.city || "N/A",
      asn: geoData.as || "N/A",
      records,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to resolve domain DNS records.",
      },
      { status: 500 }
    );
  }
}