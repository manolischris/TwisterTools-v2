"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Activity,
    Search,
    Filter,
    Server,
    ShieldCheck,
    AlertCircle,
    Info,
    RefreshCw,
    SlidersHorizontal,
    Code,
    Terminal,
    Copy,
    Check,
    ExternalLink,
    HelpCircle,
    BookOpen,
    Layers,
    Share2,
    Database,
    Zap,
    Cpu,
    Radio
} from "lucide-react";

interface StatusCodeInfo {
    code: number;
    name: string;
    category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
    rfc: string;
    rfcUrl: string;
    isStandard: boolean;
    isCacheableByDefault: boolean;
    allowsBody: boolean;
    summary: string;
    cause: string;
    resolution: string;
    recommendedHeaders: { name: string; example: string; purpose: string }[];
    curlCommand: string;
}

const STATUS_CODES: StatusCodeInfo[] = [
    // 1xx Informational
    {
        code: 100,
        name: "Continue",
        category: "1xx",
        rfc: "RFC 9110 §15.2.1",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.2.1",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: false,
        summary: "The server has received the initial request headers and indicates that the client should proceed to transmit the request body.",
        cause: "Sent in response to an 'Expect: 100-continue' request header when the server is ready to consume a payload.",
        resolution: "The client should continue uploading the payload stream; if rejected, expect a 417 Expectation Failed or 413 Payload Too Large.",
        recommendedHeaders: [
            { name: "Expect", example: "100-continue", purpose: "Client initiates check prior to sending heavy body" }
        ],
        curlCommand: "curl -v -H 'Expect: 100-continue' -X POST https://api.example.com/upload --data-binary @file.bin"
    },
    {
        code: 101,
        name: "Switching Protocols",
        category: "1xx",
        rfc: "RFC 9110 §15.2.2",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.2.2",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: false,
        summary: "The server understands and agrees to switch the transmission protocol over this connection as specified by the client Upgrade header.",
        cause: "Client submitted an Upgrade header (typically upgrading an HTTP/1.1 TCP socket to a persistent bi-directional WebSocket connection).",
        resolution: "Maintain the established socket open and commence packet transmission using the negotiated secondary protocol framing.",
        recommendedHeaders: [
            { name: "Upgrade", example: "websocket", purpose: "Specifies target protocol to negotiate" },
            { name: "Connection", example: "Upgrade", purpose: "Marks the connection hop-by-hop upgrade" }
        ],
        curlCommand: "curl -i -N -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==' -H 'Sec-WebSocket-Version: 13' https://api.example.com/ws"
    },
    {
        code: 103,
        name: "Early Hints",
        category: "1xx",
        rfc: "RFC 8297",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc8297",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: false,
        summary: "Returns speculative preliminary Link response headers so the browser can preload critical assets while the server prepares the final payload.",
        cause: "Server offloading static asset pre-connect and pre-load tasks before dynamic backend database rendering finishes.",
        resolution: "Ensure CDN or proxy supports informational response flushing without dropping or stalling the parent socket stream.",
        recommendedHeaders: [
            { name: "Link", example: "</style.css>; rel=preload; as=style", purpose: "Preloads assets in client renderer" }
        ],
        curlCommand: "curl -i https://example.com"
    },

    // 2xx Success
    {
        code: 200,
        name: "OK",
        category: "2xx",
        rfc: "RFC 9110 §15.3.1",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.3.1",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "The HTTP request has succeeded. The actual return payload depends entirely upon the request method used (GET, POST, etc.).",
        cause: "Target resource fetched, processed, or mutated without server-side exception or validation failure.",
        resolution: "Normal successful operation. Inspect caching headers (ETag, Cache-Control) to optimize delivery performance.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/json; charset=utf-8", purpose: "Defines serialization mime type" },
            { name: "Cache-Control", example: "public, max-age=3600, stale-while-revalidate=60", purpose: "Governs intermediate caching" },
            { name: "ETag", example: "\"33a64df551425fcc55e4d42a148795d9f25f89d4\"", purpose: "Entity validator for conditional GETs" }
        ],
        curlCommand: "curl -i -X GET https://api.example.com/v1/users"
    },
    {
        code: 201,
        name: "Created",
        category: "2xx",
        rfc: "RFC 9110 §15.3.2",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.3.2",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The request has been fulfilled and has resulted in the creation of one or more new database or filesystem resources.",
        cause: "POST or PUT successfully committed a brand new persistent entity to the underlying primary storage engine.",
        resolution: "Supply the explicit canonical URI of the newly created entity inside the Location header, accompanied by an optional schema payload.",
        recommendedHeaders: [
            { name: "Location", example: "/api/v1/users/usr_98124a0d8", purpose: "Direct canonical URI of the new entity" },
            { name: "Content-Type", example: "application/json", purpose: "Declares representation encoding format" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/v1/users -H 'Content-Type: application/json' -d '{\"name\":\"Alex Doe\"}'"
    },
    {
        code: 202,
        name: "Accepted",
        category: "2xx",
        rfc: "RFC 9110 §15.3.3",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.3.3",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The request has been accepted for batch or asynchronous background processing, but execution has not yet finished.",
        cause: "Asynchronous task queue initiation (e.g., video transcoding, bulk CSV export, AI model batch embedding).",
        resolution: "Provide an asynchronous status polling URI via the Location or Content-Location response header, or supply a webhook confirmation contract.",
        recommendedHeaders: [
            { name: "Location", example: "/api/v1/jobs/job_49811/status", purpose: "Endpoint to poll execution status" },
            { name: "Retry-After", example: "30", purpose: "Suggested interval before subsequent poll" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/v1/reports/generate"
    },
    {
        code: 204,
        name: "No Content",
        category: "2xx",
        rfc: "RFC 9110 §15.3.5",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.3.5",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: false,
        summary: "The server successfully fulfilled the request and there is no additional content to send in the response payload body.",
        cause: "DELETE operations, PUT/PATCH mutations where UI does not require serialized feedback, or pre-flight CORS OPTIONS queries.",
        resolution: "Do not attach a response body or Content-Length payload. If a response body is transmitted, compliant clients will ignore or discard it.",
        recommendedHeaders: [
            { name: "Access-Control-Allow-Origin", example: "*", purpose: "Used in preflight OPTIONS resolutions" }
        ],
        curlCommand: "curl -i -X DELETE https://api.example.com/v1/items/8741"
    },
    {
        code: 206,
        name: "Partial Content",
        category: "2xx",
        rfc: "RFC 9110 §15.3.7",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.3.7",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "The server is delivering only part of the resource due to a Range header sent by the client (HTTP multi-part byte serving).",
        cause: "HTML5 video/audio streaming seeks, chunked resumable download managers, or paused file transfers.",
        resolution: "Supply Content-Range and matching Content-Length corresponding strictly to the byte-offset requested.",
        recommendedHeaders: [
            { name: "Content-Range", example: "bytes 0-1023/1048576", purpose: "Specifies byte window delivered vs total size" },
            { name: "Accept-Ranges", example: "bytes", purpose: "Signals support for range chunking" }
        ],
        curlCommand: "curl -i -X GET https://example.com/video.mp4 -H 'Range: bytes=0-1023'"
    },

    // 3xx Redirection
    {
        code: 301,
        name: "Moved Permanently",
        category: "3xx",
        rfc: "RFC 9110 §15.4.2",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4.2",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "The target resource has been assigned a new permanent URI and any future references should use one of the returned URIs.",
        cause: "Site domain renames, canonical HTTPS upgrades, or permanent route reorganizations.",
        resolution: "Include the new absolute URL in the Location header. Note: Browsers may switch POST to GET upon receiving 301. For preserved verbs, use 308.",
        recommendedHeaders: [
            { name: "Location", example: "https://twistertools.com/tools/new-route", purpose: "Target canonical destination" },
            { name: "Cache-Control", example: "public, max-age=31536000, immutable", purpose: "Caches redirect in browser cache" }
        ],
        curlCommand: "curl -i https://twistertools.com/old-page"
    },
    {
        code: 302,
        name: "Found",
        category: "3xx",
        rfc: "RFC 9110 §15.4.3",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4.3",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The target resource resides temporarily under a different URI. The redirect is impermanent and future requests should continue hitting original URI.",
        cause: "Temporary landing pages, localized routing, geo-fencing redirects, or auth gates.",
        resolution: "Attach target destination in the Location header. If POST must not mutate into GET, consider 307 Temporary Redirect instead.",
        recommendedHeaders: [
            { name: "Location", example: "https://twistertools.com/maintenance", purpose: "Target temporary destination" }
        ],
        curlCommand: "curl -i https://example.com/temp-route"
    },
    {
        code: 304,
        name: "Not Modified",
        category: "3xx",
        rfc: "RFC 9110 §15.4.5",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4.5",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: false,
        summary: "Indicates that the resource has not been modified since the version specified by the conditional request headers (If-None-Match or If-Modified-Since).",
        cause: "Client cache hit validation. The browser holds an unexpired representation and requests verification without re-downloading bytes.",
        resolution: "Do not transmit a response body. Send refreshed metadata headers (ETag, Cache-Control) so browser serves from internal memory/disk.",
        recommendedHeaders: [
            { name: "ETag", example: "\"33a64df551425fcc55e4d42a148795d9f25f89d4\"", purpose: "Current validator token" },
            { name: "Cache-Control", example: "public, max-age=86400", purpose: "Renewed retention lifetime" }
        ],
        curlCommand: "curl -i https://api.example.com/data -H 'If-None-Match: \"33a64df551425fcc55e4d42a148795d9f25f89d4\"'"
    },
    {
        code: 307,
        name: "Temporary Redirect",
        category: "3xx",
        rfc: "RFC 9110 §15.4.8",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4.8",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "Target resource resides temporarily under a different URI. The user agent MUST NOT change the request method if it performs automatic redirection.",
        cause: "Temporary redirection of non-idempotent operations (POST / PUT) where changing the verb to GET would break transaction semantics.",
        resolution: "Supply the target in the Location header. User agent will automatically re-post identical form or JSON body to new endpoint.",
        recommendedHeaders: [
            { name: "Location", example: "https://node2.api.example.com/v1/orders", purpose: "New endpoint maintaining request verb" }
        ],
        curlCommand: "curl -i -L -X POST https://api.example.com/orders -d '{\"order_id\":1}'"
    },
    {
        code: 308,
        name: "Permanent Redirect",
        category: "3xx",
        rfc: "RFC 9110 §15.4.9",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.4.9",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "Target resource has been assigned a new permanent URI. The user agent MUST NOT change the request method when following the redirect.",
        cause: "Modern replacement for 301 when handling RESTful API mutations (PUT/POST/PATCH) that must preserve payload body across migrations.",
        resolution: "Supply persistent target URI in Location header. Client re-executes verb strictly identically against updated endpoint.",
        recommendedHeaders: [
            { name: "Location", example: "https://v2.api.example.com/checkout", purpose: "Permanent migration target maintaining verb" }
        ],
        curlCommand: "curl -i -L -X PUT https://api.example.com/profile -d '{\"active\":true}'"
    },

    // 4xx Client Errors
    {
        code: 400,
        name: "Bad Request",
        category: "4xx",
        rfc: "RFC 9110 §15.5.1",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.1",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed syntax, invalid JSON).",
        cause: "Unparseable JSON structure, unencoded query strings, schema validation failures, or mismatched header values.",
        resolution: "Inspect request payload syntax against API spec. Use RFC 9457 'Problem Details for HTTP APIs' in JSON error response.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/problem+json", purpose: "Standardized RFC 9457 structured error schema" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/test -H 'Content-Type: application/json' -d '{invalid_json"
    },
    {
        code: 401,
        name: "Unauthorized",
        category: "4xx",
        rfc: "RFC 9110 §15.5.2",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.2",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The request has not been applied because it lacks valid authentication credentials for the target resource.",
        cause: "Missing Bearer token, expired JWT, invalid API secret key, or corrupted signature header.",
        resolution: "Client must authenticate. The server MUST include a WWW-Authenticate header field containing at least one challenge.",
        recommendedHeaders: [
            { name: "WWW-Authenticate", example: "Bearer realm=\"twister-api\", error=\"invalid_token\"", purpose: "Describes challenge requirement" }
        ],
        curlCommand: "curl -i https://api.example.com/v1/protected"
    },
    {
        code: 403,
        name: "Forbidden",
        category: "4xx",
        rfc: "RFC 9110 §15.5.4",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.4",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server understood the request but refuses to authorize it. Unlike 401, authenticating will make no difference without elevated privileges.",
        cause: "Role-Based Access Control (RBAC) denial, IP blocklist, CORS origin restriction, or CSRF token mismatch.",
        resolution: "Verify user permissions, check API key ACL scopes, or confirm tenant domain isolation rules in gateway middleware.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/problem+json", purpose: "RFC 9457 detailing insufficient scope" }
        ],
        curlCommand: "curl -i -H 'Authorization: Bearer valid_token_without_admin_role' https://api.example.com/admin/delete"
    },
    {
        code: 404,
        name: "Not Found",
        category: "4xx",
        rfc: "RFC 9110 §15.5.5",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.5",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.",
        cause: "Typo in URL slug, deleted database record, broken hyperlink, or unmapped route in routing table.",
        resolution: "Confirm requested URI string, verify route registration in backend framework, or verify if resource was permanently removed (use 410 Gone).",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/json", purpose: "Standard machine-readable error payload" }
        ],
        curlCommand: "curl -i https://example.com/non-existent-path"
    },
    {
        code: 405,
        name: "Method Not Allowed",
        category: "4xx",
        rfc: "RFC 9110 §15.5.6",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.6",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The method received in the request-line is known by the origin server but not supported by the target resource.",
        cause: "Submitting a POST or DELETE request to an endpoint that only implements GET and HEAD.",
        resolution: "The server MUST generate an Allow header field containing a list of the target resource's currently supported methods.",
        recommendedHeaders: [
            { name: "Allow", example: "GET, HEAD, OPTIONS", purpose: "Comma-separated list of permissible HTTP methods" }
        ],
        curlCommand: "curl -i -X POST https://example.com/static-page.html"
    },
    {
        code: 408,
        name: "Request Timeout",
        category: "4xx",
        rfc: "RFC 9110 §15.5.9",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.9",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server did not receive a complete request message within the time that it was prepared to wait.",
        cause: "Slow upstream mobile uplink, paused client stream, network partition, or unclosed chunked socket.",
        resolution: "Client may repeat request without modifications. Ensure high MTU stability or increase gateway client_body_timeout.",
        recommendedHeaders: [
            { name: "Connection", example: "close", purpose: "Indicates server will terminate stalled socket" }
        ],
        curlCommand: "curl -i --max-time 10 https://api.example.com/slow-endpoint"
    },
    {
        code: 409,
        name: "Conflict",
        category: "4xx",
        rfc: "RFC 9110 §15.5.10",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.10",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The request could not be completed due to a conflict with the current state of the target resource.",
        cause: "Unique key database collision, optimistic concurrency version mismatch, or simultaneous merge conflicts.",
        resolution: "Supply sufficient diff information in payload body for client to reconcile data and retry transaction with latest version tag.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/problem+json", purpose: "RFC 9457 explaining conflicting state" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/users -d '{\"email\":\"already_taken@example.com\"}'"
    },
    {
        code: 410,
        name: "Gone",
        category: "4xx",
        rfc: "RFC 9110 §15.5.11",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.11",
        isStandard: true,
        isCacheableByDefault: true,
        allowsBody: true,
        summary: "The target resource is no longer available at the origin server and no forwarding address is known. This condition is expected to be permanent.",
        cause: "Intentionally purged product page, deprecated API version cutoff, or compliance-mandated user deletion.",
        resolution: "Search engine crawlers will purge the indexing entry faster than a 404. Clean up dangling internal hyperlinks.",
        recommendedHeaders: [
            { name: "Cache-Control", example: "public, max-age=604800", purpose: "Informs caches of permanent removal" }
        ],
        curlCommand: "curl -i https://example.com/deprecated-endpoint"
    },
    {
        code: 413,
        name: "Payload Too Large",
        category: "4xx",
        rfc: "RFC 9110 §15.5.14",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.14",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server is refusing to process a request because the request payload is larger than the server is willing or able to process.",
        cause: "Uploading an image, video, or payload exceeding reverse proxy client_max_body_size limits (e.g., NGINX 1MB default).",
        resolution: "Increase proxy client_max_body_size or enforce client-side chunked multipart uploading direct to Amazon S3 / Cloudflare R2.",
        recommendedHeaders: [
            { name: "Retry-After", example: "120", purpose: "If condition is temporary, denotes wait period" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/upload --data-binary @huge_archive.zip"
    },
    {
        code: 415,
        name: "Unsupported Media Type",
        category: "4xx",
        rfc: "RFC 9110 §15.5.16",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.16",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The origin server is refusing to service the request because the payload is in a format not supported by this method on the target resource.",
        cause: "Sending application/x-www-form-urlencoded or text/plain to an endpoint that explicitly requires Content-Type: application/json.",
        resolution: "Check Content-Type header on client request. The server should state supported types in response headers or documentation.",
        recommendedHeaders: [
            { name: "Accept", example: "application/json", purpose: "Server signals expected incoming payload schema" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/items -H 'Content-Type: text/plain' -d 'data'"
    },
    {
        code: 422,
        name: "Unprocessable Content",
        category: "4xx",
        rfc: "RFC 9110 §15.5.21",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.5.21",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server understands the content type and syntax of the request entity, but was unable to process the contained instructions due to semantic errors.",
        cause: "JSON syntax is valid, but field validation failed (e.g., age is negative, password is too short, zip code does not exist).",
        resolution: "Return granular field-by-field validation errors formatted with RFC 9457 problem details or an errors array.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/problem+json", purpose: "Details semantic validation violations" }
        ],
        curlCommand: "curl -i -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"age\": -5}'"
    },
    {
        code: 429,
        name: "Too Many Requests",
        category: "4xx",
        rfc: "RFC 6585 §4",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc6585#section-4",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The user has sent too many requests in a given amount of time ('rate limiting').",
        cause: "Surpassing leaky-bucket or sliding-window rate limit counters on API gateway or reverse proxy.",
        resolution: "Inspect Retry-After header. Implement client-side exponential backoff with randomized jitter to prevent thundering herd.",
        recommendedHeaders: [
            { name: "Retry-After", example: "60", purpose: "Seconds to wait before attempting subsequent request" },
            { name: "RateLimit-Limit", example: "100", purpose: "Max requests quota in current burst window" },
            { name: "RateLimit-Remaining", example: "0", purpose: "Available requests remaining" },
            { name: "RateLimit-Reset", example: "1672531200", purpose: "Unix timestamp when window replenishes" }
        ],
        curlCommand: "curl -i https://api.example.com/rate-limited-endpoint"
    },

    // 5xx Server Errors
    {
        code: 500,
        name: "Internal Server Error",
        category: "5xx",
        rfc: "RFC 9110 §15.6.1",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.1",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server encountered an unexpected condition that prevented it from fulfilling the request.",
        cause: "Unhandled exception in application backend, database connection pool exhaustion, null pointer dereference, or syntax failure.",
        resolution: "Check server application trace logs, Sentry, Datadog, or cloud monitor. Do not leak stack traces to client in production.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/problem+json", purpose: "Opaque error reference identifier without stack trace" }
        ],
        curlCommand: "curl -i https://api.example.com/broken-endpoint"
    },
    {
        code: 502,
        name: "Bad Gateway",
        category: "5xx",
        rfc: "RFC 9110 §15.6.3",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.3",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server, while acting as a gateway or proxy, received an invalid response from the inbound upstream server it accessed.",
        cause: "Node.js, Python, or Go microservice process crashed, upstream returned unparseable HTTP, or reverse proxy TLS handshake failed.",
        resolution: "Check if target container or upstream process is listening on designated port. Inspect NGINX error.log or Kubernetes pod restart count.",
        recommendedHeaders: [
            { name: "Content-Type", example: "text/html", purpose: "Default reverse-proxy crash response template" }
        ],
        curlCommand: "curl -i https://api.example.com/proxy-upstream"
    },
    {
        code: 503,
        name: "Service Unavailable",
        category: "5xx",
        rfc: "RFC 9110 §15.6.4",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.4",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server is currently unable to handle the request due to a temporary overload or scheduled maintenance.",
        cause: "CPU saturation, database maintenance window, deployment blue-green switchover, or upstream circuit breaker open.",
        resolution: "The server SHOULD send a Retry-After header field indicating when the client may retry the operation.",
        recommendedHeaders: [
            { name: "Retry-After", example: "300", purpose: "Expected duration of outage in seconds" }
        ],
        curlCommand: "curl -i https://api.example.com/maintenance"
    },
    {
        code: 504,
        name: "Gateway Timeout",
        category: "5xx",
        rfc: "RFC 9110 §15.6.5",
        rfcUrl: "https://www.rfc-editor.org/rfc/rfc9110#section-15.6.5",
        isStandard: true,
        isCacheableByDefault: false,
        allowsBody: true,
        summary: "The server, while acting as a gateway or proxy, did not receive a timely response from an upstream server.",
        cause: "Database query taking 60s+ when proxy timeout is 30s, slow third-party API dependency, or deadlocked thread.",
        resolution: "Optimize slow backend database queries, adjust proxy_read_timeout in NGINX, or convert synchronous block into background task.",
        recommendedHeaders: [
            { name: "Content-Type", example: "application/json", purpose: "Opaque timeout response for API clients" }
        ],
        curlCommand: "curl -i https://api.example.com/long-running-query"
    }
];

