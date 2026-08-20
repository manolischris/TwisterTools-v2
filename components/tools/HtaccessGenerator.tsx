"use client";

import React, { useState, useMemo } from "react";
import {
    FileCode,
    Copy,
    Check,
    Download,
    RefreshCw,
    ShieldCheck,
    Globe,
    Zap,
    Lock,
    FolderKanban,
    HelpCircle,
    BookOpen,
    AlertTriangle,
    Sliders,
    Code2,
    Layers,
    Server,
    ExternalLink,
    CheckCircle2
} from "lucide-react";

interface CustomRedirect {
    id: string;
    from: string;
    to: string;
    type: "301" | "302";
}

interface CustomHeader {
    id: string;
    name: string;
    value: string;
}

export default function HtaccessGenerator() {
    // 1. Core Server & Environment Options
    const [enableRewriteEngine, setEnableRewriteEngine] = useState<boolean>(true);
    const [forceHttps, setForceHttps] = useState<boolean>(true);
    const [wwwPreference, setWwwPreference] = useState<"none" | "force-www" | "force-non-www">("force-non-www");
    const [customDomain, setCustomDomain] = useState<string>("example.com");
    const [enableHsts, setEnableHsts] = useState<boolean>(true);
    const [hstsMaxAge, setHstsMaxAge] = useState<number>(31536000);
    const [hstsIncludeSubdomains, setHstsIncludeSubdomains] = useState<boolean>(true);
    const [hstsPreload, setHstsPreload] = useState<boolean>(false);

    // 2. URL Cleaning & SEO
    const [removeTrailingSlash, setRemoveTrailingSlash] = useState<boolean>(false);
    const [appendTrailingSlash, setAppendTrailingSlash] = useState<boolean>(false);
    const [removePhpExtension, setRemovePhpExtension] = useState<boolean>(true);
    const [removeHtmlExtension, setRemoveHtmlExtension] = useState<boolean>(false);

    // 3. Performance, Caching & Compression
    const [enableGzip, setEnableGzip] = useState<boolean>(true);
    const [enableBrotli, setEnableBrotli] = useState<false | true>(false);
    const [enableBrowserCaching, setEnableBrowserCaching] = useState<boolean>(true);
    const [cacheDurationImages, setCacheDurationImages] = useState<string>("1 year");
    const [cacheDurationCssJs, setCacheDurationCssJs] = useState<string>("1 month");
    const [cacheDurationMedia, setCacheDurationMedia] = useState<string>("1 month");

    // 4. Security, Protection & Hardening
    const [disableDirectoryListing, setDisableDirectoryListing] = useState<boolean>(true);
    const [protectSensitiveFiles, setProtectSensitiveFiles] = useState<boolean>(true);
    const [preventHotlinking, setPreventHotlinking] = useState<boolean>(false);
    const [hotlinkAllowedDomains, setHotlinkAllowedDomains] = useState<string>("example.com");
    const [blockSpecificIps, setBlockSpecificIps] = useState<boolean>(false);
    const [blockedIpsList, setBlockedIpsList] = useState<string>("192.168.1.1\n10.0.0.1");
    const [blockBadBots, setBlockBadBots] = useState<boolean>(true);
    const [preventClickjacking, setPreventClickjacking] = useState<boolean>(true);
    const [xContentTypeOptions, setXContentTypeOptions] = useState<boolean>(true);
    const [referrerPolicy, setReferrerPolicy] = useState<string>("strict-origin-when-cross-origin");

    // 5. Custom Error Pages
    const [custom404, setCustom404] = useState<boolean>(true);
    const [custom404Path, setCustom404Path] = useState<string>("/404.html");
    const [custom403, setCustom403] = useState<boolean>(true);
    const [custom403Path, setCustom403Path] = useState<string>("/403.html");
    const [custom500, setCustom500] = useState<boolean>(true);
    const [custom500Path, setCustom500Path] = useState<string>("/500.html");

    // 6. Custom Redirects List
    const [customRedirects, setCustomRedirects] = useState<CustomRedirect[]>([
        { id: "1", from: "/old-page", to: "/new-page", type: "301" }
    ]);
    const [newRedirectFrom, setNewRedirectFrom] = useState<string>("");
    const [newRedirectTo, setNewRedirectTo] = useState<string>("");
    const [newRedirectType, setNewRedirectType] = useState<"301" | "302">("301");

    // 7. Custom Headers
    const [customHeaders, setCustomHeaders] = useState<CustomHeader[]>([
        { id: "1", name: "X-Frame-Options", value: "SAMEORIGIN" }
    ]);
    const [newHeaderName, setNewHeaderName] = useState<string>("");
    const [newHeaderValue, setNewHeaderValue] = useState<string>("");

    // Output visual state
    const [copied, setCopied] = useState<boolean>(false);
    const [activeSectionTab, setActiveSectionTab] = useState<"presets" | "https" | "seo" | "caching" | "security" | "errors" | "redirects">("presets");

    // Handle number sanitize helper
    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseInt(cleaned, 10);
        setter(isNaN(num) ? 0 : num);
    };

    // Add Redirect
    const handleAddRedirect = () => {
        if (!newRedirectFrom.trim() || !newRedirectTo.trim()) return;
        setCustomRedirects([
            ...customRedirects,
            {
                id: Date.now().toString(),
                from: newRedirectFrom.trim(),
                to: newRedirectTo.trim(),
                type: newRedirectType
            }
        ]);
        setNewRedirectFrom("");
        setNewRedirectTo("");
    };

    const handleRemoveRedirect = (id: string) => {
        setCustomRedirects(customRedirects.filter(r => r.id !== id));
    };

    // Add Custom Header
    const handleAddHeader = () => {
        if (!newHeaderName.trim() || !newHeaderValue.trim()) return;
        setCustomHeaders([
            ...customHeaders,
            {
                id: Date.now().toString(),
                name: newHeaderName.trim(),
                value: newHeaderValue.trim()
            }
        ]);
        setNewHeaderName("");
        setNewHeaderValue("");
    };

    const handleRemoveHeader = (id: string) => {
        setCustomHeaders(customHeaders.filter(h => h.id !== id));
    };

    // Apply Presets
    const handleApplyPreset = (preset: "standard" | "hardened" | "spa" | "high-performance") => {
        if (preset === "standard") {
            setEnableRewriteEngine(true);
            setForceHttps(true);
            setWwwPreference("force-non-www");
            setEnableHsts(false);
            setRemoveTrailingSlash(false);
            setAppendTrailingSlash(false);
            setRemovePhpExtension(true);
            setRemoveHtmlExtension(false);
            setEnableGzip(true);
            setEnableBrowserCaching(true);
            setDisableDirectoryListing(true);
            setProtectSensitiveFiles(true);
            setPreventHotlinking(false);
            setBlockBadBots(true);
            setPreventClickjacking(true);
            setXContentTypeOptions(true);
            setCustom404(true);
            setCustom403(true);
            setCustom500(true);
        } else if (preset === "hardened") {
            setEnableRewriteEngine(true);
            setForceHttps(true);
            setWwwPreference("force-non-www");
            setEnableHsts(true);
            setHstsMaxAge(63072000);
            setHstsIncludeSubdomains(true);
            setHstsPreload(true);
            setRemoveTrailingSlash(false);
            setAppendTrailingSlash(false);
            setRemovePhpExtension(true);
            setRemoveHtmlExtension(false);
            setEnableGzip(true);
            setEnableBrowserCaching(true);
            setDisableDirectoryListing(true);
            setProtectSensitiveFiles(true);
            setPreventHotlinking(true);
            setBlockBadBots(true);
            setPreventClickjacking(true);
            setXContentTypeOptions(true);
            setCustom404(true);
            setCustom403(true);
            setCustom500(true);
        } else if (preset === "high-performance") {
            setEnableRewriteEngine(true);
            setForceHttps(true);
            setEnableGzip(true);
            setEnableBrotli(true);
            setEnableBrowserCaching(true);
            setDisableDirectoryListing(true);
            setProtectSensitiveFiles(true);
            setPreventClickjacking(true);
            setXContentTypeOptions(true);
        } else if (preset === "spa") {
            setEnableRewriteEngine(true);
            setForceHttps(true);
            setDisableDirectoryListing(true);
            setProtectSensitiveFiles(true);
            setEnableGzip(true);
            setEnableBrowserCaching(true);
        }
    };

    // Reset Engine
    const handleResetAll = () => {
        setEnableRewriteEngine(true);
        setForceHttps(true);
        setWwwPreference("force-non-www");
        setCustomDomain("example.com");
        setEnableHsts(true);
        setHstsMaxAge(31536000);
        setHstsIncludeSubdomains(true);
        setHstsPreload(false);
        setRemoveTrailingSlash(false);
        setAppendTrailingSlash(false);
        setRemovePhpExtension(true);
        setRemoveHtmlExtension(false);
        setEnableGzip(true);
        setEnableBrotli(false);
        setEnableBrowserCaching(true);
        setCacheDurationImages("1 year");
        setCacheDurationCssJs("1 month");
        setCacheDurationMedia("1 month");
        setDisableDirectoryListing(true);
        setProtectSensitiveFiles(true);
        setPreventHotlinking(false);
        setHotlinkAllowedDomains("example.com");
        setBlockSpecificIps(false);
        setBlockedIpsList("192.168.1.1\n10.0.0.1");
        setBlockBadBots(true);
        setPreventClickjacking(true);
        setXContentTypeOptions(true);
        setReferrerPolicy("strict-origin-when-cross-origin");
        setCustom404(true);
        setCustom404Path("/404.html");
        setCustom403(true);
        setCustom403Path("/403.html");
        setCustom500(true);
        setCustom500Path("/500.html");
        setCustomRedirects([
            { id: "1", from: "/old-page", to: "/new-page", type: "301" }
        ]);
        setCustomHeaders([
            { id: "1", name: "X-Frame-Options", value: "SAMEORIGIN" }
        ]);
    };

    // Full Generator Engine
    const generatedHtaccess = useMemo(() => {
        const lines: string[] = [];

        lines.push("# ==============================================================================");
        lines.push("# APACHE .HTACCESS PRODUCTION DIRECTIVES & REWRITE RULES");
        lines.push(`# Generated via TwisterTools.com htaccess-generator on ${new Date().toISOString().split("T")[0]}`);
        lines.push("# ==============================================================================\n");

        // 1. DIRECTORY LISTINGS & DEFAULT ENCODING
        lines.push("# ------------------------------------------------------------------------------");
        lines.push("# 1. CORE SERVER DEFAULTS & CHARACTER ENCODING");
        lines.push("# ------------------------------------------------------------------------------");
        if (disableDirectoryListing) {
            lines.push("Options -Indexes");
        } else {
            lines.push("Options +Indexes");
        }
        lines.push("Options +FollowSymLinks");
        lines.push("AddDefaultCharset UTF-8");
        lines.push("ServerSignature Off\n");

        // 2. ERROR DOCUMENTS
        if (custom404 || custom403 || custom500) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 2. CUSTOM ERROR HANDLERS");
            lines.push("# ------------------------------------------------------------------------------");
            if (custom403) lines.push(`ErrorDocument 403 ${custom403Path}`);
            if (custom404) lines.push(`ErrorDocument 404 ${custom404Path}`);
            if (custom500) lines.push(`ErrorDocument 500 ${custom500Path}`);
            lines.push("");
        }

        // 3. SECURITY HEADERS & HARDENING
        lines.push("# ------------------------------------------------------------------------------");
        lines.push("# 3. SECURITY HEADERS & BROWSER HARDENING");
        lines.push("# ------------------------------------------------------------------------------");
        lines.push("<IfModule mod_headers.c>");
        if (preventClickjacking) {
            lines.push('    Header always set X-Frame-Options "SAMEORIGIN"');
        }
        if (xContentTypeOptions) {
            lines.push('    Header always set X-Content-Type-Options "nosniff"');
        }
        if (referrerPolicy) {
            lines.push(`    Header always set Referrer-Policy "${referrerPolicy}"`);
        }
        lines.push('    Header always set X-XSS-Protection "1; mode=block"');
        lines.push('    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"');

        if (enableHsts && forceHttps) {
            let hstsHeader = `max-age=${hstsMaxAge}`;
            if (hstsIncludeSubdomains) hstsHeader += "; includeSubDomains";
            if (hstsPreload) hstsHeader += "; preload";
            lines.push(`    Header always set Strict-Transport-Security "${hstsHeader}" env=HTTPS`);
        }

        // Custom user-defined headers
        if (customHeaders.length > 0) {
            customHeaders.forEach((h) => {
                if (h.name.trim() && h.value.trim()) {
                    lines.push(`    Header set ${h.name.trim()} "${h.value.trim()}"`);
                }
            });
        }
        lines.push("</IfModule>\n");

        // 4. SENSITIVE FILE PROTECTION
        if (protectSensitiveFiles) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 4. PROTECT SENSITIVE SYSTEM FILES & DOTFILES");
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("<FilesMatch \"^\\.(htaccess|htpasswd|env|git|svn|json|lock|bak|config|sql|log|sh)$\">");
            lines.push("    <IfModule mod_authz_core.c>");
            lines.push("        Require all denied");
            lines.push("    </IfModule>");
            lines.push("    <IfModule !mod_authz_core.c>");
            lines.push("        Order deny,allow");
            lines.push("        Deny from all");
            lines.push("    </IfModule>");
            lines.push("</FilesMatch>\n");
        }

        // 5. IP BLOCKING
        if (blockSpecificIps && blockedIpsList.trim()) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 5. ACCESS CONTROL & IP BLACKLISTING");
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("<IfModule mod_authz_core.c>");
            lines.push("    <RequireAll>");
            lines.push("        Require all granted");
            blockedIpsList
                .split("\n")
                .map((ip) => ip.trim())
                .filter(Boolean)
                .forEach((ip) => {
                    lines.push(`        Require not ip ${ip}`);
                });
            lines.push("    </RequireAll>");
            lines.push("</IfModule>\n");
        }

        // 6. GZIP / BROTLI COMPRESSION
        if (enableGzip || enableBrotli) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 6. MOD_DEFLATE / GZIP COMPRESSION");
            lines.push("# ------------------------------------------------------------------------------");
            if (enableGzip) {
                lines.push("<IfModule mod_deflate.c>");
                lines.push("    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css");
                lines.push("    AddOutputFilterByType DEFLATE application/javascript application/x-javascript");
                lines.push("    AddOutputFilterByType DEFLATE application/json application/xml application/rss+xml");
                lines.push("    AddOutputFilterByType DEFLATE image/svg+xml font/ttf font/otf font/woff font/woff2");
                lines.push("</IfModule>");
            }
            if (enableBrotli) {
                lines.push("<IfModule mod_brotli.c>");
                lines.push("    AddOutputFilterByType BROTLI_COMPRESS text/html text/plain text/xml text/css");
                lines.push("    AddOutputFilterByType BROTLI_COMPRESS application/javascript application/json application/xml");
                lines.push("    AddOutputFilterByType BROTLI_COMPRESS image/svg+xml font/woff2");
                lines.push("</IfModule>");
            }
            lines.push("");
        }

        // 7. BROWSER CACHING (MOD_EXPIRES)
        if (enableBrowserCaching) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 7. MOD_EXPIRES BROWSER CACHING (LEVERAGE CACHE)");
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("<IfModule mod_expires.c>");
            lines.push("    ExpiresActive On");
            lines.push("    ExpiresDefault \"access plus 2 days\"");
            lines.push(`    # Images & Icons`);
            lines.push(`    ExpiresByType image/jpeg "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/png "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/webp "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/avif "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/gif "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/svg+xml "access plus ${cacheDurationImages}"`);
            lines.push(`    ExpiresByType image/x-icon "access plus ${cacheDurationImages}"`);
            lines.push(`    # CSS, JavaScript & Fonts`);
            lines.push(`    ExpiresByType text/css "access plus ${cacheDurationCssJs}"`);
            lines.push(`    ExpiresByType text/javascript "access plus ${cacheDurationCssJs}"`);
            lines.push(`    ExpiresByType application/javascript "access plus ${cacheDurationCssJs}"`);
            lines.push(`    ExpiresByType font/woff2 "access plus 1 year"`);
            lines.push(`    ExpiresByType font/woff "access plus 1 year"`);
            lines.push(`    # Media & Audio/Video`);
            lines.push(`    ExpiresByType video/mp4 "access plus ${cacheDurationMedia}"`);
            lines.push(`    ExpiresByType video/webm "access plus ${cacheDurationMedia}"`);
            lines.push("</IfModule>\n");
        }

        // 8. MOD_REWRITE ENGINE & RULES
        if (enableRewriteEngine) {
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("# 8. MOD_REWRITE ENGINE DIRECTIVES & CANONICAL RULES");
            lines.push("# ------------------------------------------------------------------------------");
            lines.push("<IfModule mod_rewrite.c>");
            lines.push("    RewriteEngine On");
            lines.push("    RewriteBase /\n");

            // Block Bad Bots User Agents
            if (blockBadBots) {
                lines.push("    # Block Scrapers & Malicious Spiders");
                lines.push("    RewriteCond %{HTTP_USER_AGENT} (libwww-perl|wget|python|nikto|curl|scan|clshttp|archiver|loader|email|harvest|extract|grab|miner) [NC]");
                lines.push("    RewriteRule .* - [F,L]\n");
            }

            // Force HTTPS
            if (forceHttps) {
                lines.push("    # Enforce Secure HTTPS Connection");
                lines.push("    RewriteCond %{HTTPS} !=on");
                lines.push("    RewriteCond %{HTTP:X-Forwarded-Proto} !https [NC]");
                lines.push("    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]\n");
            }

            // Canonical WWW vs Non-WWW
            if (wwwPreference === "force-www") {
                lines.push("    # Canonical Force WWW");
                lines.push("    RewriteCond %{HTTP_HOST} !^www\\. [NC]");
                lines.push("    RewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [R=301,L]\n");
            } else if (wwwPreference === "force-non-www") {
                lines.push("    # Canonical Force Non-WWW");
                lines.push("    RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]");
                lines.push("    RewriteRule ^(.*)$ https://%1/$1 [R=301,L]\n");
            }

            // Remove or Enforce Trailing Slash
            if (removeTrailingSlash && !appendTrailingSlash) {
                lines.push("    # Remove Trailing Slashes from Non-Directories");
                lines.push("    RewriteCond %{REQUEST_FILENAME} !-d");
                lines.push("    RewriteCond %{REQUEST_URI} (.+)/$");
                lines.push("    RewriteRule ^ %1 [R=301,L]\n");
            } else if (appendTrailingSlash && !removeTrailingSlash) {
                lines.push("    # Force Trailing Slashes on Directories & URLs");
                lines.push("    RewriteCond %{REQUEST_FILENAME} !-f");
                lines.push("    RewriteCond %{REQUEST_URI} !(.[a-zA-Z0-9]{1,5})$");
                lines.push("    RewriteCond %{REQUEST_URI} !(.*)/$");
                lines.push("    RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1/ [R=301,L]\n");
            }

            // Clean .php extensions
            if (removePhpExtension) {
                lines.push("    # Clean .php Extension (Hide Extension in URLs)");
                lines.push("    RewriteCond %{THE_REQUEST} ^[A-Z]{3,}\\s([^.]+)\\.php [NC]");
                lines.push("    RewriteRule ^ %1 [R=301,L]");
                lines.push("    RewriteCond %{REQUEST_FILENAME} !-d");
                lines.push("    RewriteCond %{REQUEST_FILENAME}.php -f");
                lines.push("    RewriteRule ^(.*?)/?$ $1.php [L]\n");
            }

            // Clean .html extensions
            if (removeHtmlExtension) {
                lines.push("    # Clean .html Extension (Hide Extension in URLs)");
                lines.push("    RewriteCond %{THE_REQUEST} ^[A-Z]{3,}\\s([^.]+)\\.html [NC]");
                lines.push("    RewriteRule ^ %1 [R=301,L]");
                lines.push("    RewriteCond %{REQUEST_FILENAME} !-d");
                lines.push("    RewriteCond %{REQUEST_FILENAME}.html -f");
                lines.push("    RewriteRule ^(.*?)/?$ $1.html [L]\n");
            }

            // Prevent Image Hotlinking
            if (preventHotlinking) {
                const domainClean = customDomain.replace(/https?:\/\//, "").replace(/\/.*$/, "") || "example.com";
                lines.push("    # Prevent Image Hotlinking");
                lines.push("    RewriteCond %{HTTP_REFERER} !^$");
                lines.push(`    RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${domainClean.replace(".", "\\.")} [NC]`);
                if (hotlinkAllowedDomains.trim()) {
                    hotlinkAllowedDomains
                        .split(",")
                        .map((d) => d.trim())
                        .filter(Boolean)
                        .forEach((allowed) => {
                            lines.push(`    RewriteCond %{HTTP_REFERER} !^https?://(www\\.)?${allowed.replace(".", "\\.")} [NC]`);
                        });
                }
                lines.push("    RewriteRule \\.(jpe?g|png|gif|webp|svg|bmp)$ - [NC,F,L]\n");
            }

            // Custom User 301/302 Redirects
            if (customRedirects.length > 0) {
                lines.push("    # Custom Canonical Redirects");
                customRedirects.forEach((r) => {
                    const cleanFrom = r.from.startsWith("/") ? r.from.substring(1) : r.from;
                    lines.push(`    RewriteRule ^${cleanFrom}$ ${r.to} [R=${r.type},L]`);
                });
                lines.push("");
            }

            lines.push("</IfModule>\n");
        }

        lines.push("# ==============================================================================");
        lines.push("# END OF APACHE .HTACCESS CONFIGURATION");
        lines.push("# ==============================================================================");

        return lines.join("\n");
    }, [
        enableRewriteEngine,
        forceHttps,
        wwwPreference,
        customDomain,
        enableHsts,
        hstsMaxAge,
        hstsIncludeSubdomains,
        hstsPreload,
        removeTrailingSlash,
        appendTrailingSlash,
        removePhpExtension,
        removeHtmlExtension,
        enableGzip,
        enableBrotli,
        enableBrowserCaching,
        cacheDurationImages,
        cacheDurationCssJs,
        cacheDurationMedia,
        disableDirectoryListing,
        protectSensitiveFiles,
        preventHotlinking,
        hotlinkAllowedDomains,
        blockSpecificIps,
        blockedIpsList,
        blockBadBots,
        preventClickjacking,
        xContentTypeOptions,
        referrerPolicy,
        custom404,
        custom404Path,
        custom403,
        custom403Path,
        custom500,
        custom500Path,
        customRedirects,
        customHeaders
    ]);

    // Copy to clipboard
    const handleCopy = () => {
        navigator.clipboard.writeText(generatedHtaccess);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Download .htaccess file
    const handleDownload = () => {
        const blob = new Blob([generatedHtaccess], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = ".htaccess";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "HTACCESS Directives & Rewrite Rules Generator",
        "url": "https://twistertools.com/tools/developer-tools/htaccess-generator",
        "description": "Generate production-grade Apache .htaccess configuration files featuring 301 redirects, mod_rewrite rules, HTTPS enforcement, GZIP compression, browser caching, and security headers.",
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
                "name": "What is an Apache .htaccess file and where should it be located?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An .htaccess (Hypertext Access) file is a directory-level configuration file supported by the Apache HTTP Server. It allows webmasters to alter server configurations per directory without editing main Apache configuration files (httpd.conf). It is typically placed in the root directory (public_html, htdocs, or www) of your website."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a 301 and 302 redirect in .htaccess?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A 301 redirect indicates a permanent URL movement, passing 90-99% of search engine ranking equity (PageRank) to the new destination. A 302 redirect is a temporary redirect that instructs crawlers to keep indexing the original URL."
                }
            },
            {
                "@type": "Question",
                "name": "Why is forcing HTTPS and HSTS critical for website security?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Enforcing HTTPS encrypts all plaintext communication between client browsers and the Apache server. HTTP Strict Transport Security (HSTS) prevents SSL-stripping man-in-the-middle attacks by forcing browsers to interact with the domain solely over HTTPS."
                }
            },
            {
                "@type": "Question",
                "name": "How does mod_deflate / GZIP compression improve page speed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The mod_deflate module compresses text-based assets (HTML, CSS, JavaScript, JSON, SVG) on the server before transmitting them across the network, reducing data payload sizes by up to 70% and accelerating page load speeds."
                }
            },
            {
                "@type": "Question",
                "name": "How do mod_expires browser caching directives work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "mod_expires instructs client browsers and CDNs to cache static assets locally for a predetermined period (e.g., 1 year for images, 1 month for CSS/JS). This eliminates redundant server requests on repeat visits."
                }
            },
            {
                "@type": "Question",
                "name": "Why are dotfiles and sensitive configuration files blocked by default?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sensitive files like .env, .git, .htpasswd, and package.json often store database credentials, API secret keys, and source repositories. Blocking access via FilesMatch prevents unauthorized web visitors from viewing private system credentials."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Configuration Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Card Header with Title and Reset Button */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Configuration Options
                            </h2>
                            <button
                                onClick={handleResetAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                title="Reset all fields to defaults"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset All
                            </button>
                        </div>

                        {/* Section Selector Tab Pills */}
                        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {[
                                { id: "presets", label: "Presets", icon: Sliders },
                                { id: "https", label: "HTTPS / Canonical", icon: Globe },
                                { id: "seo", label: "SEO / URLs", icon: Code2 },
                                { id: "caching", label: "GZIP / Cache", icon: Zap },
                                { id: "security", label: "Security / IP", icon: Lock },
                                { id: "errors", label: "Errors", icon: AlertTriangle },
                                { id: "redirects", label: "Redirects", icon: Layers }
                            ].map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeSectionTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveSectionTab(tab.id as typeof activeSectionTab)}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${isActive
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        <IconComponent className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* TAB 1: PRESETS */}
                        {activeSectionTab === "presets" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                    Quick Production Profiles
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset("standard")}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition cursor-pointer space-y-1"
                                    >
                                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                                            <span>Standard Web App</span>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            HTTPS, Non-WWW, GZIP, Cache & Hide .php extension.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset("hardened")}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition cursor-pointer space-y-1"
                                    >
                                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                                            <span>Hardened Security</span>
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            Strict HSTS, Bot Firewall, Hotlink Shield & Anti-Clickjacking.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset("high-performance")}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition cursor-pointer space-y-1"
                                    >
                                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                                            <span>High Speed CDN/Cache</span>
                                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            1-Year Asset Expires, Brotli/GZIP & Strict Headers.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleApplyPreset("spa")}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition cursor-pointer space-y-1"
                                    >
                                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                                            <span>SPA & Static Site</span>
                                            <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-normal">
                                            React/Vue/HTML5 rewrite fallback base configuration.
                                        </p>
                                    </button>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="block text-xs font-bold text-slate-700">Primary Domain Name</label>
                                    <input
                                        type="text"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        placeholder="example.com"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="text-[11px] text-slate-400">Used for canonical redirects and anti-hotlinking rules.</span>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: HTTPS & CANONICAL */}
                        {activeSectionTab === "https" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-4 h-4 text-indigo-600" />
                                    HTTPS & Domain Canonicalization
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={forceHttps}
                                            onChange={(e) => setForceHttps(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Enforce Secure HTTPS (301 Permanent Redirect)</span>
                                            <span className="text-[11px] text-slate-500">Redirects all incoming insecure HTTP requests to HTTPS automatically.</span>
                                        </div>
                                    </label>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="block text-xs font-bold text-slate-900">Canonical WWW Preference</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: "none", label: "No Change" },
                                                { id: "force-non-www", label: "Strip WWW (non-www)" },
                                                { id: "force-www", label: "Force WWW" }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setWwwPreference(opt.id as typeof wwwPreference)}
                                                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${wwwPreference === opt.id
                                                            ? "bg-indigo-600 text-white border-indigo-600"
                                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableHsts}
                                                onChange={(e) => setEnableHsts(e.target.checked)}
                                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Enable HSTS (Strict-Transport-Security)</span>
                                                <span className="text-[11px] text-slate-500">Forces browsers to load website strictly via HTTPS to prevent SSL-stripping.</span>
                                            </div>
                                        </label>

                                        {enableHsts && (
                                            <div className="pl-7 space-y-2 pt-1 border-t border-slate-200">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700">HSTS Max-Age (Seconds)</label>
                                                    <input
                                                        type="number"
                                                        value={hstsMaxAge === 0 ? "" : hstsMaxAge}
                                                        onChange={(e) => handleNumberInput(e, setHstsMaxAge)}
                                                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-4 pt-1">
                                                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={hstsIncludeSubdomains}
                                                            onChange={(e) => setHstsIncludeSubdomains(e.target.checked)}
                                                            className="rounded text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        includeSubDomains
                                                    </label>
                                                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={hstsPreload}
                                                            onChange={(e) => setHstsPreload(e.target.checked)}
                                                            className="rounded text-indigo-600 w-3.5 h-3.5"
                                                        />
                                                        preload (HSTS Preload List)
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: SEO & URLS */}
                        {activeSectionTab === "seo" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Code2 className="w-4 h-4 text-indigo-600" />
                                    SEO & Clean URL Rewrites
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={removePhpExtension}
                                            onChange={(e) => setRemovePhpExtension(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Hide .php Extension in URLs</span>
                                            <span className="text-[11px] text-slate-500">Rewrites `/about.php` to clean `/about` transparently.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={removeHtmlExtension}
                                            onChange={(e) => setRemoveHtmlExtension(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Hide .html Extension in URLs</span>
                                            <span className="text-[11px] text-slate-500">Rewrites `/contact.html` to clean `/contact`.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={removeTrailingSlash}
                                            onChange={(e) => {
                                                setRemoveTrailingSlash(e.target.checked);
                                                if (e.target.checked) setAppendTrailingSlash(false);
                                            }}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Remove Trailing Slash from Files & URLs</span>
                                            <span className="text-[11px] text-slate-500">Redirects `/example/` to `/example` to eliminate duplicate content issues.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={appendTrailingSlash}
                                            onChange={(e) => {
                                                setAppendTrailingSlash(e.target.checked);
                                                if (e.target.checked) setRemoveTrailingSlash(false);
                                            }}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Force Trailing Slash on URLs</span>
                                            <span className="text-[11px] text-slate-500">Redirects `/example` to `/example/` consistently.</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: CACHING & PERFORMANCE */}
                        {activeSectionTab === "caching" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-4 h-4 text-indigo-600" />
                                    GZIP Compression & Browser Caching
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableGzip}
                                            onChange={(e) => setEnableGzip(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Enable GZIP / DEFLATE Compression</span>
                                            <span className="text-[11px] text-slate-500">Compresses HTML, CSS, JS, JSON, XML, and SVG to reduce transfer payload up to 70%.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={enableBrotli}
                                            onChange={(e) => setEnableBrotli(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Enable Brotli Compression (mod_brotli)</span>
                                            <span className="text-[11px] text-slate-500">High-efficiency next-gen compression for modern web servers.</span>
                                        </div>
                                    </label>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enableBrowserCaching}
                                                onChange={(e) => setEnableBrowserCaching(e.target.checked)}
                                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Enable Mod_Expires Browser Caching</span>
                                                <span className="text-[11px] text-slate-500">Instructs browsers to cache static assets locally, accelerating repeat visitor speeds.</span>
                                            </div>
                                        </label>

                                        {enableBrowserCaching && (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7 pt-1 border-t border-slate-200">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Images (WebP/PNG/JPG)</label>
                                                    <select
                                                        value={cacheDurationImages}
                                                        onChange={(e) => setCacheDurationImages(e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                                                    >
                                                        <option value="1 month">1 Month</option>
                                                        <option value="6 months">6 Months</option>
                                                        <option value="1 year">1 Year</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">CSS / JS Scripts</label>
                                                    <select
                                                        value={cacheDurationCssJs}
                                                        onChange={(e) => setCacheDurationCssJs(e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                                                    >
                                                        <option value="1 week">1 Week</option>
                                                        <option value="1 month">1 Month</option>
                                                        <option value="1 year">1 Year</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 uppercase">Video / Audio Media</label>
                                                    <select
                                                        value={cacheDurationMedia}
                                                        onChange={(e) => setCacheDurationMedia(e.target.value)}
                                                        className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                                                    >
                                                        <option value="1 month">1 Month</option>
                                                        <option value="6 months">6 Months</option>
                                                        <option value="1 year">1 Year</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: SECURITY & HARDENING */}
                        {activeSectionTab === "security" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="w-4 h-4 text-indigo-600" />
                                    Server Hardening, Bot Blocker & IP Ban
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={disableDirectoryListing}
                                            onChange={(e) => setDisableDirectoryListing(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Disable Directory Browsing (Options -Indexes)</span>
                                            <span className="text-[11px] text-slate-500">Prevents visitors from viewing directory file structures when no index file exists.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={protectSensitiveFiles}
                                            onChange={(e) => setProtectSensitiveFiles(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Protect Sensitive System Files (.env, .git, .sql, .log)</span>
                                            <span className="text-[11px] text-slate-500">Returns 403 Forbidden on configuration, repository, and credential files.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={blockBadBots}
                                            onChange={(e) => setBlockBadBots(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Block Known Scrapers & Malicious Spiders</span>
                                            <span className="text-[11px] text-slate-500">Blocks libwww-perl, wget, nikto, scrapers, and malicious scanner user agents.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={preventClickjacking}
                                            onChange={(e) => setPreventClickjacking(e.target.checked)}
                                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 block">Prevent Clickjacking (X-Frame-Options: SAMEORIGIN)</span>
                                            <span className="text-[11px] text-slate-500">Prevents external malicious sites from embedding your app inside invisible iframes.</span>
                                        </div>
                                    </label>

                                    {/* IP Blacklist */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={blockSpecificIps}
                                                onChange={(e) => setBlockSpecificIps(e.target.checked)}
                                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <div>
                                                <span className="text-xs font-bold text-slate-900 block">Blacklist Specific IP Addresses</span>
                                                <span className="text-[11px] text-slate-500">Deny all HTTP/HTTPS access to specific malicious IP addresses.</span>
                                            </div>
                                        </label>
                                        {blockSpecificIps && (
                                            <div className="pl-7 pt-1">
                                                <textarea
                                                    rows={3}
                                                    value={blockedIpsList}
                                                    onChange={(e) => setBlockedIpsList(e.target.value)}
                                                    placeholder="Enter 1 IP address per line..."
                                                    className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: CUSTOM ERROR DOCUMENTS */}
                        {activeSectionTab === "errors" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-indigo-600" />
                                    Custom Error Document Handlers
                                </h3>

                                <div className="space-y-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={custom404}
                                                onChange={(e) => setCustom404(e.target.checked)}
                                                className="rounded text-indigo-600 w-4 h-4"
                                            />
                                            404 Not Found Handler
                                        </label>
                                        {custom404 && (
                                            <input
                                                type="text"
                                                value={custom404Path}
                                                onChange={(e) => setCustom404Path(e.target.value)}
                                                placeholder="/404.html"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                            />
                                        )}
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={custom403}
                                                onChange={(e) => setCustom403(e.target.checked)}
                                                className="rounded text-indigo-600 w-4 h-4"
                                            />
                                            403 Forbidden Handler
                                        </label>
                                        {custom403 && (
                                            <input
                                                type="text"
                                                value={custom403Path}
                                                onChange={(e) => setCustom403Path(e.target.value)}
                                                placeholder="/403.html"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                            />
                                        )}
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={custom500}
                                                onChange={(e) => setCustom500(e.target.checked)}
                                                className="rounded text-indigo-600 w-4 h-4"
                                            />
                                            500 Internal Server Error Handler
                                        </label>
                                        {custom500 && (
                                            <input
                                                type="text"
                                                value={custom500Path}
                                                onChange={(e) => setCustom500Path(e.target.value)}
                                                placeholder="/500.html"
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: REDIRECTS BUILDER */}
                        {activeSectionTab === "redirects" && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Custom URL Redirects Manager
                                </h3>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                        <input
                                            type="text"
                                            value={newRedirectFrom}
                                            onChange={(e) => setNewRedirectFrom(e.target.value)}
                                            placeholder="/old-url"
                                            className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={newRedirectTo}
                                            onChange={(e) => setNewRedirectTo(e.target.value)}
                                            placeholder="/new-destination"
                                            className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white"
                                        />
                                        <select
                                            value={newRedirectType}
                                            onChange={(e) => setNewRedirectType(e.target.value as "301" | "302")}
                                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-semibold"
                                        >
                                            <option value="301">301 Perm</option>
                                            <option value="302">302 Temp</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddRedirect}
                                        className="w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                                    >
                                        + Add Redirect Rule
                                    </button>
                                </div>

                                {customRedirects.length > 0 && (
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                        {customRedirects.map((rule) => (
                                            <div key={rule.id} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs font-mono">
                                                <div className="truncate mr-2">
                                                    <span className="font-bold text-indigo-600 mr-2">[{rule.type}]</span>
                                                    <span className="text-slate-800">{rule.from}</span>
                                                    <span className="text-slate-400 mx-1.5">→</span>
                                                    <span className="text-emerald-700">{rule.to}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveRedirect(rule.id)}
                                                    className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer px-1.5"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Apache 2.4+ Ready Directives
                        </span>
                        <span>Client-Side Local Generator</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Code Output & Inspection */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Server className="w-5 h-5 text-indigo-600" />
                                Generated .htaccess Output
                            </h2>
                            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                                Apache Directives
                            </span>
                        </div>

                        {/* Raw Code Display Box */}
                        <div className="relative">
                            <pre className="w-full h-[460px] p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-y-auto leading-relaxed border border-slate-800 selection:bg-indigo-700 selection:text-white">
                                <code>{generatedHtaccess}</code>
                            </pre>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy .htaccess"}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Download File
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architecture of Apache .htaccess */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Apache .htaccess Architecture & Directory Directives
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An <strong>.htaccess</strong> (Hypertext Access) file is an Apache Web Server directory-level configuration file. It empowers site administrators to execute decentralized server configurations, granular URL rewrites, browser cache lifetimes, and robust access controls without requiring direct access to the global server configuration file (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">httpd.conf</code>).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> Execution Precedence & Scope
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When a client requests a URL, Apache traverses from the server root down through every subdirectory to evaluate active <code className="bg-slate-200 px-1 rounded text-xs">.htaccess</code> files. Directives in subfolders override inherited rules from parent folders.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Lock className="w-4 h-4 text-indigo-600" /> Mod_Rewrite Engine Pipeline
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The <code className="bg-slate-200 px-1 rounded text-xs">mod_rewrite</code> module executes regular expression matching against incoming server variables (<code className="bg-slate-200 px-1 rounded text-xs">%&#123;HTTP_HOST&#125;</code>, <code className="bg-slate-200 px-1 rounded text-xs">%&#123;REQUEST_URI&#125;</code>) to perform URL canonicalization and redirects seamlessly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Essential Rewrite Rules Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Essential Apache Mod_Rewrite Flags & Status Codes
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Apache RewriteRules utilize flags enclosed in square brackets at the end of each directive. Understanding these flags ensures predictable routing behavior:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Rewrite Flag</th>
                                    <th className="p-3">Technical Description</th>
                                    <th className="p-3">Practical Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">[R=301,L]</td>
                                    <td className="p-3">Permanent HTTP 301 Redirect; halts processing further rules.</td>
                                    <td className="p-3 text-slate-600">Enforcing HTTPS, moving URLs, and canonical domain forwarding.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">[R=302,L]</td>
                                    <td className="p-3">Temporary HTTP 302 Redirect; prevents search engines from indexing target permanently.</td>
                                    <td className="p-3 text-slate-600">Maintenance windows, staging redirects, and short-term promotions.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">[NC]</td>
                                    <td className="p-3">No Case; performs case-insensitive regex matching.</td>
                                    <td className="p-3 text-slate-600">Matching domain names or varied user agent strings regardless of capitalization.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">[F,L]</td>
                                    <td className="p-3">Forbidden (HTTP 403); halts rule execution and denies access.</td>
                                    <td className="p-3 text-slate-600">Blocking scrapers, aggressive spiders, and hotlinking requests.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">[QSA]</td>
                                    <td className="p-3">Query String Append; preserves existing URL query parameters during rewrites.</td>
                                    <td className="p-3 text-slate-600">Clean routing where query arguments like `?ref=google` must persist.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Security Hardening & Defenses */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Security Hardening & Threat Mitigation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A robust <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">.htaccess</code> acts as a first line of defense before incoming HTTP requests touch application code or databases:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Dotfile & Credential Protection</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Denies access to sensitive development artifacts including <code className="bg-slate-200 px-1 rounded">.env</code>, <code className="bg-slate-200 px-1 rounded">.git</code>, database dumps, and server backups.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Strict Security Headers</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Employs <code className="bg-slate-200 px-1 rounded">X-Frame-Options: SAMEORIGIN</code> and <code className="bg-slate-200 px-1 rounded">X-Content-Type-Options: nosniff</code> to prevent clickjacking and MIME-type sniffing attacks.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Bot & Scraper Filtration</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Intercepts known scanning tools and scrapers (e.g., Nikto, Wget, automated extractors) before they can consume CPU bandwidth.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is an Apache .htaccess file and where should it be located?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An .htaccess (Hypertext Access) file is a directory-level configuration file supported by the Apache HTTP Server. It allows webmasters to alter server configurations per directory without editing main Apache configuration files (httpd.conf). It is typically placed in the root directory (public_html, htdocs, or www) of your website.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a 301 and 302 redirect in .htaccess?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A 301 redirect indicates a permanent URL movement, passing 90-99% of search engine ranking equity (PageRank) to the new destination. A 302 redirect is a temporary redirect that instructs crawlers to keep indexing the original URL.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is forcing HTTPS and HSTS critical for website security?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Enforcing HTTPS encrypts all plaintext communication between client browsers and the Apache server. HTTP Strict Transport Security (HSTS) prevents SSL-stripping man-in-the-middle attacks by forcing browsers to interact with the domain solely over HTTPS.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does mod_deflate / GZIP compression improve page speed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The mod_deflate module compresses text-based assets (HTML, CSS, JavaScript, JSON, SVG) on the server before transmitting them across the network, reducing data payload sizes by up to 70% and accelerating page load speeds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do mod_expires browser caching directives work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                mod_expires instructs client browsers and CDNs to cache static assets locally for a predetermined period (e.g., 1 year for images, 1 month for CSS/JS). This eliminates redundant server requests on repeat visits.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are dotfiles and sensitive configuration files blocked by default?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sensitive files like .env, .git, .htpasswd, and package.json often store database credentials, API secret keys, and source repositories. Blocking access via FilesMatch prevents unauthorized web visitors from viewing private system credentials.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}