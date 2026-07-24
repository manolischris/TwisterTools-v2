import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/geoip?ip=8.8.8.8
 *
 * Server-side proxy for GeoIP lookups.
 * Uses HTTP for ip-api.com (free tier) and HTTPS for ipapi.co (fallback).
 * This bypasses CORS restrictions and browser extension fetch interceptors.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip") || "";

  // ── Provider 1: ip-api.com (via HTTP — free tier) ──
  try {
    const fields = "status,message,query,city,region,regionName,country,countryCode,lat,lon,zip,timezone,isp,org,as";
    const endpoint = ip
      ? `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}`
      : `http://ip-api.com/json/?fields=${fields}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { "User-Agent": "TwisterTools/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.status !== "fail") {
        return NextResponse.json({ provider: "ip-api", data });
      }
    }
  } catch {
    // Fall through to fallback
  }

  // ── Provider 2 (fallback): ipapi.co ──
  try {
    const endpoint = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { "User-Agent": "TwisterTools/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return NextResponse.json({ provider: "ipapi", data });
      }
    }
  } catch {
    // Fall through to error
  }

  return NextResponse.json(
    { error: "All GeoIP lookup providers failed. Please try again later." },
    { status: 502 }
  );
}