export default function HttpStatusCodeChecker() {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [selectedCode, setSelectedCode] = useState<StatusCodeInfo>(STATUS_CODES[3]); // Default to 200 OK
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

    // Live URL Sandbox Tester States
    const [sandboxUrl, setSandboxUrl] = useState<string>("https://jsonplaceholder.typicode.com/posts/1");
    const [sandboxMethod, setSandboxMethod] = useState<string>("GET");
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [sandboxResult, setSandboxResult] = useState<{
        status: number;
        statusText: string;
        timeMs: number;
        headers: { [key: string]: string };
        error?: string;
    } | null>(null);

    const searchInputId = useId();
    const sandboxUrlInputId = useId();
    const sandboxMethodSelectId = useId();

    const filteredCodes = useMemo(() => {
        return STATUS_CODES.filter((item) => {
            const matchesCategory =
                selectedCategory === "ALL" || item.category === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                item.code.toString().includes(q) ||
                item.name.toLowerCase().includes(q) ||
                item.summary.toLowerCase().includes(q);
            return matchesCategory && matchesQuery;
        });
    }, [searchQuery, selectedCategory]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(id);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const handleRunSandbox = async () => {
        if (!sandboxUrl.trim()) return;
        setIsTesting(true);
        setSandboxResult(null);

        const startTime = performance.now();
        try {
            const res = await fetch(sandboxUrl, {
                method: sandboxMethod,
                headers: {
                    "Accept": "application/json, text/plain, */*"
                }
            });
            const elapsed = Math.round(performance.now() - startTime);
            const headersObj: { [key: string]: string } = {};
            res.headers.forEach((val, key) => {
                headersObj[key] = val;
            });

            setSandboxResult({
                status: res.status,
                statusText: res.statusText || "OK",
                timeMs: elapsed,
                headers: headersObj
            });

            // Automatically select code in inspector if found in registry
            const matched = STATUS_CODES.find((c) => c.code === res.status);
            if (matched) {
                setSelectedCode(matched);
            }
        } catch (err: unknown) {
            const elapsed = Math.round(performance.now() - startTime);
            const message = err instanceof Error ? err.message : "CORS or Network Disruption";
            setSandboxResult({
                status: 0,
                statusText: "Network / CORS Blocked",
                timeMs: elapsed,
                headers: {},
                error: message
            });
        } finally {
            setIsTesting(false);
        }
    };

    const getBadgeStyle = (category: string) => {
        switch (category) {
            case "1xx":
                return "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800";
            case "2xx":
                return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
            case "3xx":
                return "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800";
            case "4xx":
                return "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800";
            case "5xx":
                return "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800";
            default:
                return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "HTTP Status Code Reference & Diagnostic Header Matrix",
        "url": "https://twistertools.com/tools/web-tools/http-status-code-checker",
        "description": "Comprehensive RFC 9110 HTTP status code encyclopedia, diagnostic header matrix, client/server resolution paths, and real-time browser sandbox tester.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is the primary RFC governing HTTP Status Codes in 2026?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The authoritative standards defining modern HTTP status semantics are RFC 9110 (HTTP Semantics) published in June 2022, which formally obsoleted RFC 7231 and RFC 2616. Additional codes are codified in companion standards such as RFC 6585 (Additional HTTP Status Codes) and RFC 8297 (Early Hints)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the critical behavioral difference between HTTP 301 and 308 redirects?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Both 301 Moved Permanently and 308 Permanent Redirect signal permanent resource relocation. However, historically, web browsers rewrote POST requests to GET requests when encountering a 301 redirect. RFC 9110 codified HTTP 308 to strictly prohibit method rewriting; under a 308 redirect, the HTTP verb (POST, PUT, DELETE) and payload body must remain identical upon following."
                }
            },
            {
                "@type": "Question",
                "name": "Why should modern REST APIs use 422 Unprocessable Content instead of 400 Bad Request?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Status 400 Bad Request designates structural or syntax errors where the server cannot parse the byte stream (e.g., malformed JSON). Status 422 Unprocessable Content indicates the syntax is fully valid and parseable, but business logic or semantic constraints failed (e.g., negative balance or missing schema property)."
                }
            },
            {
                "@type": "Question",
                "name": "How does HTTP 304 Not Modified optimize browser rendering and CDN costs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When a client sends conditional request headers like If-None-Match with an ETag or If-Modified-Since with a timestamp, the server responds with 304 without transmitting a body if unchanged. This reduces data egress bandwidth to near-zero and instantly loads assets directly from client cache."
                }
            },
            {
                "@type": "Question",
                "name": "Why does the in-browser sandbox tester return status 0 or CORS errors for some URLs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Because this tool runs 100% client-side inside your browser for zero latency and privacy, outbound requests are subject to the browser's Cross-Origin Resource Sharing (CORS) security policies. If the destination server does not return 'Access-Control-Allow-Origin', the browser blocks JavaScript from inspecting the HTTP headers."
                }
            },
            {
                "@type": "Question",
                "name": "What is RFC 9457 Problem Details for HTTP APIs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RFC 9457 defines a standard JSON and XML representation for reporting machine-readable errors from HTTP APIs. Using application/problem+json, responses standardize fields such as 'type', 'title', 'status', 'detail', and 'instance' to prevent ad-hoc error schemas."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Interactive Browser Sandbox Quick-Probe */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                            Live Endpoint Probe & Diagnostic Dispatcher
                        </h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Browser-Native Fetch Engine
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2">
                        <label htmlFor={sandboxMethodSelectId} className="sr-only">
                            HTTP Method
                        </label>
                        <select
                            id={sandboxMethodSelectId}
                            aria-label="HTTP Method Selector"
                            value={sandboxMethod}
                            onChange={(e) => setSandboxMethod(e.target.value)}
                            className="w-full h-11 px-3 text-xs font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="GET">GET</option>
                            <option value="HEAD">HEAD</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="OPTIONS">OPTIONS</option>
                        </select>
                    </div>

                    <div className="sm:col-span-8">
                        <label htmlFor={sandboxUrlInputId} className="sr-only">
                            Target Endpoint URL
                        </label>
                        <input
                            id={sandboxUrlInputId}
                            type="url"
                            aria-label="Target Endpoint URL"
                            value={sandboxUrl}
                            onChange={(e) => setSandboxUrl(e.target.value)}
                            placeholder="https://example.com/api/v1/resource"
                            className="w-full h-11 px-4 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <button
                            type="button"
                            onClick={handleRunSandbox}
                            disabled={isTesting}
                            className="w-full h-11 px-4 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                            <span>{isTesting ? "Testing..." : "Send Request"}</span>
                        </button>
                    </div>
                </div>

                {/* Sandbox Results Banner */}
                {sandboxResult && (
                    <div className={`p-4 rounded-xl border text-xs font-mono transition space-y-2 ${sandboxResult.status >= 200 && sandboxResult.status < 300
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                        : sandboxResult.status >= 300 && sandboxResult.status < 400
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                        }`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold">
                                <span className="px-2 py-0.5 rounded bg-white/60 dark:bg-black/40">
                                    HTTP {sandboxResult.status} {sandboxResult.statusText}
                                </span>
                                <span>Round-trip: {sandboxResult.timeMs} ms</span>
                            </div>
                            {sandboxResult.error && (
                                <span className="text-xs text-rose-700 dark:text-rose-400 font-sans">
                                    {sandboxResult.error}
                                </span>
                            )}
                        </div>

                        {Object.keys(sandboxResult.headers).length > 0 && (
                            <div className="pt-2 border-t border-current/10 space-y-1">
                                <p className="font-bold font-sans text-slate-700 dark:text-slate-300">
                                    Response Headers Inspected:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px]">
                                    {Object.entries(sandboxResult.headers).map(([k, v]) => (
                                        <div key={k} className="truncate">
                                            <span className="font-semibold">{k}:</span> {v}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Status Directory Filter & Selector (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-5 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Filter className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Status Code Registry
                        </h2>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {filteredCodes.length} Codes
                        </span>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <label htmlFor={searchInputId} className="sr-only">
                            Search status codes or keywords
                        </label>
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                            id={searchInputId}
                            type="text"
                            aria-label="Filter status codes by number or description"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by code (e.g. 404, 301) or term..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs font-sans rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1.5">
                        {["ALL", "1xx", "2xx", "3xx", "4xx", "5xx"].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${selectedCategory === cat
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Status Code List */}
                    <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1 p-1">
                        {filteredCodes.map((item) => {
                            const isSelected = selectedCode.code === item.code;
                            return (
                                <button
                                    key={item.code}
                                    type="button"
                                    onClick={() => setSelectedCode(item)}
                                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected
                                        ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border shrink-0 ${getBadgeStyle(item.category)}`}>
                                            {item.code}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 shrink-0">
                                        {item.category}
                                    </span>
                                </button>
                            );
                        })}
                        {filteredCodes.length === 0 && (
                            <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                                <p>No matching HTTP status codes found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Deep RFC Diagnostics, Headers, and cURL Generator (Column Span 7) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-base font-mono font-black rounded-xl border shadow-xs ${getBadgeStyle(selectedCode.category)}`}>
                                {selectedCode.code}
                            </span>
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedCode.name}
                                </h2>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                                    Classification: {selectedCode.category} Family
                                </p>
                            </div>
                        </div>

                        <a
                            href={selectedCode.rfcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 border border-slate-200 dark:border-slate-700 transition self-start sm:self-auto"
                        >
                            <span>{selectedCode.rfc}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    {/* Architectural Properties Badges */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Caching Stance
                            </span>
                            <span className={`text-xs font-bold ${selectedCode.isCacheableByDefault ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                                {selectedCode.isCacheableByDefault ? "Cacheable by Default" : "Non-Cacheable"}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Response Body
                            </span>
                            <span className={`text-xs font-bold ${selectedCode.allowsBody ? "text-indigo-600 dark:text-indigo-400" : "text-amber-600 dark:text-amber-400"}`}>
                                {selectedCode.allowsBody ? "Permitted" : "Prohibited / Empty"}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">
                                Specification
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {selectedCode.isStandard ? "Standard Track" : "Informational"}
                            </span>
                        </div>
                    </div>

                    {/* Summary & Architectural Root Cause */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Summary & Specification Context
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            {selectedCode.summary}
                        </p>
                    </div>

                    {/* Troubleshooting / Cause & Fix Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-1.5">
                            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" /> Root Cause / Trigger
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {selectedCode.cause}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1.5">
                            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" /> Recommended Remediation
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                {selectedCode.resolution}
                            </p>
                        </div>
                    </div>

                    {/* Recommended HTTP Headers */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Prescribed RFC Diagnostic Headers
                        </h3>
                        <div className="space-y-2">
                            {selectedCode.recommendedHeaders.map((header, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                {header.name}
                                            </span>
                                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {header.example}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                            {header.purpose}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(`${header.name}: ${header.example}`, `hdr-${idx}`)}
                                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer self-end sm:self-center"
                                        title="Copy Header String"
                                        aria-label={`Copy Header ${header.name}`}
                                    >
                                        {copiedSnippet === `hdr-${idx}` ? (
                                            <Check className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terminal Reproduction cURL */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                Terminal Reproduction Command (cURL)
                            </h3>
                            <button
                                type="button"
                                onClick={() => handleCopy(selectedCode.curlCommand, "curl")}
                                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                {copiedSnippet === "curl" ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy cURL</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="p-3 bg-slate-950 text-indigo-300 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                            <code>{selectedCode.curlCommand}</code>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE TECHNICAL DOCUMENTATION */}
            <div className="space-y-6">
                {/* Card 1: Architectural Taxonomy of HTTP Response Statuses */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            HTTP Status Code Taxonomy: Standardized Architecture Under RFC 9110
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        In web architectures, the Hypertext Transfer Protocol operates as an application-layer request-response protocol. The three-digit status code represents the fundamental signaling mechanism by which servers inform user agents, reverse proxies, and crawlers about the outcome of their request. Formalized initially in RFC 1945 (HTTP/1.0), modernized under RFC 2616 and RFC 7231, and definitively codified in RFC 9110, status codes are divided into five discrete functional blocks:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 1xx Informational
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Transient handshakes signaling request receipt. They contain only headers terminated by an empty line; no payload body is permitted. Key examples include protocol upgrades (101) and asset preloading via Early Hints (103).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 2xx Successful Operations
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Confirms the client action was received, understood, and successfully executed. Variants like 201 Created and 204 No Content precisely describe storage mutations without redundant data transfers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 3xx Redirection Directives
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Indicates the user agent must perform further action to fulfill the request. Governs search engine index updates, SSL canonicalization, and conditional 304 browser cache validations.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 4xx Client Failures
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Signals that the client made a syntax, semantic, or authorization error. The server remains healthy, but refuses execution due to bad JSON, missing bearer tokens, or rate limit throttling.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2 md:col-span-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> 5xx Server Infrastructure Anomalies
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                The client sent a perfectly valid request, but the server encountered an internal crash, unhandled runtime exception, database connection starvation, or upstream reverse proxy timeout (e.g., NGINX to Node.js / Puma).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Redirect Semantics & Method Rewriting Matrix */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Redirection Matrix: Method Rewriting and Verb Preservation
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        One of the most frequent architectural pitfalls in modern API design is selecting the wrong redirection status code. Historically, early browsers erroneously rewritten POST requests into GET requests upon receiving 301 and 302 statuses. Modern RFCs resolve this by establishing strict verb preservation:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Status Code</th>
                                    <th className="p-3">Permanence</th>
                                    <th className="p-3">Method Preserved?</th>
                                    <th className="p-3">Browser Cache Behavior</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">301 Moved Permanently</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Permanent</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">No (Often converts to GET)</td>
                                    <td className="p-3 font-mono">Aggressive Disk Cache</td>
                                    <td className="p-3">Domain migrations & legacy page SEO</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">302 Found</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Temporary</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">No (Often converts to GET)</td>
                                    <td className="p-3 font-mono">Non-cacheable by default</td>
                                    <td className="p-3">Temporary landing or localized routing</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">307 Temporary Redirect</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Temporary</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Strictly Preserved (POST stays POST)</td>
                                    <td className="p-3 font-mono">Non-cacheable by default</td>
                                    <td className="p-3">API server load balancer redirects</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">308 Permanent Redirect</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400">Permanent</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Strictly Preserved (POST stays POST)</td>
                                    <td className="p-3 font-mono">Aggressive Disk Cache</td>
                                    <td className="p-3">Modern REST API endpoint version deprecation</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Modern Diagnostic Headers and RFC 9457 */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            RFC 9457 & Problem Details: Standardizing Machine-Readable API Errors
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Prior to RFC 9457 (which obsoleted RFC 7807), backend engineering teams routinely invented customized JSON error schemas, producing fractured client integration layers. RFC 9457 standardizes the media type <code className="font-mono text-indigo-600 dark:text-indigo-400">application/problem+json</code> with a formal specification schema:
                    </p>

                    <div className="bg-slate-950 p-4 sm:p-6 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
                        <div className="text-emerald-400 font-bold">
                            HTTP/1.1 422 Unprocessable Content
                            <br />
                            Content-Type: application/problem+json
                        </div>
                        <pre className="text-indigo-300 overflow-x-auto">{`{
  "type": "https://api.twistertools.com/errors/insufficient-funds",
  "title": "Insufficient Account Balance",
  "status": 422,
  "detail": "Your current ledger balance is $12.50, but the checkout transaction requires $45.00.",
  "instance": "/account/transactions/tx_89124a9c",
  "invalid-params": [
    {
      "name": "amount",
      "reason": "Exceeds authorized daily debit cap"
    }
  ]
}`}</pre>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the primary RFC governing HTTP Status Codes in 2026?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The authoritative standards defining modern HTTP status semantics are RFC 9110 (HTTP Semantics) published in June 2022, which formally obsoleted RFC 7231 and RFC 2616. Additional codes are codified in companion standards such as RFC 6585 (Additional HTTP Status Codes) and RFC 8297 (Early Hints).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the critical behavioral difference between HTTP 301 and 308 redirects?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Both 301 Moved Permanently and 308 Permanent Redirect signal permanent resource relocation. However, historically, web browsers rewrote POST requests to GET requests when encountering a 301 redirect. RFC 9110 codified HTTP 308 to strictly prohibit method rewriting; under a 308 redirect, the HTTP verb (POST, PUT, DELETE) and payload body must remain identical upon following.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why should modern REST APIs use 422 Unprocessable Content instead of 400 Bad Request?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Status 400 Bad Request designates structural or syntax errors where the server cannot parse the byte stream (e.g., malformed JSON). Status 422 Unprocessable Content indicates the syntax is fully valid and parseable, but business logic or semantic constraints failed (e.g., negative balance or missing schema property).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How does HTTP 304 Not Modified optimize browser rendering and CDN costs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When a client sends conditional request headers like If-None-Match with an ETag or If-Modified-Since with a timestamp, the server responds with 304 without transmitting a body if unchanged. This reduces data egress bandwidth to near-zero and instantly loads assets directly from client cache.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why does the in-browser sandbox tester return status 0 or CORS errors for some URLs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Because this tool runs 100% client-side inside your browser for zero latency and privacy, outbound requests are subject to the browser&apos;s Cross-Origin Resource Sharing (CORS) security policies. If the destination server does not return &apos;Access-Control-Allow-Origin&apos;, the browser blocks JavaScript from inspecting the HTTP headers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is RFC 9457 Problem Details for HTTP APIs?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                RFC 9457 defines a standard JSON and XML representation for reporting machine-readable errors from HTTP APIs. Using application/problem+json, responses standardize fields such as &apos;type&apos;, &apos;title&apos;, &apos;status&apos;, &apos;detail&apos;, and &apos;instance&apos; to prevent ad-hoc error schemas.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}