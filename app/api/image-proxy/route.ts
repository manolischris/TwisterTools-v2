import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
        return new NextResponse("Missing 'url' query parameter", { status: 400 });
    }

    // Validate the URL to prevent SSRF attacks — only allow http/https
    let targetUrl: URL;
    try {
        targetUrl = new URL(url);
        if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
            return new NextResponse("Only http/https URLs are allowed", { status: 400 });
        }
    } catch {
        return new NextResponse("Invalid URL", { status: 400 });
    }

    try {
        const response = await fetch(targetUrl.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        });

        if (!response.ok) {
            return new NextResponse(`Failed to fetch image: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "image/png";
        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return new NextResponse("Failed to fetch image", { status: 502 });
    }
}