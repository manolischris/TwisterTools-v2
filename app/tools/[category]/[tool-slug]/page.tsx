import fs from "fs";
import path from "path";
import Link from "next/link";
import { redirect, permanentRedirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { QrCode, Hash, Info, HelpCircle, Lock, ShieldAlert, CalendarClock, Percent, Calculator, Type, ListStart, Binary, Globe, Globe2, FileJson, Code, FileCode, Clock, ArrowRightLeft, Database, SearchCode, Columns, FileText, Minimize2, Share2, MapPin, ShieldCheck, Server, Layers, RefreshCw, Palette, CreditCard, FileImage, Workflow, Fingerprint, Baby, Dices, Pipette, Sliders, Shapes, Layout, LayoutGrid, Table, Terminal, Keyboard, Shield } from "lucide-react";
import urlMap from "../../../../url-map.json";
import toolsRegistry from "../../../../lib/tools-registry.json";
const QrCodeGenerator = dynamic(() => import("../../../../components/tools/QrCodeGenerator"));
const Md5Generator = dynamic(() => import("../../../../components/tools/Md5Generator"));
const PasswordGenerator = dynamic(() => import("../../../../components/tools/PasswordGenerator"));
const PasswordStrengthChecker = dynamic(() => import("../../../../components/tools/PasswordStrengthChecker"));
const AgeCalculator = dynamic(() => import("../../../../components/tools/AgeCalculator"));
const PercentageCalculator = dynamic(() => import("../../../../components/tools/PercentageCalculator"));
const AverageCalculator = dynamic(() => import("../../../../components/tools/AverageCalculator"));
const CaseConverter = dynamic(() => import("../../../../components/tools/CaseConverter"));
const CommaSeparator = dynamic(() => import("../../../../components/tools/CommaSeparator"));
const BinaryConverter = dynamic(() => import("../../../../components/tools/BinaryConverter"));
const Base64Converter = dynamic(() => import("../../../../components/tools/Base64Converter"));
const UrlEncoderDecoder = dynamic(() => import("../../../../components/tools/UrlEncoderDecoder"));
const HtmlEncoderDecoder = dynamic(() => import("../../../../components/tools/HtmlEncoderDecoder"));
const JsonFormatterValidator = dynamic(() => import("../../../../components/tools/JsonFormatterValidator"));
const XmlFormatterValidator = dynamic(() => import("../../../../components/tools/XmlFormatterValidator"));
const JwtDecoder = dynamic(() => import("../../../../components/tools/JwtDecoder"));
const UuidGenerator = dynamic(() => import("../../../../components/tools/UuidGenerator"));
const StringHexConverter = dynamic(() => import("../../../../components/tools/StringHexConverter"));
const UnixTimestampConverter = dynamic(() => import("../../../../components/tools/UnixTimestampConverter"));
const ShaGenerator = dynamic(() => import("../../../../components/tools/ShaGenerator"));
const CronExpressionGenerator = dynamic(() => import("../../../../components/tools/CronExpressionGenerator"));
const ReverseTextGenerator = dynamic(() => import("../../../../components/tools/ReverseTextGenerator"));
const SqlFormatter = dynamic(() => import("../../../../components/tools/SqlFormatter"));
const RegexTester = dynamic(() => import("../../../../components/tools/RegexTester"));
const DiffChecker = dynamic(() => import("../../../../components/tools/DiffChecker"));
const MarkdownToHtmlConverter = dynamic(() => import("../../../../components/tools/MarkdownToHtmlConverter"));
const HtmlFormatter = dynamic(() => import("../../../../components/tools/HtmlFormatter"));
const CssFormatter = dynamic(() => import("../../../../components/tools/CssFormatter"));
const JavaScriptFormatter = dynamic(() => import("../../../../components/tools/JavaScriptFormatter"));
const JsonCsvConverter = dynamic(() => import("../../../../components/tools/JsonCsvConverter"));
const HtmlToMarkdown = dynamic(() => import("../../../../components/tools/HtmlToMarkdown"));
const HtmlCssMinifier = dynamic(() => import("../../../../components/tools/HtmlCssMinifier"));
const YamlJsonConverter = dynamic(() => import("../../../../components/tools/YamlJsonConverter"));
const MetaTagGenerator = dynamic(() => import("../../../../components/tools/MetaTagGenerator"));
const OpenGraphGenerator = dynamic(() => import("../../../../components/tools/OpenGraphGenerator"));
const DomainAgeChecker = dynamic(() => import("../../../../components/tools/DomainAgeChecker"));
const DomainToIpConverter = dynamic(() => import("../../../../components/tools/DomainToIpConverter"));
const IpLocation = dynamic(() => import("../../../../components/tools/IpLocation"));
const FindDnsRecord = dynamic(() => import("../../../../components/tools/FindDnsRecord"));
const SslChecker = dynamic(() => import("../../../../components/tools/SslChecker"));
const HttpHeadersInspector = dynamic(() => import("../../../../components/tools/HttpHeadersInspector"));
const SitemapGenerator = dynamic(() => import("../../../../components/tools/SitemapGenerator"));
const WordCombiner = dynamic(() => import("../../../../components/tools/WordCombiner"));
const SmallTextGenerator = dynamic(() => import("../../../../components/tools/SmallTextGenerator"));
const ArticleRewriter = dynamic(() => import("../../../../components/tools/ArticleRewriter"));
const OnlineTextEditor = dynamic(() => import("../../../../components/tools/OnlineTextEditor"));
const RgbToHex = dynamic(() => import("../../../../components/tools/RgbToHex"));
const CreditCardGenerator = dynamic(() => import("../../../../components/tools/CreditCardGenerator"));
const PngToJpgConverter = dynamic(() => import("../../../../components/tools/PngToJpgConverter"));
const FaviconGeneratorSuite = dynamic(() => import("../../../../components/tools/FaviconGeneratorSuite"));
const ImageCompressor = dynamic(() => import("../../../../components/tools/ImageCompressor"));
const SvgConverter = dynamic(() => import("../../../../components/tools/SvgConverter"));
const HeicToJpgConverter = dynamic(() => import("../../../../components/tools/HeicToJpgConverter"));
const PdfCompressorSuite = dynamic(() => import("../../../../components/tools/PdfCompressorSuite"));
const ExtractPdfImages = dynamic(() => import("@/components/tools/ExtractPdfImages"));
const PregnancyDueDateCalculator = dynamic(() => import("@/components/tools/PregnancyDueDateCalculator"));
const ScientificCalculator = dynamic(() => import("@/components/tools/ScientificCalculator"));
const LoremIpsumGenerator = dynamic(() => import("@/components/tools/LoremIpsumGenerator"));
const TimezoneConverter = dynamic(() => import("@/components/tools/TimezoneConverter"));
const DiceRoller = dynamic(() => import("@/components/tools/DiceRoller"));
const RandomAddressGenerator = dynamic(() => import("@/components/tools/RandomAddressGenerator"));
const RandomCountryPicker = dynamic(() => import("@/components/tools/RandomCountryPicker"));
const CssBoxShadowGenerator = dynamic(() => import("@/components/tools/CssBoxShadowGenerator"));
const CssBorderRadiusGenerator = dynamic(() => import("@/components/tools/CssBorderRadiusGenerator"));
const CssFlexboxPlayground = dynamic(() => import("@/components/tools/CssFlexboxPlayground"));
const CssGridGenerator = dynamic(() => import("@/components/tools/CssGridGenerator"));
const HtmlTableGenerator = dynamic(() => import("../../../../components/tools/HtmlTableGenerator"));
import CopyLinkButton from "../../../../components/CopyLinkButton";
import RelatedTools from "../../../../components/RelatedTools";

const TextToPdfConverter = dynamic(() => import("@/components/tools/TextToPdfConverter"));
const ColorPickerContrastChecker = dynamic(() => import("@/components/tools/ColorPickerContrastChecker"));
const UserAgentParser = dynamic(() => import("@/components/tools/UserAgentParser"));
const KeycodeInspector = dynamic(() => import("@/components/tools/KeycodeInspector"));
const ChmodCalculator = dynamic(() => import("@/components/tools/ChmodCalculator"));

// Type definitions for URL mapping
interface Tool {
  id: number;
  name: string;
  legacy_url: string;
  new_url: string;
  new_category: string;
  description: string;
}

// List of custom completed tools that have their own custom interfaces and content sections
const COMPLETED_TOOLS = [
  "qr-code-generator",
  "md5-generator",
  "sha-generator",
  "password-generator",
  "password-strength-checker",
  "age-calculator",
  "percentage-calculator",
  "average-calculator",
  "case-converter",
  "comma-separator",
  "text-to-binary",
  "binary-to-text",
  "binary-to-hex",
  "hex-to-binary",
  "binary-to-ascii",
  "ascii-to-binary",
  "binary-to-decimal",
  "decimal-to-binary",
  "text-to-ascii",
  "decimal-to-hex",
  "base64-encode-decode",
  "url-encoder-decoder",
  "html-entity-encoder-decoder",
  "json-formatter-validator",
  "xml-formatter-validator",
  "jwt-decoder",
  "uuid-generator",
  "string-to-hex",
  "hex-to-string",
  "unix-timestamp-converter",
  "cron-expression-generator",
  "reverse-text-generator",
  "sql-formatter-validator",
  "regex-tester",
  "diff-checker",
  "markdown-to-html",
  "html-formatter-validator",
  "css-formatter-validator",
  "javascript-formatter-minifier",
  "json-to-csv-converter",
  "html-to-markdown",
  "html-css-minifier-unminifier",
  "yaml-to-json-converter",
  "meta-tag-generator",
  "open-graph-generator",
  "domain-age-checker",
  "domain-to-ip",
  "ip-location",
  "find-dns-record",
  "ssl-checker",
  "http-headers",
  "sitemap-generator",
  "word-combiner",
  "small-text-generator",
  "rewrite-article",
  "online-text-editor",
  "rgb-to-hex",
  "credit-card-generator",
  "png-to-jpg",
  "image-compressor",
  "favicon-generator",
  "svg-converter",
  "heic-to-jpg",
  "compress-pdf",
  "text-to-pdf",
  "extract-pdf-images",
  "pregnancy-due-date-calculator",
  "scientific-calculator",
  "timezone-converter",
  "dice-roller",
  "random-address-generator",
  "random-country-picker",
  "css-box-shadow-generator",
  "css-border-radius-generator",
  "css-flexbox-playground",
  "css-grid-generator",
  "html-table-generator",
  "user-agent-parser",
  "javascript-keycode-finder",
  "chmod-calculator",
];

function handleConsolidationRedirects(category: string, toolSlug: string) {
  // Consolidate the 10 binary conversion pages to the unified binary-converter path
  const binaryLegacySlugs = [
    "text-to-binary",
    "binary-to-text",
    "binary-to-hex",
    "hex-to-binary",
    "binary-to-ascii",
    "ascii-to-binary",
    "binary-to-decimal",
    "decimal-to-binary",
    "text-to-ascii",
    "decimal-to-hex",
  ];
  if (category === "converter-tools" && binaryLegacySlugs.includes(toolSlug)) {
    permanentRedirect("/tools/converter-tools/binary-converter");
  }

  // Redirect legacy HTML/CSS minifier slugs to the unified html-css-minifier-unminifier
  const htmlCssLegacySlugs = ["html-minifier", "css-minifier"];
  if (category === "developer-tools" && htmlCssLegacySlugs.includes(toolSlug)) {
    permanentRedirect("/tools/developer-tools/html-css-minifier-unminifier");
  }

  // Redirect legacy url-encode-decode slug to modern url-encoder-decoder
  if (category === "developer-tools" && toolSlug === "url-encode-decode") {
    permanentRedirect("/tools/developer-tools/url-encoder-decoder");
  }

  // Redirect legacy JSON formatting/validation slugs to the unified json-formatter-validator path
  const jsonLegacySlugs = [
    "json-formatter",
    "json-validator",
    "json-beautifier",
    "json-viewer",
    "json-editor",
  ];
  if (category === "developer-tools" && jsonLegacySlugs.includes(toolSlug)) {
    permanentRedirect("/tools/developer-tools/json-formatter-validator");
  }

  // Redirect legacy XML formatting/validation slugs to the unified xml-formatter-validator path
  const xmlLegacySlugs = [
    "xml-formatter",
    "xml-validator",
    "xml-beautifier",
    "xml-viewer",
  ];
  if (category === "developer-tools" && xmlLegacySlugs.includes(toolSlug)) {
    permanentRedirect("/tools/developer-tools/xml-formatter-validator");
  }

  // Redirect unit converter slugs to the unified master-unit-converter
  const unitConverterSlugs = [
    "temperature-converter",
    "weight-converter",
    "length-converter",
    "area-converter",
    "volume-converter",
  ];
  if (category === "calculators" && unitConverterSlugs.includes(toolSlug)) {
    permanentRedirect("/tools/calculators/master-unit-converter");
  }
}

// Generate metadata for SEO optimization
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; "tool-slug": string }>;
}) {
  const { category, "tool-slug": toolSlug } = await params;

  // 1. Check consolidation redirects first
  handleConsolidationRedirects(category, toolSlug);

  // 2. Check if the tool is actively implemented
  const isActive = toolsRegistry.some((t) => t.id === toolSlug);
  if (!isActive) {
    permanentRedirect(`/tools/${category}`);
  }

  // Find the matching tool by checking registry first, then fallback to url-map
  const regTool = toolsRegistry.find((t) => t.id === toolSlug);
  let tool = regTool
    ? {
        id: regTool.id as any,
        name: regTool.title,
        legacy_url: "",
        new_url: regTool.href,
        new_category: regTool.category,
        description: regTool.description,
      }
    : urlMap.tools.find(
        (t: Tool) =>
          t.new_category === category &&
          t.new_url === `/tools/${category}/${toolSlug}`
      );

  if (category === "pdf-tools" && toolSlug === "extract-pdf-images") {
    tool = {
      id: 999,
      name: "Extract Images from PDF & Asset Extractor",
      legacy_url: "/extract-pdf-images",
      new_url: "/tools/pdf-tools/extract-pdf-images",
      new_category: "pdf-tools",
      description: "Isolate and download high-resolution embedded graphics and photos from any PDF locally."
    };
  }

  if (!tool) {
    permanentRedirect(`/tools/${category}`);
  }

  const toolUrl = `https://www.twistertools.com${tool.new_url}`;
  const toolName = tool.name;

  // Prefer .webp featured images, then fallback to .jpg, then default OG image.
  const imageBasePath = path.join(process.cwd(), "public", "images", "tools", category, toolSlug);
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? `https://www.twistertools.com/images/tools/${category}/${toolSlug}.webp`
    : fs.existsSync(jpgPath)
      ? `https://www.twistertools.com/images/tools/${category}/${toolSlug}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  let title = `${tool.name}`;
  let description = tool.description;

  if (category === "developer-tools" && toolSlug === "css-flexbox-playground") {
    description = "Interactive visual CSS Flexbox playground. Test alignment, direction, order, and grow/shrink dynamics with instant CSS and Tailwind code generation.";
  }

  if (category === "developer-tools" && toolSlug === "html-table-generator") {
    description = "Design, customize, and generate semantic HTML5 tables, Tailwind CSS classes, React TSX, Markdown, and CSS stylesheets with live preview and CSV import.";
  }

  if (category === "developer-tools" && toolSlug === "chmod-calculator") {
    description = "Calculate Linux and Unix file permissions visually with instant octal, symbolic, and binary conversion, SetUID/SetGID/Sticky bit modifiers, and production-ready CLI command generation.";
  }

  if (category === "pdf-tools" && toolSlug === "text-to-pdf") {
    title = "Text to PDF Converter | Free Client-Side Tool";
    description = "Convert plain text content into formatted, paginated PDF documents directly in browser memory.";
  }

  if (category === "text-tools" && toolSlug === "lorem-ipsum-generator") {
    title = "Lorem Ipsum Generator - Free Placeholder Text Utility";
  }

  return {
    title,
    description,
    keywords: [tool.name, category, "online tool", "free tool", "twistertools"],
    openGraph: {
      title:
        (category === "pdf-tools" && toolSlug === "text-to-pdf") ||
        (category === "text-tools" && toolSlug === "lorem-ipsum-generator")
          ? title
          : `${tool.name} | TwisterTools`,
      description,
      url: toolUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${toolName} on TwisterTools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title:
        (category === "pdf-tools" && toolSlug === "text-to-pdf") ||
        (category === "text-tools" && toolSlug === "lorem-ipsum-generator")
          ? title
          : `${tool.name} | TwisterTools`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: toolUrl,
    },
  };
}

// Static generation: Pre-render only active, non-static tool pages at build time
export async function generateStaticParams() {
  const params: { category: string; "tool-slug": string }[] = [];

  for (const tool of toolsRegistry) {
    const pathParts = tool.href.split("/");
    // pathParts format: ["", "tools", category, tool-slug]
    if (pathParts.length >= 4 && pathParts[1] === "tools") {
      const category = pathParts[2];
      const toolSlug = pathParts[3];

      // Exclude tools that have their own static folder page implementation
      const staticFolderPath = path.join(process.cwd(), "app", "tools", category, toolSlug);
      if (!fs.existsSync(staticFolderPath)) {
        params.push({
          category,
          "tool-slug": toolSlug,
        });
      }
    }
  }

  return params;
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ category: string; "tool-slug": string }>;
}) {
  const { category, "tool-slug": toolSlug } = await params;

  // 1. Check consolidation redirects first
  handleConsolidationRedirects(category, toolSlug);

  // 2. Check if the tool is actively implemented
  const isActive = toolsRegistry.some((t) => t.id === toolSlug);
  if (!isActive) {
    permanentRedirect(`/tools/${category}`);
  }

  // Find the matching tool by checking registry first, then fallback to url-map
  const regTool = toolsRegistry.find((t) => t.id === toolSlug);
  let tool = regTool
    ? {
        id: regTool.id as any,
        name: regTool.title,
        legacy_url: "",
        new_url: regTool.href,
        new_category: regTool.category,
        description: regTool.description,
      }
    : urlMap.tools.find(
        (t: Tool) =>
          t.new_category === category &&
          t.new_url === `/tools/${category}/${toolSlug}`
      );

  if (category === "pdf-tools" && toolSlug === "extract-pdf-images") {
    tool = {
      id: 999,
      name: "Extract Images from PDF & Asset Extractor",
      legacy_url: "/extract-pdf-images",
      new_url: "/tools/pdf-tools/extract-pdf-images",
      new_category: "pdf-tools",
      description: "Isolate and download high-resolution embedded graphics and photos from any PDF locally."
    };
  }

  // Fallback if still not found
  if (!tool) {
    permanentRedirect(`/tools/${category}`);
  }

  if (category === "developer-tools" && toolSlug === "css-flexbox-playground") {
    tool.description = "Interactive visual CSS Flexbox playground. Test alignment, direction, order, and grow/shrink dynamics with instant CSS and Tailwind code generation.";
  }

  if (category === "developer-tools" && toolSlug === "chmod-calculator") {
    tool.description = "Calculate Linux and Unix file permissions visually with instant octal, symbolic, and binary conversion, SetUID/SetGID/Sticky bit modifiers, and production-ready CLI command generation.";
  }

  // Get category display name matching blueprint's modern taxonomies exactly
  const categoryDisplayNames: Record<string, string> = {
    "text-tools": "Text Analysis, List Comparison & Editing Tools",
    "converter-tools": "Data & Number Base Converter Utilities",
    "web-tools": "SEO, Domain & Network Inspector Tools",
    "generator-tools": "Random Data, Identity & Key Generators",
    "developer-tools": "Developer, Code & Web Engineering Tools",
    "password-tools": "Password Management & Security Utilities",
    "calculators": "Daily Essentials, Financial & Math Calculators",
    "image-tools": "Image Editing, Compression & Conversion Tools",
    "pdf-tools": "PDF & Document Utilities",
  };

  const categoryName =
    categoryDisplayNames[category] ||
    urlMap.modern_categories[
    category as keyof typeof urlMap.modern_categories
    ] ||
    category;

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data for QR Code Generator */}
      {category === "generator-tools" && toolSlug === "qr-code-generator" && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What's the difference between static and dynamic QR codes?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Static QR codes permanently encode data within the code itself and cannot be changed after generation. They work forever without requiring any service, never expire, have no tracking concerns, and function completely offline. Dynamic QR codes contain a short URL that redirects to changeable content, requiring ongoing service fees and introducing tracking mechanisms. Static codes are superior for permanent, reliable, and privacy-respecting applications.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Do QR codes generated by your tool expire or have usage limits?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. QR codes created with our generator are 100% free, permanent, and have no restrictions whatsoever. There are no expiration dates, no scan limits, no hidden fees, and no service dependencies. Once downloaded, your QR code is yours forever and will function indefinitely as long as the destination remains active.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "What's the maximum scanning distance for QR codes?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "The general rule is that scanning distance is approximately 10 times the QR code width. A 4-inch QR code can typically be scanned from about 40 inches away. Factors affecting distance include camera quality, lighting conditions, color contrast, data complexity, and error correction level. For optimal scannability, ensure codes are at least 2x2 inches for close-range scanning.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Can I change the destination URL after generating a QR code?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Static QR codes permanently encode the URL and cannot be changed after generation. However, you can use a URL shortener service (like Bitly) when creating your QR code. Point the QR code to the shortened link, then change where that short link redirects in the shortener's dashboard. This provides dynamic functionality while using free, static QR codes.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Why won't my QR code scan properly?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Common issues include insufficient contrast, size too small (minimum 2x2cm), poor print quality, logo too large (max 25% of code area), curved surfaces, damage or dirt, incorrect error correction level, reflective materials, low lighting, or too much data. To fix: test with multiple devices, ensure adequate lighting, use higher error correction, increase physical size, improve print quality, and ensure flat, matte surfaces.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Are QR codes safe? Can they contain viruses or malware?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "QR codes themselves are completely safe and cannot contain executable code, viruses, or malware. They are simply encoded data like text or URLs. However, the destination could potentially be malicious. Best practices: verify the source before scanning, use QR readers that preview URLs first, look for HTTPS, be cautious of unexpected codes, and treat scanning a QR code like clicking a link.",
                    },
                  },
                ],
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "QR Code Generator",
                description:
                  "Free online QR code generator with advanced customization options including logo overlay, color selection, error correction levels, and multiple templates for URLs, WiFi, email, and WhatsApp. Create professional, permanent QR codes instantly.",
                url: "https://www.twistertools.com/tools/generator-tools/qr-code-generator",
                applicationCategory: "UtilityApplication",
                operatingSystem: "Any",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                featureList: [
                  "Unlimited free QR code generation",
                  "Custom logo overlay support",
                  "Full color customization",
                  "Multiple templates (URL, WiFi, Email, WhatsApp)",
                  "Adjustable error correction levels",
                  "High-resolution PNG and SVG export",
                  "No expiration or usage limits",
                  "Privacy-focused browser-based processing",
                  "No registration required",
                ],
                browserRequirements: "Requires JavaScript",
                author: {
                  "@type": "Organization",
                  name: "TwisterTools",
                  url: "https://www.twistertools.com",
                },
              }),
            }}
          />
        </>
      )}

      {category === "developer-tools" && toolSlug === "sha-generator" && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What is the structural difference between SHA-2 and SHA-3?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "SHA-2 is built on the classic Merkle-Damgård construction framework, which functions by processing sequential blocks. Because of this structural alignment, it is theoretically vulnerable to length-extension vector attacks if not protected by a keyed HMAC layer. SHA-3, conversely, leverages the modern Keccak permutation sponge construction, allowing data to be dynamically absorbed into internal state channels before being squeezed out as a digest, making it inherently immune to length-extension exploits.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Can SHA hashes be safely used for user password hashing databases?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. Raw SHA functions are designed to operate at maximum hardware efficiency to process massive datasets rapidly. This design makes them highly susceptible to optimized GPU-driven brute-force attacks or pre-computed Rainbow Table mapping attempts. Password storage architectures should instead employ specialized key-stretching functions like Argon2id, bcrypt, or PBKDF2, which integrate configurable work factors and localized salt handling to slow down brute-force hardware clusters.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does generating a hash stream send any data back to your servers?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Absolutely not. This platform functions entirely as a secure, client-side utility runtime. All cryptographic logic, block processing loop hooks, and hexadecimal translations are executed natively within your browser's sandboxed environment via Web Crypto primitives and Javascript. Your string data, intellectual properties, and local file elements never touch an external server or telemetry channel.",
                    },
                  },
                ],
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "SHA Hash Generator & Checksum Tool Suite",
                description:
                  "Generate SHA-1, SHA-256, SHA-512, and SHA-3 checksums locally and securely in your browser. Perform text, bulk, and file-based cryptographic digests with verification alerts.",
                url: "https://www.twistertools.com/tools/developer-tools/sha-generator",
                applicationCategory: "UtilityApplication",
                operatingSystem: "Any",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                },
                featureList: [
                  "100% client-side cryptographic hashing via Web Crypto API",
                  "Hardware-accelerated standard SHA-1, SHA-256, SHA-512",
                  "Standard-compliant BigInt-based SHA-3-256 and SHA-3-512 sponge algorithms",
                  "Single text input hashing with character, word, and byte-length statistics",
                  "Bulk list hashing with quick copy exportable grids",
                  "Drag-and-drop file hashing up to 100MB using progress bar streaming",
                  "Checksum Verification Shield comparing target digests with matching indicators",
                  "Local processing guaranteeing privacy",
                ],
                browserRequirements: "Requires JavaScript",
                author: {
                  "@type": "Organization",
                  name: "TwisterTools",
                  url: "https://www.twistertools.com",
                },
              }),
            }}
          />
        </>
      )}

      {category === "developer-tools" && toolSlug === "cron-expression-generator" && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Are six-field cron strings (including seconds or years) supported in standard Unix infrastructure?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Standard Linux/Unix systems rely exclusively on the classic five-field layout. Six-field strings containing explicit seconds or years are typical in specific frameworks like Quartz Scheduler or AWS CloudWatch Events."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "How does the cron scheduler handle daylight saving time (DST) transitions?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Jobs scheduled during the fallback or spring-forward hours may run twice or skip entirely depending on server operating system configurations. Best practices dictate running critical production systems exclusively on Coordinated Universal Time (UTC)."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "What is the difference between */5 and 0/5 in cron intervals?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "In standard parsers, both notations evaluate identically, dictating that execution occurs at every interval divisible by five starting from the base index of zero."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "Is it secure to parse and construct execution schedules entirely in the browser client?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Absolutely. TwisterTools executes all token loops, translations, and milestone prediction dates purely in client-side memory. Zero parameters, inputs, or execution maps are sent over the network, ensuring complete, ironclad data privacy."
                    }
                  }
                ]
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Cron Expression Generator & Explainer",
                description: "Free online Cron Expression Generator & Explainer. Build, test, validate, and parse cron expressions with instant natural language English explanations and future execution dates projection.",
                url: "https://www.twistertools.com/tools/developer-tools/cron-expression-generator",
                applicationCategory: "DeveloperApplication",
                operatingSystem: "All",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD"
                },
                featureList: [
                  "Interactive standard fields and step-by-step configurator",
                  "Every X unit step generators, specific values grid toggles, and range selectors",
                  "Instant human-readable English sentence explanation of any 5-field cron string",
                  "Projection of next 5 scheduled execution dates relative to current local time",
                  "Quick presets grid for common scheduling patterns (minutely, hourly, daily, etc.)",
                  "100% client-side privacy-first execution with zero data transit"
                ],
                browserRequirements: "Requires JavaScript",
                author: {
                  "@type": "Organization",
                  name: "TwisterTools",
                  url: "https://www.twistertools.com"
                }
              }),
            }}
          />
        </>
      )}

      {/* JSON-LD Structured Data for HTML to Markdown Converter */}
      {category === "developer-tools" && toolSlug === "html-to-markdown" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "HTML to Markdown & Markdown to HTML Converter",
              description:
                "Free online bi-directional HTML to Markdown and Markdown to HTML converter. Pure TypeScript DOMParser and regex-based conversion engines with real-time preview, dual-view output, and comprehensive metrics.",
              url: "https://www.twistertools.com/tools/developer-tools/html-to-markdown",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "All",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Bi-directional HTML to Markdown and Markdown to HTML conversion",
                "DOMParser-based DOM tree serialization for HTML-to-Markdown",
                "Multi-pass regex tokenization for Markdown-to-HTML compilation",
                "Real-time reactive conversion on every keystroke",
                "Dual-view output: Converted Output and Live Preview tabs",
                "Performance metrics: Input Size, Output Size, Character/Word count, Conversion Efficiency Ratio",
                "Error guardrails with soft-red warning banner for malformed input",
                "Load Sample Data and Clear Workspace controls",
                "Full-width Copy Converted Output button with 2-second success feedback",
                "100% client-side execution with zero server transmission",
                "Zero external npm dependencies — pure TypeScript implementation",
              ],
              browserRequirements: "Requires JavaScript",
              author: {
                "@type": "Organization",
                name: "TwisterTools",
                url: "https://www.twistertools.com",
              },
            }),
          }}
        />
      )}

      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 md:py-3">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1.5 flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
                Home
              </Link>
              <span>/</span>
              <Link
                href={`/tools/${category}`}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
              >
                {categoryName}
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">{tool.name}</span>
            </div>

            {/* Tool Title & Description */}
            <div className="flex items-center gap-3">
              {/* Strict square icon container — 1:1, aligned using self-stretch items-center justify-center */}
              <div className="w-14 h-14 rounded-2xl flex self-stretch items-center justify-center flex-shrink-0 bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                {toolSlug === "md5-generator" || toolSlug === "sha-generator" ? (
                  <Hash className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "password-generator" ? (
                  <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "password-strength-checker" ? (
                  <ShieldAlert className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "age-calculator" ? (
                  <CalendarClock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "percentage-calculator" ? (
                  <Percent className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "average-calculator" ? (
                  <Calculator className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "case-converter" ? (
                  <Type className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "comma-separator" ? (
                  <ListStart className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "base64-encode-decode" ? (
                  <Binary className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "url-encoder-decoder" ? (
                  <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "html-entity-encoder-decoder" ? (
                  <Code className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "json-formatter-validator" ? (
                  <FileJson className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "xml-formatter-validator" ? (
                  <FileCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "jwt-decoder" ? (
                  <ShieldAlert className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "unix-timestamp-converter" || toolSlug === "cron-expression-generator" ? (
                  <Clock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "reverse-text-generator" ? (
                  <ArrowRightLeft className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "sql-formatter-validator" ? (
                  <Database className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "regex-tester" ? (
                  <SearchCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "diff-checker" ? (
                  <Columns className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "markdown-to-html" ? (
                  <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "html-formatter-validator" || toolSlug === "css-formatter-validator" || toolSlug === "javascript-formatter-minifier" ? (
                  <FileCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "json-to-csv-converter" ? (
                  <ArrowRightLeft className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "html-to-markdown" ? (
                  <ArrowRightLeft className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "html-css-minifier-unminifier" ? (
                  <Minimize2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "meta-tag-generator" ? (
                  <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "open-graph-generator" ? (
                  <Share2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "domain-age-checker" ? (
                  <Clock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "domain-to-ip" ? (
                  <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : (toolSlug === "ip-location" || toolSlug === "random-address-generator") ? (
                  <MapPin className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "random-country-picker" ? (
                  <Globe2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "find-dns-record" ? (
                  <Database className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "http-headers" ? (
                  <Server className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "ssl-checker" ? (
                  <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : (toolSlug === "sitemap-generator" || toolSlug === "timezone-converter") ? (
                  <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "yaml-to-json-converter" ? (
                  <ArrowRightLeft className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "text-tools" && toolSlug === "small-text-generator" ? (
                  <Type className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "text-tools" && toolSlug === "word-combiner" ? (
                  <Layers className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "text-tools" && toolSlug === "rewrite-article" ? (
                  <RefreshCw className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "text-tools" && toolSlug === "online-text-editor" ? (
                  <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "developer-tools" && toolSlug === "rgb-to-hex" ? (
                  <Palette className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "generator-tools" && toolSlug === "credit-card-generator" ? (
                  <CreditCard className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "image-tools" && toolSlug === "png-to-jpg" ? (
                  <FileImage className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "image-tools" && toolSlug === "image-compressor" ? (
                  <Minimize2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "image-tools" && toolSlug === "favicon-generator" ? (
                  <Globe className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "image-tools" && toolSlug === "svg-converter" ? (
                  <FileCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "image-tools" && toolSlug === "heic-to-jpg" ? (
                  <FileImage className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "extract-pdf-images" ? (
                  <FileImage className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : (category === "text-tools" && toolSlug === "lorem-ipsum-generator") || (category === "pdf-tools" && (toolSlug === "compress-pdf" || toolSlug === "text-to-pdf")) ? (
                  <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "calculators" && toolSlug === "pregnancy-due-date-calculator" ? (
                  <Baby className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : category === "calculators" && toolSlug === "scientific-calculator" ? (
                  <Calculator className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "uuid-generator" ? (
                  <Fingerprint className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "dice-roller" ? (
                  <Dices className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "color-picker-contrast-checker" ? (
                  <Pipette className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "css-border-radius-generator" ? (
                  <Shapes className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "css-box-shadow-generator" ? (
                  <Sliders className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "css-flexbox-playground" ? (
                  <Layout className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "css-grid-generator" ? (
                  <LayoutGrid className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "html-table-generator" ? (
                  <Table className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "user-agent-parser" ? (
                  <Terminal className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "javascript-keycode-finder" ? (
                  <Keyboard className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : toolSlug === "chmod-calculator" ? (
                  <Shield className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : COMPLETED_TOOLS.includes(toolSlug) && category === "converter-tools" ? (

                  <Binary className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <QrCode className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  {tool.name}
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                  {tool.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Interactive Tool Interface */}
          {category === "developer-tools" && toolSlug === "html-table-generator" ? (
            <HtmlTableGenerator />
          ) : category === "developer-tools" && toolSlug === "md5-generator" ? (
            <Md5Generator />
          ) : category === "developer-tools" && toolSlug === "sha-generator" ? (
            <ShaGenerator />
          ) : category === "developer-tools" && toolSlug === "base64-encode-decode" ? (
            <Base64Converter />
          ) : category === "developer-tools" && toolSlug === "url-encoder-decoder" ? (
            <UrlEncoderDecoder />
          ) : category === "developer-tools" && toolSlug === "html-entity-encoder-decoder" ? (
            <HtmlEncoderDecoder />
          ) : category === "developer-tools" && toolSlug === "json-formatter-validator" ? (
            <JsonFormatterValidator />
          ) : category === "developer-tools" && toolSlug === "xml-formatter-validator" ? (
            <XmlFormatterValidator />
          ) : category === "developer-tools" && toolSlug === "jwt-decoder" ? (
            <JwtDecoder />
          ) : category === "text-tools" && toolSlug === "case-converter" ? (
            <CaseConverter />
          ) : category === "text-tools" && toolSlug === "comma-separator" ? (
            <CommaSeparator />
          ) : category === "text-tools" && toolSlug === "reverse-text-generator" ? (
            <ReverseTextGenerator />
          ) : category === "text-tools" && toolSlug === "small-text-generator" ? (
            <SmallTextGenerator />
          ) : category === "text-tools" && toolSlug === "word-combiner" ? (
            <WordCombiner />
          ) : category === "text-tools" && toolSlug === "rewrite-article" ? (
            <ArticleRewriter />
          ) : category === "text-tools" && toolSlug === "online-text-editor" ? (
            <OnlineTextEditor />
          ) : category === "text-tools" && toolSlug === "lorem-ipsum-generator" ? (
            <LoremIpsumGenerator />
          ) : category === "password-tools" && toolSlug === "password-generator" ? (
            <PasswordGenerator />
          ) : category === "password-tools" && toolSlug === "password-strength-checker" ? (
            <PasswordStrengthChecker />
          ) : category === "calculators" && toolSlug === "age-calculator" ? (
            <AgeCalculator />
          ) : category === "calculators" && toolSlug === "percentage-calculator" ? (
            <PercentageCalculator />
          ) : category === "calculators" && toolSlug === "average-calculator" ? (
            <AverageCalculator />
          ) : category === "converter-tools" && (toolSlug === "string-to-hex" || toolSlug === "hex-to-string") ? (
            <StringHexConverter initialSlug={toolSlug} />
          ) : category === "converter-tools" && COMPLETED_TOOLS.includes(toolSlug) ? (
            <BinaryConverter initialSlug={toolSlug} />
          ) : category === "developer-tools" && toolSlug === "unix-timestamp-converter" ? (
            <UnixTimestampConverter />
          ) : category === "developer-tools" && toolSlug === "cron-expression-generator" ? (
            <CronExpressionGenerator />
          ) : category === "developer-tools" && toolSlug === "sql-formatter-validator" ? (
            <SqlFormatter />
          ) : category === "developer-tools" && toolSlug === "regex-tester" ? (
            <RegexTester />
          ) : category === "developer-tools" && toolSlug === "diff-checker" ? (
            <DiffChecker />
          ) : category === "developer-tools" && toolSlug === "markdown-to-html" ? (
            <MarkdownToHtmlConverter />
          ) : category === "developer-tools" && toolSlug === "html-formatter-validator" ? (
            <HtmlFormatter />
          ) : category === "developer-tools" && toolSlug === "css-formatter-validator" ? (
            <CssFormatter />
          ) : category === "developer-tools" && toolSlug === "javascript-formatter-minifier" ? (
            <JavaScriptFormatter />
          ) : category === "developer-tools" && toolSlug === "json-to-csv-converter" ? (
            <JsonCsvConverter />
          ) : category === "developer-tools" && toolSlug === "html-to-markdown" ? (
            <HtmlToMarkdown />
          ) : category === "developer-tools" && toolSlug === "html-css-minifier-unminifier" ? (
            <HtmlCssMinifier />
          ) : category === "web-tools" && toolSlug === "meta-tag-generator" ? (
            <MetaTagGenerator />
          ) : category === "web-tools" && toolSlug === "open-graph-generator" ? (
            <OpenGraphGenerator />
          ) : category === "web-tools" && toolSlug === "domain-age-checker" ? (
            <DomainAgeChecker />
          ) : category === "web-tools" && toolSlug === "domain-to-ip" ? (
            <DomainToIpConverter />
          ) : category === "web-tools" && toolSlug === "ip-location" ? (
            <IpLocation />
          ) : category === "web-tools" && toolSlug === "find-dns-record" ? (
            <FindDnsRecord />
          ) : category === "web-tools" && toolSlug === "http-headers" ? (
            <HttpHeadersInspector />
          ) : category === "web-tools" && toolSlug === "ssl-checker" ? (
            <SslChecker />
          ) : category === "web-tools" && toolSlug === "sitemap-generator" ? (
            <SitemapGenerator />
          ) : category === "developer-tools" && toolSlug === "rgb-to-hex" ? (
            <RgbToHex />
          ) : category === "generator-tools" && toolSlug === "credit-card-generator" ? (
            <CreditCardGenerator />
          ) : category === "developer-tools" && toolSlug === "yaml-to-json-converter" ? (
            <YamlJsonConverter />
          ) : category === "image-tools" && toolSlug === "png-to-jpg" ? (
            <PngToJpgConverter />
          ) : category === "image-tools" && toolSlug === "image-compressor" ? (
            <ImageCompressor />
          ) : category === "image-tools" && toolSlug === "favicon-generator" ? (
            <FaviconGeneratorSuite />
          ) : category === "image-tools" && toolSlug === "svg-converter" ? (
            <SvgConverter />
          ) : category === "image-tools" && toolSlug === "heic-to-jpg" ? (
            <HeicToJpgConverter />
          ) : category === "pdf-tools" && toolSlug === "compress-pdf" ? (
            <PdfCompressorSuite />
          ) : category === "pdf-tools" && toolSlug === "text-to-pdf" ? (
            <TextToPdfConverter />
          ) : category === "pdf-tools" && toolSlug === "extract-pdf-images" ? (
            <ExtractPdfImages />
          ) : category === "calculators" && toolSlug === "pregnancy-due-date-calculator" ? (
            <PregnancyDueDateCalculator />
          ) : category === "calculators" && toolSlug === "scientific-calculator" ? (
            <ScientificCalculator />
          ) : category === "date-tools" && toolSlug === "timezone-converter" ? (
            <TimezoneConverter />
          ) : category === "random-tools" && toolSlug === "dice-roller" ? (
            <DiceRoller />
          ) : category === "random-tools" && toolSlug === "random-address-generator" ? (
            <RandomAddressGenerator />
          ) : category === "random-tools" && toolSlug === "random-country-picker" ? (
            <RandomCountryPicker />
          ) : category === "developer-tools" && toolSlug === "color-picker-contrast-checker" ? (
            <ColorPickerContrastChecker />
          ) : category === "developer-tools" && toolSlug === "css-border-radius-generator" ? (
            <CssBorderRadiusGenerator />
          ) : category === "developer-tools" && toolSlug === "css-box-shadow-generator" ? (
            <CssBoxShadowGenerator />
          ) : category === "developer-tools" && toolSlug === "css-flexbox-playground" ? (
            <CssFlexboxPlayground />
          ) : category === "developer-tools" && toolSlug === "css-grid-generator" ? (
            <CssGridGenerator />
          ) : category === "developer-tools" && toolSlug === "user-agent-parser" ? (
            <UserAgentParser />
          ) : category === "developer-tools" && toolSlug === "javascript-keycode-finder" ? (
            <KeycodeInspector />
          ) : category === "developer-tools" && toolSlug === "chmod-calculator" ? (
            <ChmodCalculator />
          ) : category === "generator-tools" && toolSlug === "uuid-generator" ? (

            <UuidGenerator />
          ) : category === "generator-tools" && toolSlug === "qr-code-generator" ? (
            <>
              <QrCodeGenerator />
              {/* Card 1: What Is a QR Code & Error Correction */}
              <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span>What Is a QR Code &amp; How Does It Work?</span>
                </h2>
                <div className="space-y-4 text-slate-600">
                  <p className="text-base leading-relaxed">
                    QR codes (Quick Response codes) were developed in 1994 by Denso Wave for tracking automotive parts and have since evolved into an essential tool for businesses, marketers, and individuals worldwide. A QR code is a two-dimensional barcode that encodes data in a matrix of black and white squares. Smartphones can decode these patterns in milliseconds — no app required on modern devices.
                  </p>
                  <p className="text-base leading-relaxed">
                    One of the most critical features of QR codes is their built-in <strong>error correction capability</strong>, powered by Reed-Solomon algorithms. This allows QR codes to remain scannable even when partially damaged, dirty, or obscured. Our generator offers four industry-standard error correction levels:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { level: "Level L", pct: "~7% recovery", desc: "Clean indoor environments, digital displays and PDFs. Produces the smallest, densest codes." },
                      { level: "Level M", pct: "~15% recovery", desc: "Standard choice for most use cases. Balances size and resilience. Perfect for business cards and brochures." },
                      { level: "Level Q", pct: "~25% recovery", desc: "Outdoor applications and product packaging where wear and tear is expected." },
                      { level: "Level H", pct: "~30% recovery", desc: "Required when adding a logo overlay. Redundancy compensates for the obscured center area." },
                    ].map(({ level, pct, desc }) => (
                      <div key={level} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                          <span className="font-semibold text-slate-800 text-sm">{level}</span>
                          <span className="text-xs text-indigo-600 font-medium ml-auto">{pct}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Card 2: How to Use — Steps Grid */}
              <section className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span>How to Use the Free QR Code Generator</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { num: "01", title: "Select Your Template", body: "Choose from 8 specialized templates: URL, vCard, Text, WiFi, Email, SMS, WhatsApp, or Phone. Each format is optimally encoded for its use case." },
                    { num: "02", title: "Enter Your Content", body: "Fill in the dynamic form fields. For WiFi, enter your SSID and password. For URLs, include the full https:// prefix. For WhatsApp, use international format with country code." },
                    { num: "03", title: "Customize the Design", body: "Pick brand colors with our color pickers, or enable linear gradient mode for a diagonal color transition. Maintain a minimum 3:1 contrast ratio for reliable scanning." },
                    { num: "04", title: "Set Error Correction", body: "Choose Level H if adding a logo or for outdoor use. Level M is ideal for clean digital environments. Higher levels create denser patterns but survive more damage." },
                    { num: "05", title: "Upload a Logo (Optional)", body: "Add your company logo — our engine centers it automatically with protective white space. Supported: PNG, JPG, SVG. Keep the logo under 25% of the code area." },
                    { num: "06", title: "Download & Deploy", body: "Export as high-resolution PNG (with logo support) or infinitely scalable SVG. Set your export size from 400px to 1200px for print-quality output." },
                  ].map(({ num, title, body }) => (
                    <div key={num} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide">
                        {num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card 3: Use Cases Grid */}
              <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span>Practical Business Use Cases</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-5">
                  {[
                    { title: "Restaurant Digital Menus", body: "Replace printed menus with QR codes on table tents or window displays. Customers scan to access your menu, reducing printing costs and enabling instant updates." },
                    { title: "Business Card Enhancement", body: "Add a QR code linking to your LinkedIn profile, digital portfolio, or vCard contact info. Recipients instantly save your details without manual entry." },
                    { title: "Product Packaging Information", body: "Print QR codes on packaging to provide detailed instructions, warranty registration, tutorial videos, or authenticity verification." },
                    { title: "Event Ticketing & Check-in", body: "Generate unique QR codes for event tickets, conference badges, or venue access. Attendees present their code at entry points for instant verification." },
                    { title: "WiFi Network Sharing", body: "Create WiFi QR codes for guest networks in offices, cafes, hotels, or Airbnb properties. Guests scan to connect automatically without typing passwords." },
                    { title: "Real Estate Property Tours", body: "Place QR codes on property signage linking to virtual tours, photo galleries, or agent contact info — accessible 24/7 without scheduling appointments." },
                    { title: "Retail Product Reviews", body: "Add QR codes to product displays linking to reviews, specifications, comparison charts, or how-to videos to empower informed in-store decisions." },
                    { title: "Payment & Donation Collection", body: "Generate QR codes for PayPal, Venmo, Cash App, cryptocurrency wallets, or donation platforms — accept digital payments instantly." },
                    { title: "Educational Materials", body: "Include QR codes in textbooks or classroom posters linking to supplementary videos, interactive exercises, and pronunciation guides for richer learning." },
                    { title: "Marketing Campaign Tracking", body: "Create unique QR codes per marketing channel — print ads, billboards, direct mail — each pointing to campaign-specific landing pages for accurate ROI tracking." },
                  ].map(({ title, body }) => (
                    <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card 4: FAQ */}
              <section className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span>Frequently Asked Questions</span>
                </h2>
                <div className="space-y-5">
                  {[
                    {
                      q: "What’s the difference between static and dynamic QR codes?",
                      a: "Our generator creates static QR codes — the data is permanently encoded within the code itself. Once generated, the content cannot be changed. Static codes work forever without requiring any service or subscription, never expire, have no tracking concerns, and function completely offline. Dynamic QR codes (offered by subscription services) contain a short URL that redirects to changeable content, but require ongoing fees, can break if the service shuts down, and introduce tracking. For permanent, reliable, privacy-respecting QR codes, static is the superior choice.",
                    },
                    {
                      q: "Do QR codes generated by your tool expire or have usage limits?",
                      a: "Absolutely not. QR codes created with our generator are 100% free, permanent, and have no restrictions. No expiration dates, no scan limits, no hidden fees, and no service dependencies. Once downloaded, the code is yours forever and functions indefinitely. We don’t track scans, require accounts, or insert analytics. You can print unlimited copies and use them commercially worldwide.",
                    },
                    {
                      q: "What’s the maximum scanning distance for QR codes?",
                      a: "The general rule is that scanning distance is approximately 10 times the QR code width. A 4-inch (10cm) code can be scanned from about 40 inches (100cm) away. Factors include camera quality, lighting, foreground/background contrast, data complexity, and error correction level. For optimal scannability, ensure codes are at least 2x2 inches (5x5cm) for close-range scanning.",
                    },
                    {
                      q: "Can I change the destination URL after generating a QR code?",
                      a: "Static QR codes permanently encode the destination and cannot be changed after generation. The smart workaround: point your QR code to a URL shortener like Bitly or TinyURL, then update where that short link redirects in the dashboard. The QR code stays the same, but you control the destination — free, permanent QR codes with flexible destination management.",
                    },
                    {
                      q: "Why won’t my QR code scan properly?",
                      a: "Common causes: insufficient contrast, code too small (minimum 2x2cm for print), poor print quality, logo exceeding 25% of code area, curved surfaces, damage or dirt, incorrect error correction level, reflective materials, or low lighting. To fix: test with multiple devices, ensure adequate lighting, regenerate with Level H error correction, increase physical size, and use flat matte surfaces.",
                    },
                    {
                      q: "Are QR codes safe? Can they contain viruses or malware?",
                      a: "QR codes themselves are completely safe — they are simply encoded data (text, URLs, WiFi credentials) and cannot contain executable code, viruses, or malware. However, the destination a QR code points to could be malicious, just like any link. Best practices: verify the source before scanning, use QR readers that preview the URL first, look for HTTPS, and be cautious of codes in unexpected places. Our generator creates safe, transparent codes with no hidden tracking or redirects.",
                    },
                  ].map(({ q, a }) => (
                    <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm">
                      <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                        {q}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card 5: Why Our Tool */}
              <section className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-8 md:p-10 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-6">Why Choose Our QR Code Generator?</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: "Completely Free Forever", body: "No trials, no subscriptions, no hidden costs. Generate unlimited QR codes with full functionality." },
                    { title: "Advanced Customization", body: "Full color control, linear gradient mode, logo overlay support, multiple templates, and adjustable error correction." },
                    { title: "Privacy-Focused", body: "All processing happens in your browser. Your data never touches our servers. No tracking, no analytics." },
                    { title: "Multiple Export Formats", body: "Download as high-resolution PNG (with logo support) or infinitely scalable SVG for professional large-format printing." },
                    { title: "No Expiration or Limits", body: "Static codes that work forever, offline-capable, no service dependencies or account requirements." },
                    { title: "Professional Quality", body: "Enterprise-grade Reed-Solomon error correction, optimal quiet zones, and ISO/IEC 18004 compliance." },
                  ].map(({ title, body }) => (
                    <div key={title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-200 flex-shrink-0 mt-1.5"></span>
                      <div>
                        <p className="font-semibold text-white text-sm">{title}</p>
                        <p className="text-indigo-200 text-sm mt-1 leading-relaxed">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}



          {/* Social Sharing Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Left: helper copy */}
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                Found this tool helpful?{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">Share it with others!</span>
              </p>

              {/* Right: icon-only buttons with CSS-only tooltips */}
              <div className="flex items-center gap-2 flex-shrink-0">

                {/* Facebook */}
                <div className="relative group">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.twistertools.com${tool.new_url}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1877f2] hover:bg-[#0c63d4] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on Facebook
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* X / Twitter */}
                <div className="relative group">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.twistertools.com${tool.new_url}`)}&text=${encodeURIComponent(`Check out this free ${tool.name} tool!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X (Twitter)"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1da1f2] hover:bg-[#0c8bd9] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on X
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* LinkedIn */}
                <div className="relative group">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://www.twistertools.com${tool.new_url}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0077b5] hover:bg-[#005885] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on LinkedIn
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* Copy URL */}
                <div className="relative group">
                  <CopyLinkButton url={`https://www.twistertools.com${tool.new_url}`} />
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Copy URL
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

              </div>
            </div>
          </div>

          {/* Related Tools — Internal Linking for SEO & Navigation */}
          <RelatedTools currentSlug={toolSlug} currentCategory={category} />
        </div>
      </div>
    </div>
  );
}
