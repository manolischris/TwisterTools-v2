"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Server,
    Shield,
    Sliders,
    Copy,
    Check,
    Download,
    Terminal,
    RefreshCw,
    Globe,
    Zap,
    Lock,
    Cpu,
    HardDrive,
    Layers,
    FileCode,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    BookOpen,
    ExternalLink
} from "lucide-react";

type PresetType = "reverse-proxy" | "spa-static" | "php-fpm" | "websocket" | "redirect-only";
type SslType = "letsencrypt" | "custom" | "none";
type SecurityLevel = "strict" | "balanced" | "relaxed";

export default function NginxConfigGenerator() {
    // Basic Settings
    const [preset, setPreset] = useState<PresetType>("reverse-proxy");
    const [serverName, setServerName] = useState<string>("example.com www.example.com");
    const [listenPortHttp, setListenPortHttp] = useState<number>(80);
    const [listenPortHttps, setListenPortHttps] = useState<number>(443);
    const [rootDirectory, setRootDirectory] = useState<string>("/var/www/example.com/html");
    const [indexFiles, setIndexFiles] = useState<string>("index.html index.htm index.php");

    // Reverse Proxy / Upstream
    const [upstreamTarget, setUpstreamTarget] = useState<string>("http://127.0.0.1:3000");
    const [proxyWebsockets, setProxyWebsockets] = useState<boolean>(true);
    const [proxyBuffering, setProxyBuffering] = useState<boolean>(true);
    const [proxyTimeout, setProxyTimeout] = useState<number>(60);
    const [enableUpstreamBlock, setEnableUpstreamBlock] = useState<boolean>(false);
    const [upstreamName, setUpstreamName] = useState<string>("node_upstream");

    // SSL / HTTPS
    const [sslType, setSslType] = useState<SslType>("letsencrypt");
    const [forceHttps, setForceHttps] = useState<boolean>(true);
    const [http2Enabled, setHttp2Enabled] = useState<boolean>(true);
    const [hstsEnabled, setHstsEnabled] = useState<boolean>(true);
    const [hstsIncludeSubdomains, setHstsIncludeSubdomains] = useState<boolean>(true);
    const [sslCertPath, setSslCertPath] = useState<string>("/etc/letsencrypt/live/example.com/fullchain.pem");
    const [sslKeyPath, setSslKeyPath] = useState<string>("/etc/letsencrypt/live/example.com/privkey.pem");

    // Performance & Assets
    const [gzipEnabled, setGzipEnabled] = useState<boolean>(true);
    const [clientMaxBodySize, setClientMaxBodySize] = useState<number>(16);
    const [keepaliveTimeout, setKeepaliveTimeout] = useState<number>(65);
    const [staticAssetCaching, setStaticAssetCaching] = useState<boolean>(true);
    const [staticAssetExpires, setStaticAssetExpires] = useState<string>("30d");

    // Security & Limits
    const [securityLevel, setSecurityLevel] = useState<SecurityLevel>("strict");
    const [blockHiddenFiles, setBlockHiddenFiles] = useState<boolean>(true);
    const [enableRateLimiting, setEnableRateLimiting] = useState<boolean>(false);
    const [rateLimitRps, setRateLimitRps] = useState<number>(10);
    const [rateLimitBurst, setRateLimitBurst] = useState<number>(20);

    // Logging & Misc
    const [accessLogPath, setAccessLogPath] = useState<string>("/var/log/nginx/example.com.access.log");
    const [errorLogPath, setErrorLogPath] = useState<string>("/var/log/nginx/example.com.error.log");
    const [serverTokens, setServerTokens] = useState<boolean>(false);

    // Active Tab in Editor
    const [activeTab, setActiveTab] = useState<"general" | "proxy" | "ssl" | "performance" | "security">("general");
    const [copied, setCopied] = useState<boolean>(false);

    // Input IDs for Accessibility
    const serverNameId = useId();
    const listenHttpId = useId();
    const listenHttpsId = useId();
    const rootDirId = useId();
    const indexFilesId = useId();
    const upstreamTargetId = useId();
    const upstreamNameId = useId();
    const proxyTimeoutId = useId();
    const sslCertId = useId();
    const sslKeyId = useId();
    const maxBodySizeId = useId();
    const keepaliveId = useId();
    const rateLimitRpsId = useId();
    const rateLimitBurstId = useId();
    const accessLogId = useId();
    const errorLogId = useId();
    const staticExpiresId = useId();

    const handleNumberInput = (raw: string, setter: (val: number) => void) => {
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? 0 : num);
    };

    const applyPreset = (newPreset: PresetType) => {
        setPreset(newPreset);
        if (newPreset === "reverse-proxy") {
            setUpstreamTarget("http://127.0.0.1:3000");
            setProxyWebsockets(true);
            setProxyBuffering(true);
            setStaticAssetCaching(true);
            setGzipEnabled(true);
        } else if (newPreset === "spa-static") {
            setRootDirectory("/var/www/example.com/dist");
            setIndexFiles("index.html");
            setStaticAssetCaching(true);
            setGzipEnabled(true);
        } else if (newPreset === "php-fpm") {
            setRootDirectory("/var/www/example.com/public");
            setIndexFiles("index.php index.html");
            setUpstreamTarget("unix:/var/run/php/php8.2-fpm.sock");
            setStaticAssetCaching(true);
        } else if (newPreset === "websocket") {
            setUpstreamTarget("http://127.0.0.1:8080");
            setProxyWebsockets(true);
            setProxyBuffering(false);
            setProxyTimeout(86400);
        } else if (newPreset === "redirect-only") {
            setForceHttps(true);
            setSslType("none");
        }
    };

    const generatedConfig = useMemo(() => {
        const primaryDomain = serverName.trim().split(/\s+/)[0] || "example.com";
        const lines: string[] = [];

        lines.push("# ==========================================================================");
        lines.push(`# NGINX Configuration: ${primaryDomain}`);
        lines.push(`# Generated via TwisterTools NGINX Config Studio`);
        lines.push(`# Environment: Production Ready | Security & Performance Hardened`);
        lines.push("# ==========================================================================");
        lines.push("");

        // Upstream definition if enabled
        if (preset === "reverse-proxy" && enableUpstreamBlock) {
            lines.push(`upstream ${upstreamName} {`);
            lines.push(`    server ${upstreamTarget.replace(/^https?:\/\//, "")};`);
            lines.push("    keepalive 32;");
            lines.push("}");
            lines.push("");
        }

        // Rate limit zone declaration
        if (enableRateLimiting) {
            lines.push("# Rate Limiting Zone (Drop this in your nginx.conf http block if required)");
            lines.push(`limit_req_zone $binary_remote_addr zone=one_${primaryDomain.replace(/[^a-zA-Z0-9]/g, "_")}:10m rate=${rateLimitRps}r/s;`);
            lines.push("");
        }

        // HTTP Server Block (Redirect to HTTPS or Standard HTTP)
        if (sslType !== "none" && forceHttps) {
            lines.push("server {");
            lines.push(`    listen ${listenPortHttp};`);
            lines.push(`    listen [::]:${listenPortHttp};`);
            lines.push(`    server_name ${serverName};`);
            lines.push("");
            lines.push("    # ACME Challenge for Let's Encrypt automated renewals");
            lines.push("    location ^~ /.well-known/acme-challenge/ {");
            lines.push("        default_type \"text/plain\";");
            lines.push("        root /var/www/letsencrypt;");
            lines.push("    }");
            lines.push("");
            lines.push("    # 301 Permanent Redirect all HTTP traffic to HTTPS");
            lines.push("    location / {");
            lines.push("        return 301 https://$host$request_uri;");
            lines.push("    }");
            lines.push("}");
            lines.push("");
        }

        // Main Server Block
        lines.push("server {");
        if (sslType !== "none") {
            const http2Flag = http2Enabled ? " http2" : "";
            lines.push(`    listen ${listenPortHttps} ssl${http2Flag};`);
            lines.push(`    listen [::]:${listenPortHttps} ssl${http2Flag};`);
        } else {
            lines.push(`    listen ${listenPortHttp};`);
            lines.push(`    listen [::]:${listenPortHttp};`);
        }

        lines.push(`    server_name ${serverName};`);
        lines.push(`    root ${rootDirectory};`);
        lines.push(`    index ${indexFiles};`);
        lines.push("");

        // Server tokens banner
        if (!serverTokens) {
            lines.push("    # Disable NGINX signature in headers and error pages");
            lines.push("    server_tokens off;");
            lines.push("");
        }

        // SSL Parameters
        if (sslType !== "none") {
            lines.push("    # SSL / TLS Modern Cryptographic Configuration");
            lines.push(`    ssl_certificate ${sslCertPath};`);
            lines.push(`    ssl_certificate_key ${sslKeyPath};`);
            lines.push("    ssl_protocols TLSv1.2 TLSv1.3;");
            lines.push("    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;");
            lines.push("    ssl_prefer_server_ciphers off;");
            lines.push("    ssl_session_timeout 1d;");
            lines.push("    ssl_session_cache shared:SSL:10m;");
            lines.push("    ssl_session_tickets off;");
            lines.push("    ssl_stapling on;");
            lines.push("    ssl_stapling_verify on;");
            lines.push("    resolver 1.1.1.1 8.8.8.8 8.8.4.4 valid=300s;");
            lines.push("    resolver_timeout 5s;");
            lines.push("");
        }

        // Security Headers
        lines.push("    # Enterprise Security Headers");
        if (securityLevel === "strict") {
            lines.push("    add_header X-Frame-Options \"DENY\" always;");
            lines.push("    add_header X-Content-Type-Options \"nosniff\" always;");
            lines.push("    add_header X-XSS-Protection \"1; mode=block\" always;");
            lines.push("    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;");
            lines.push("    add_header Permissions-Policy \"camera=(), microphone=(), geolocation=()\" always;");
            lines.push("    add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'\" always;");
        } else if (securityLevel === "balanced") {
            lines.push("    add_header X-Frame-Options \"SAMEORIGIN\" always;");
            lines.push("    add_header X-Content-Type-Options \"nosniff\" always;");
            lines.push("    add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;");
        } else {
            lines.push("    add_header X-Content-Type-Options \"nosniff\" always;");
        }

        if (sslType !== "none" && hstsEnabled) {
            const subdomains = hstsIncludeSubdomains ? "; includeSubDomains; preload" : "";
            lines.push(`    add_header Strict-Transport-Security "max-age=31536000${subdomains}" always;`);
        }
        lines.push("");

        // Performance & Limits
        lines.push("    # Request Sizing & Buffering Limits");
        lines.push(`    client_max_body_size ${clientMaxBodySize}M;`);
        lines.push(`    client_body_buffer_size 128k;`);
        lines.push(`    keepalive_timeout ${keepaliveTimeout};`);
        lines.push("");

        // Gzip Compression
        if (gzipEnabled) {
            lines.push("    # Gzip Dynamic Content Compression");
            lines.push("    gzip on;");
            lines.push("    gzip_vary on;");
            lines.push("    gzip_proxied any;");
            lines.push("    gzip_comp_level 6;");
            lines.push("    gzip_buffers 16 8k;");
            lines.push("    gzip_http_version 1.1;");
            lines.push("    gzip_min_length 256;");
            lines.push("    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;");
            lines.push("");
        }

        // Logging
        lines.push("    # Access and Error Logs");
        lines.push(`    access_log ${accessLogPath} combined buffer=512k flush=1m;`);
        lines.push(`    error_log ${errorLogPath} warn;`);
        lines.push("");

        // Hidden files rule
        if (blockHiddenFiles) {
            lines.push("    # Block dotfiles (.git, .env, .htaccess, etc.)");
            lines.push("    location ~ /\\.(?!well-known) {");
            lines.push("        deny all;");
            lines.push("        access_log off;");
            lines.push("        log_not_found off;");
            lines.push("    }");
            lines.push("");
        }

        // Static Assets Caching Block
        if (staticAssetCaching) {
            lines.push("    # High-Performance Static Asset Caching");
            lines.push("    location ~* \\.(?:ico|css|js|gif|jpe?g|png|webp|avif|woff2?|eot|ttf|svg)$ {");
            lines.push(`        expires ${staticAssetExpires};`);
            lines.push("        add_header Cache-Control \"public, max-age=2592000, immutable\";");
            lines.push("        access_log off;");
            lines.push("        try_files $uri =404;");
            lines.push("    }");
            lines.push("");
        }

        // Primary Route Location
        if (preset === "reverse-proxy" || preset === "websocket") {
            const target = enableUpstreamBlock ? `http://${upstreamName}` : upstreamTarget;
            lines.push("    # Reverse Proxy Gateway");
            lines.push("    location / {");

            if (enableRateLimiting) {
                const zone = `one_${primaryDomain.replace(/[^a-zA-Z0-9]/g, "_")}`;
                lines.push(`        limit_req zone=${zone} burst=${rateLimitBurst} nodelay;`);
            }

            lines.push(`        proxy_pass ${target};`);
            lines.push("        proxy_http_version 1.1;");
            lines.push("        proxy_set_header Host $host;");
            lines.push("        proxy_set_header X-Real-IP $remote_addr;");
            lines.push("        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;");
            lines.push("        proxy_set_header X-Forwarded-Proto $scheme;");
            lines.push("        proxy_set_header X-Forwarded-Host $host;");
            lines.push("        proxy_set_header X-Forwarded-Port $server_port;");

            if (proxyWebsockets) {
                lines.push("        # WebSocket Support");
                lines.push("        proxy_set_header Upgrade $http_upgrade;");
                lines.push("        proxy_set_header Connection \"upgrade\";");
            }

            if (!proxyBuffering) {
                lines.push("        proxy_buffering off;");
            }

            lines.push(`        proxy_connect_timeout ${proxyTimeout}s;`);
            lines.push(`        proxy_send_timeout ${proxyTimeout}s;`);
            lines.push(`        proxy_read_timeout ${proxyTimeout}s;`);
            lines.push("    }");
        } else if (preset === "spa-static") {
            lines.push("    # Single Page Application (SPA) HTML5 Routing");
            lines.push("    location / {");
            lines.push("        try_files $uri $uri/ /index.html;");
            lines.push("    }");
        } else if (preset === "php-fpm") {
            lines.push("    # Standard Dynamic PHP Execution");
            lines.push("    location / {");
            lines.push("        try_files $uri $uri/ /index.php?$query_string;");
            lines.push("    }");
            lines.push("");
            lines.push("    location ~ \\.php$ {");
            lines.push("        try_files $uri =404;");
            lines.push("        fastcgi_split_path_info ^(.+\\.php)(/.+)$;");
            lines.push(`        fastcgi_pass ${upstreamTarget.replace(/^unix:/, "unix:")};`);
            lines.push("        fastcgi_index index.php;");
            lines.push("        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;");
            lines.push("        include fastcgi_params;");
            lines.push("    }");
        } else if (preset === "redirect-only") {
            lines.push("    location / {");
            lines.push("        return 301 https://$host$request_uri;");
            lines.push("    }");
        }

        lines.push("}");
        return lines.join("\n");
    }, [
        serverName,
        listenPortHttp,
        listenPortHttps,
        rootDirectory,
        indexFiles,
        preset,
        upstreamTarget,
        proxyWebsockets,
        proxyBuffering,
        proxyTimeout,
        enableUpstreamBlock,
        upstreamName,
        sslType,
        forceHttps,
        http2Enabled,
        hstsEnabled,
        hstsIncludeSubdomains,
        sslCertPath,
        sslKeyPath,
        gzipEnabled,
        clientMaxBodySize,
        keepaliveTimeout,
        staticAssetCaching,
        staticAssetExpires,
        securityLevel,
        blockHiddenFiles,
        enableRateLimiting,
        rateLimitRps,
        rateLimitBurst,
        accessLogPath,
        errorLogPath,
        serverTokens
    ]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedConfig);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const primaryDomain = serverName.trim().split(/\s+/)[0] || "nginx";
        const element = document.createElement("a");
        const file = new Blob([generatedConfig], { type: "text/plain;charset=utf-8" });
        element.href = URL.createObjectURL(file);
        element.download = `${primaryDomain}.conf`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const resetDefaults = () => {
        setPreset("reverse-proxy");
        setServerName("example.com www.example.com");
        setListenPortHttp(80);
        setListenPortHttps(443);
        setRootDirectory("/var/www/example.com/html");
        setIndexFiles("index.html index.htm index.php");
        setUpstreamTarget("http://127.0.0.1:3000");
        setProxyWebsockets(true);
        setProxyBuffering(true);
        setProxyTimeout(60);
        setEnableUpstreamBlock(false);
        setUpstreamName("node_upstream");
        setSslType("letsencrypt");
        setForceHttps(true);
        setHttp2Enabled(true);
        setHstsEnabled(true);
        setHstsIncludeSubdomains(true);
        setSslCertPath("/etc/letsencrypt/live/example.com/fullchain.pem");
        setSslKeyPath("/etc/letsencrypt/live/example.com/privkey.pem");
        setGzipEnabled(true);
        setClientMaxBodySize(16);
        setKeepaliveTimeout(65);
        setStaticAssetCaching(true);
        setStaticAssetExpires("30d");
        setSecurityLevel("strict");
        setBlockHiddenFiles(true);
        setEnableRateLimiting(false);
        setRateLimitRps(10);
        setRateLimitBurst(20);
        setAccessLogPath("/var/log/nginx/example.com.access.log");
        setErrorLogPath("/var/log/nginx/example.com.error.log");
        setServerTokens(false);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Nginx Server Block & Reverse Proxy Config Generator",
        "url": "https://twistertools.com/tools/developer-tools/nginx-config-generator",
        "description": "Generate production-grade NGINX server blocks, reverse proxies, SSL/TLS configurations, security headers, and caching rules instantly.",
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
                "name": "Where should I place this generated NGINX configuration file on Linux?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On standard Ubuntu and Debian systems, place the configuration in /etc/nginx/sites-available/your-domain.conf, then create a symbolic link into /etc/nginx/sites-enabled/ using: sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/. On RHEL, CentOS, AlmaLinux, and Rocky Linux, store the file directly in /etc/nginx/conf.d/your-domain.conf."
                }
            },
            {
                "@type": "Question",
                "name": "How do I test my NGINX configuration for syntax errors before reloading?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Run the command 'sudo nginx -t' in your terminal. If the syntax is verified with 'test is successful', apply the changes gracefully without dropping active connections by executing 'sudo systemctl reload nginx'."
                }
            },
            {
                "@type": "Question",
                "name": "Why are proxy headers like Host and X-Forwarded-For critical for reverse proxies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When NGINX acts as a reverse proxy in front of backend applications (e.g., Node.js, Next.js, Python, or Go), the upstream server sees requests originating from 127.0.0.1. Passing headers like Host, X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto preserves client IP addresses, SSL schemes, and host routing integrity."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between client_max_body_size and fastcgi/proxy buffer limits?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "client_max_body_size defines the ceiling for incoming file uploads and POST request bodies before NGINX rejects requests with HTTP 413 (Payload Too Large). Proxy buffer directives govern how much memory NGINX allocates to hold incoming responses from backend servers before writing temporary spill files to disk."
                }
            },
            {
                "@type": "Question",
                "name": "Does this generator support WebSocket protocol upgrades?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Enabling WebSocket support injects the required 'proxy_set_header Upgrade $http_upgrade' and 'proxy_set_header Connection \"upgrade\"' directives, allowing persistent real-time protocols like Socket.io, GraphQL subscriptions, and standard WebSockets to traverse your proxy seamlessly."
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

            {/* Quick Preset Selector Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Architecture Preset:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => applyPreset("reverse-proxy")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${preset === "reverse-proxy"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            <Server className="w-3.5 h-3.5" /> Node / Python Proxy
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("spa-static")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${preset === "spa-static"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            <Globe className="w-3.5 h-3.5" /> SPA / React / Vue
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("php-fpm")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${preset === "php-fpm"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            <FileCode className="w-3.5 h-3.5" /> PHP-FPM / WordPress
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("websocket")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${preset === "websocket"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            <Zap className="w-3.5 h-3.5" /> WebSockets
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset("redirect-only")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${preset === "redirect-only"
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            <HardDrive className="w-3.5 h-3.5" /> Redirect Only
                        </button>
                    </div>
                </div>
            </div>

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration Tabs & Form Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Configuration Controls
                        </h2>
                        <button
                            type="button"
                            onClick={resetDefaults}
                            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Reset
                        </button>
                    </div>

                    {/* Navigation Sub-Tabs */}
                    <div className="flex items-center border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 pb-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab("general")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${activeTab === "general"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            General
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("proxy")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${activeTab === "proxy"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            Routing / Proxy
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("ssl")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${activeTab === "ssl"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            SSL & Security
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("performance")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${activeTab === "performance"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            Optimization
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("security")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition cursor-pointer ${activeTab === "security"
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            Hardening
                        </button>
                    </div>

                    {/* TAB CONTENT: General */}
                    {activeTab === "general" && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor={serverNameId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Server Name(s) (Domains)
                                </label>
                                <input
                                    id={serverNameId}
                                    type="text"
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                    placeholder="example.com www.example.com"
                                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                                    Space-separated hostnames configured for this server block.
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={listenHttpId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        HTTP Port
                                    </label>
                                    <input
                                        id={listenHttpId}
                                        type="number"
                                        value={listenPortHttp}
                                        onChange={(e) => handleNumberInput(e.target.value, setListenPortHttp)}
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={listenHttpsId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        HTTPS Port
                                    </label>
                                    <input
                                        id={listenHttpsId}
                                        type="number"
                                        value={listenPortHttps}
                                        onChange={(e) => handleNumberInput(e.target.value, setListenPortHttps)}
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor={rootDirId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Document Root Directory
                                </label>
                                <input
                                    id={rootDirId}
                                    type="text"
                                    value={rootDirectory}
                                    onChange={(e) => setRootDirectory(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor={indexFilesId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Index Files
                                </label>
                                <input
                                    id={indexFilesId}
                                    type="text"
                                    value={indexFiles}
                                    onChange={(e) => setIndexFiles(e.target.value)}
                                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={!serverTokens}
                                        onChange={(e) => setServerTokens(!e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Hide NGINX Version in Headers (server_tokens off)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: Proxy */}
                    {activeTab === "proxy" && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor={upstreamTargetId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Proxy Target / Upstream URL or Unix Socket
                                </label>
                                <input
                                    id={upstreamTargetId}
                                    type="text"
                                    value={upstreamTarget}
                                    onChange={(e) => setUpstreamTarget(e.target.value)}
                                    placeholder="http://127.0.0.1:3000"
                                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                                    Supports internal ports (e.g., http://127.0.0.1:3000) or sockets (unix:/run/app.sock).
                                </span>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={proxyWebsockets}
                                        onChange={(e) => setProxyWebsockets(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Enable WebSocket Support (Upgrade / Connection headers)</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={proxyBuffering}
                                        onChange={(e) => setProxyBuffering(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Proxy Buffering (Recommended for general HTTP; disable for SSE)</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enableUpstreamBlock}
                                        onChange={(e) => setEnableUpstreamBlock(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Wrap in Dedicated Upstream Block with Keepalive</span>
                                </label>
                            </div>

                            {enableUpstreamBlock && (
                                <div>
                                    <label htmlFor={upstreamNameId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Upstream Block Name
                                    </label>
                                    <input
                                        id={upstreamNameId}
                                        type="text"
                                        value={upstreamName}
                                        onChange={(e) => setUpstreamName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor={proxyTimeoutId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Proxy Timeout (Seconds)
                                </label>
                                <input
                                    id={proxyTimeoutId}
                                    type="number"
                                    value={proxyTimeout}
                                    onChange={(e) => handleNumberInput(e.target.value, setProxyTimeout)}
                                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: SSL & Security */}
                    {activeTab === "ssl" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    SSL Certificate Provider
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSslType("letsencrypt")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${sslType === "letsencrypt"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Let&apos;s Encrypt
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSslType("custom")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${sslType === "custom"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Custom Cert
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSslType("none")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${sslType === "none"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        HTTP Only
                                    </button>
                                </div>
                            </div>

                            {sslType !== "none" && (
                                <>
                                    <div>
                                        <label htmlFor={sslCertId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            SSL Certificate Path
                                        </label>
                                        <input
                                            id={sslCertId}
                                            type="text"
                                            value={sslCertPath}
                                            onChange={(e) => setSslCertPath(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor={sslKeyId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            SSL Certificate Key Path
                                        </label>
                                        <input
                                            id={sslKeyId}
                                            type="text"
                                            value={sslKeyPath}
                                            onChange={(e) => setSslKeyPath(e.target.value)}
                                            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={forceHttps}
                                                onChange={(e) => setForceHttps(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                            />
                                            <span>Enforce 301 Permanent Redirect HTTP to HTTPS</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={http2Enabled}
                                                onChange={(e) => setHttp2Enabled(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                            />
                                            <span>Enable HTTP/2 Protocol Multiplexing</span>
                                        </label>

                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hstsEnabled}
                                                onChange={(e) => setHstsEnabled(e.target.checked)}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                            />
                                            <span>Enable Strict-Transport-Security (HSTS 1 Year)</span>
                                        </label>

                                        {hstsEnabled && (
                                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 pl-6 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={hstsIncludeSubdomains}
                                                    onChange={(e) => setHstsIncludeSubdomains(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                                />
                                                <span>Include Subdomains & Preload Flag</span>
                                            </label>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT: Optimization */}
                    {activeTab === "performance" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor={maxBodySizeId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Max Body Size (MB)
                                    </label>
                                    <input
                                        id={maxBodySizeId}
                                        type="number"
                                        value={clientMaxBodySize}
                                        onChange={(e) => handleNumberInput(e.target.value, setClientMaxBodySize)}
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={keepaliveId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Keepalive (Seconds)
                                    </label>
                                    <input
                                        id={keepaliveId}
                                        type="number"
                                        value={keepaliveTimeout}
                                        onChange={(e) => handleNumberInput(e.target.value, setKeepaliveTimeout)}
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={gzipEnabled}
                                        onChange={(e) => setGzipEnabled(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Enable Dynamic Gzip Compression</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={staticAssetCaching}
                                        onChange={(e) => setStaticAssetCaching(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Cache Static Assets (Images, Web Fonts, CSS, JS)</span>
                                </label>
                            </div>

                            {staticAssetCaching && (
                                <div>
                                    <label htmlFor={staticExpiresId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                        Static Cache Expiry
                                    </label>
                                    <input
                                        id={staticExpiresId}
                                        type="text"
                                        value={staticAssetExpires}
                                        onChange={(e) => setStaticAssetExpires(e.target.value)}
                                        placeholder="30d"
                                        className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label htmlFor={accessLogId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Access Log Path
                                </label>
                                <input
                                    id={accessLogId}
                                    type="text"
                                    value={accessLogPath}
                                    onChange={(e) => setAccessLogPath(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor={errorLogId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Error Log Path
                                </label>
                                <input
                                    id={errorLogId}
                                    type="text"
                                    value={errorLogPath}
                                    onChange={(e) => setErrorLogPath(e.target.value)}
                                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: Hardening */}
                    {activeTab === "security" && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Security Policy Profile
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSecurityLevel("strict")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${securityLevel === "strict"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Strict (A+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSecurityLevel("balanced")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${securityLevel === "balanced"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Balanced
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSecurityLevel("relaxed")}
                                        className={`p-2 rounded-xl text-xs font-semibold border text-center transition cursor-pointer ${securityLevel === "relaxed"
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                            : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                            }`}
                                    >
                                        Relaxed
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={blockHiddenFiles}
                                        onChange={(e) => setBlockHiddenFiles(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Deny Access to Dotfiles (.git, .env, .htaccess)</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enableRateLimiting}
                                        onChange={(e) => setEnableRateLimiting(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                                    />
                                    <span>Enable IP Rate Limiting (DDoS & Brute Force Defense)</span>
                                </label>
                            </div>

                            {enableRateLimiting && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <label htmlFor={rateLimitRpsId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Rate (Req / Sec)
                                        </label>
                                        <input
                                            id={rateLimitRpsId}
                                            type="number"
                                            value={rateLimitRps}
                                            onChange={(e) => handleNumberInput(e.target.value, setRateLimitRps)}
                                            className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={rateLimitBurstId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                            Burst Allowance
                                        </label>
                                        <input
                                            id={rateLimitBurstId}
                                            type="number"
                                            value={rateLimitBurst}
                                            onChange={(e) => handleNumberInput(e.target.value, setRateLimitBurst)}
                                            className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Panel: Output & Shell Diagnostics (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                    Generated Server Block
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download .conf
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs ${copied
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" /> Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy Config
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Code Display Container */}
                        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-inner">
                            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                                <span>/etc/nginx/sites-available/{serverName.trim().split(/\s+/)[0] || "site"}.conf</span>
                                <span>nginx syntax</span>
                            </div>
                            <pre className="p-4 text-emerald-400 overflow-x-auto max-h-[540px] leading-relaxed select-all">
                                <code>{generatedConfig}</code>
                            </pre>
                        </div>

                        {/* Deployment Quick Guide Bar */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-indigo-600" /> CLI Deployment Command:
                            </span>
                            <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-xs overflow-x-auto flex items-center justify-between">
                                <code>sudo nginx -t &amp;&amp; sudo systemctl reload nginx</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Deep Dive */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Anatomy of a Production-Grade NGINX Server Block
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        NGINX powers over one-third of the world&apos;s busiest web applications because of its asynchronous, event-driven architecture. Unlike traditional thread-per-connection servers, NGINX leverages an epoll-based event loop capable of managing tens of thousands of concurrent connections with predictable, near-constant memory utilization. To unlock this performance in modern cloud topologies, a server block configuration must harmonize four foundational pillars:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Layer 7 Header Integrity
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Behind reverse proxies, applications lose visibility of incoming connection parameters. Directives like <code className="font-mono text-indigo-600 dark:text-indigo-400">proxy_set_header X-Forwarded-Proto $scheme</code> ensure your backend framework accurately identifies TLS encryption without redirect loops.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cryptographic Best Practices
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Restricting handshake negotiation to TLSv1.2 and TLSv1.3 combined with ECDHE ciphers prevents downgrade attacks (e.g., POODLE), while OCSP stapling offloads certificate revocation validation delays from mobile clients.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Micro-Caching &amp; Offloading
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Serving static assets directly with immutable HTTP headers bypasses the Node.js or Python runtime entirely, eliminating execution event loop blockage for images, compiled scripts, and font glyphs.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Performance Benchmark & Directives Comparison */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Benchmark Directives: Default vs. Tuned Production Configuration
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Default stock configurations shipped with standard Linux distributions are tuned for conservative legacy compatibility rather than high-throughput production workloads. The following comparison highlights key configuration differentials:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">NGINX Directive</th>
                                    <th className="p-3">Default Package Value</th>
                                    <th className="p-3">TwisterTools Hardened Config</th>
                                    <th className="p-3">Operational Benefit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-slate-900 dark:text-white text-xs">server_tokens</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">on (Exposes Version)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">off</td>
                                    <td className="p-3">Prevents automated vulnerability scanning fingerprinting</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-slate-900 dark:text-white text-xs">ssl_protocols</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">TLSv1 TLSv1.1 TLSv1.2</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">TLSv1.2 TLSv1.3 Only</td>
                                    <td className="p-3">Eliminates obsolete cryptographic cipher suites</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-slate-900 dark:text-white text-xs">gzip_comp_level</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">1 (Suboptimal)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">6</td>
                                    <td className="p-3">Optimal compression-to-CPU ratio for modern microprocessors</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-slate-900 dark:text-white text-xs">proxy_http_version</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">1.0 (No Keepalive)</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">1.1</td>
                                    <td className="p-3">Reuses upstream TCP sockets; avoids socket exhaustion</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-slate-900 dark:text-white text-xs">client_max_body_size</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">1M</td>
                                    <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Configurable (16M default)</td>
                                    <td className="p-3">Permits modern image and media uploads without 413 errors</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Reverse Proxy Troubleshooting & Edge Cases */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Crucial Deployment Rules: Avoiding 502 Bad Gateway and Redirect Loops
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        When orchestrating reverse proxies in Docker, Kubernetes, or standalone systemd architectures, engineers frequently encounter specific failure modes. Keep these deployment rules in mind:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Stability
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Always test configs prior to reload:</strong> Run <code className="font-mono text-indigo-600 dark:text-indigo-400">sudo nginx -t</code> in CI/CD or before restarting systemd services to guarantee zero-downtime reloads.
                                </li>
                                <li>
                                    • <strong>Separate access and error logs per domain:</strong> Collating all domains into the default access.log severely complicates debugging and rate-limiting analysis.
                                </li>
                                <li>
                                    • <strong>Use Unix domain sockets for co-located backends:</strong> If your Node.js or Gunicorn application runs on the same physical host, unix sockets bypass the network stack for ~15% lower latency.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" /> Common Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>The Trailing Slash Trap:</strong> Passing <code className="font-mono text-indigo-600 dark:text-indigo-400">proxy_pass http://127.0.0.1:3000/</code> vs <code className="font-mono text-indigo-600 dark:text-indigo-400">proxy_pass http://127.0.0.1:3000;</code> fundamentally changes URI rewriting behavior. Omit the trailing slash to forward URIs untouched.
                                </li>
                                <li>
                                    • <strong>Cloudflare Flexible SSL Loops:</strong> If using Cloudflare with Flexible SSL, NGINX receiving port 80 traffic will 301 redirect back to HTTPS, generating an infinite <code className="font-mono text-amber-600 dark:text-amber-400">ERR_TOO_MANY_REDIRECTS</code>. Set Cloudflare SSL mode to Full (Strict).
                                </li>
                                <li>
                                    • <strong>Missing WebSocket Upgrade headers:</strong> Real-time libraries will silently degrade to HTTP long-polling if both <code className="font-mono text-indigo-600 dark:text-indigo-400">Upgrade</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">Connection</code> headers are omitted.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Static FAQ Section */}
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
                                Where should I place this generated NGINX configuration file on Linux?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                On standard Ubuntu and Debian systems, place the configuration in <code className="font-mono text-indigo-600 dark:text-indigo-400">/etc/nginx/sites-available/your-domain.conf</code>, then create a symbolic link into <code className="font-mono text-indigo-600 dark:text-indigo-400">/etc/nginx/sites-enabled/</code> using: <code className="font-mono text-indigo-600 dark:text-indigo-400">sudo ln -s /etc/nginx/sites-available/your-domain.conf /etc/nginx/sites-enabled/</code>. On RHEL, CentOS, AlmaLinux, and Rocky Linux, store the file directly in <code className="font-mono text-indigo-600 dark:text-indigo-400">/etc/nginx/conf.d/your-domain.conf</code>.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do I test my NGINX configuration for syntax errors before reloading?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Run the command <code className="font-mono text-indigo-600 dark:text-indigo-400">sudo nginx -t</code> in your terminal. If the syntax is verified with &ldquo;test is successful&rdquo;, apply the changes gracefully without dropping active connections by executing <code className="font-mono text-indigo-600 dark:text-indigo-400">sudo systemctl reload nginx</code>.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why are proxy headers like Host and X-Forwarded-For critical for reverse proxies?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                When NGINX acts as a reverse proxy in front of backend applications (e.g., Node.js, Next.js, Python, or Go), the upstream server sees requests originating from 127.0.0.1. Passing headers like Host, X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto preserves client IP addresses, SSL schemes, and host routing integrity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between client_max_body_size and fastcgi/proxy buffer limits?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                client_max_body_size defines the ceiling for incoming file uploads and POST request bodies before NGINX rejects requests with HTTP 413 (Payload Too Large). Proxy buffer directives govern how much memory NGINX allocates to hold incoming responses from backend servers before writing temporary spill files to disk.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this generator support WebSocket protocol upgrades?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. Enabling WebSocket support injects the required &ldquo;proxy_set_header Upgrade $http_upgrade&rdquo; and &ldquo;proxy_set_header Connection &quot;upgrade&quot;&rdquo; directives, allowing persistent real-time protocols like Socket.io, GraphQL subscriptions, and standard WebSockets to traverse your proxy seamlessly.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}