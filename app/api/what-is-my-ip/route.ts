import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Primary: ipapi.co (rich geolocation + ISP + security flags)
  try {
    const res = await fetch("https://ipapi.co/json/", {
      next: { revalidate: 60 }, // short cache for IP which can change
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ip: data.ip || "Unavailable",
        ipType: data.ip?.includes(":") ? "IPv6" : "IPv4",
        city: data.city || "Unknown",
        region: data.region || "Unknown",
        country: data.country_name || "Unknown",
        countryCode: data.country_code || "XX",
        loc: data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "N/A",
        org: data.org || data.asn || "Unknown ISP",
        postal: data.postal || "N/A",
        timezone: data.timezone || "UTC",
        asn: data.asn || "N/A",
        isp: data.org || "Unknown Provider",
        isProxy: data.proxy || false,
        isVpn: data.security?.is_vpn || false,
        isTor: data.security?.is_tor || false,
      });
    }
    throw new Error("Primary API returned non-OK status");
  } catch {
    // Fallback: ipify.org (IP only, no geolocation)
    try {
      const fallbackRes = await fetch("https://api.ipify.org?format=json", {
        next: { revalidate: 60 },
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        return NextResponse.json({
          ip: fallbackData.ip,
          ipType: fallbackData.ip?.includes(":") ? "IPv6" : "IPv4",
          city: "Location Blocked",
          region: "Unavailable",
          country: "Global Network",
          countryCode: "US",
          loc: "N/A",
          org: "Direct Connection",
          postal: "N/A",
          timezone: "UTC",
          asn: "N/A",
          isp: "Public Carrier",
          isProxy: false,
          isVpn: false,
          isTor: false,
        });
      }
      throw new Error("Fallback API also failed");
    } catch {
      return NextResponse.json(
        { error: "Failed to resolve public IP address and network attributes." },
        { status: 502 }
      );
    }
  }
}