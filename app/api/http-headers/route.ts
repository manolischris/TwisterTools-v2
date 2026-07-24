import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────
// Route Handler — GET /api/http-headers?url=...&method=HEAD&userAgent=...&followRedirects=true
// ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") || "";
  const method = (searchParams.get("method") || "HEAD") as "HEAD" | "GET";
  const userAgent = searchParams.get("userAgent") || "TwisterTools Inspector 2.0 Bot";
  const followRedirects = searchParams.get("followRedirects") !== "false";

  if (!rawUrl.trim()) {
    return NextResponse.json(
      { error: "Missing required parameter: url" },
      { status: 400 }
    );
  }

  let formattedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  try {
    const startTime = performance.now();

    const response = await fetch(formattedUrl, {
      method,
      headers: {
        "User-Agent": userAgent,
        "Accept": "*/*",
      },
      redirect: followRedirects ? "follow" : "manual",
      signal: AbortSignal.timeout(15000),
    });

    const endTime = performance.now();

    // Extract response headers into a plain object
    const responseHeadersObj: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeadersObj[key] = val;
    });

    // Build raw headers text
    let rawHeadersText = `HTTP/2 ${response.status} ${response.statusText}\n`;
    Object.entries(responseHeadersObj).forEach(([k, v]) => {
      rawHeadersText += `${k}: ${v}\n`;
    });

    // Determine protocol string
    const protocol = "HTTP/2";

    return NextResponse.json({
      url: response.url || formattedUrl,
      statusCode: response.status,
      statusText: response.statusText || (response.status === 200 ? "OK" : "Status Received"),
      responseTimeMs: Math.round(endTime - startTime),
      protocol,
      headers: responseHeadersObj,
      rawHeaders: rawHeadersText,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch URL";
    return NextResponse.json(
      { error: `HTTP request failed: ${message}` },
      { status: 502 }
    );
  }
}