import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Link as LinkIcon,
  Link2,
  Activity,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpDown,
  Baby,
  Binary,
  BookOpen,
  Building,
  Calculator,
  Calendar,
  CalendarClock,
  Car,
  Clock,
  Code,
  Columns,
  Combine,
  Cpu,
  CreditCard,
  Crop,
  Database,
  DollarSign,
  Droplets,
  Edit3,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  FileType2,
  Fingerprint,
  Flame,
  FolderArchive,
  Globe,
  Globe2,
  GraduationCap,
  Grid,
  Hash,
  Heart,
  Layers,
  ListOrdered,
  ListStart,
  Lock,
  MapPin,
  Minimize2,
  Palette,
  Percent,
  PieChart,
  PiggyBank,
  QrCode,
  RefreshCw,
  RotateCw,
  Scale,
  Scaling,
  Scissors,
  SearchCode,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  Stamp,
  Timer,
  TrendingUp,
  Type,
  Unlock,
  Wine,
  Sparkles,
  HelpCircle,
  Info,
  AlertCircle,
  FileCheck2,
  Image as ImageIcon,
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace,
  Radio,
  Zap,
  Strikethrough,
  Sunrise,
  Moon,
  Dices,
  Users
} from "lucide-react";

import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Type definitions for Next.js params
type Params = Promise<{ category: string }>;

// Map icon strings to Lucide components for the Server Page
const SERVER_ICON_MAP: Record<string, React.ComponentType<any>> = {
  Link: LinkIcon,
  Link2,
  Activity,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpDown,
  Baby,
  Binary,
  Building,
  Calculator,
  Calendar,
  CalendarClock,
  Car,
  Clock,
  Code,
  Columns,
  Combine,
  Cpu,
  CreditCard,
  Crop,
  Database,
  DollarSign,
  Droplets,
  Edit3,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType,
  FileType2,
  Fingerprint,
  Flame,
  FolderArchive,
  Globe,
  Globe2,
  GraduationCap,
  Grid,
  Hash,
  Heart,
  Layers,
  ListOrdered,
  ListStart,
  Lock,
  MapPin,
  Minimize2,
  Palette,
  Percent,
  PieChart,
  PiggyBank,
  QrCode,
  RefreshCw,
  RotateCw,
  Scale,
  Scaling,
  Scissors,
  Strikethrough,
  SearchCode,
  Server,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sigma,
  Stamp,
  Timer,
  TrendingUp,
  Type,
  Unlock,
  Wine,
  Sparkles,
  HelpCircle,
  Info,
  AlertCircle,
  ImageIcon,
  Image: ImageIcon,
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace,
  Radio,
  Zap,
  Sunrise,
  Moon,
  Dices,
  Users
};

// Centralized Category Metadata Registry matching all categories from url-map.json
const CATEGORIES_METADATA: Record<
  string,
  {
    name: string;
    icon: string;
    description: string;
    detailedGuide: string;
    seoDescription: string;
    keywords?: string[];
    cards: { title: string; content: string; icon: string }[];
    faqs: { q: string; a: string }[];
  }
> = {
  "generator-tools": {
    name: "Random Data, Identity & Key Generators",
    icon: "Cpu",
    description: "Generate secure UUIDs, QR codes, test credit cards, mock identities, and random strings with cryptographic precision.",
    detailedGuide: "Create customized, production-ready assets instantly right inside your browser. All generation is computed client-side with absolute zero server transmission.",
    seoDescription: "Generate secure UUIDs, QR codes, test credit cards, mock identities, and random strings with cryptographic precision.",
    keywords: ["qr code generator", "uuid generator", "test credit card", "password generator"],
    cards: [
      {
        title: "Dynamic Asset Generation in Your Browser",
        icon: "Cpu",
        content: "Our generator tools are built to produce mock datasets, identifiers, graphics, and styling assets instantly. By harnessing modern browser compilation systems, we bypass the need for round-trip server APIs. This means you get instantaneous generation regardless of your internet bandwidth."
      },
      {
        title: "Advanced Customization & Control",
        icon: "Layers",
        content: "Every generator is designed with advanced configuration panels. Adjust colors, format parameters, modify cryptographic parameters, or compile bulk sequences in seconds. Download outputs in web-ready formats such as PNG, SVG, JSON, or plain text."
      },
      {
        title: "Guaranteed Local Client-Side Execution",
        icon: "ShieldCheck",
        content: "Security is built into the architecture. All data inputs (like custom text for QR codes or base seeds) are processed purely within the sandbox of your browser's V8 or JavaScript engine. No remote server is contacted, ensuring sensitive info is never exposed."
      },
      {
        title: "Workflow & Automation Compatibility",
        icon: "Code",
        content: "Easily integrate generated assets into development, testing, and staging environments. Whether you need 1,000 unique UUIDs for database seeding, valid test card numbers for gateway validation, or clean QR codes, our tools support one-click copy and file downloads."
      }
    ],
    faqs: [
      {
        q: "Are the generated items or input values sent to any external server?",
        a: "No. All generation logic, including QR code rendering, random number math, and luhn checks, runs entirely locally in your browser session. Your data never leaves your device."
      },
      {
        q: "Can I use these assets in commercial applications?",
        a: "Yes. All assets, UUIDs, and mock identities generated here are free for personal, commercial, educational, and testing purposes without royalty or attribution."
      },
      {
        q: "Do the QR codes generated have any scan limits or expiration?",
        a: "No. Since the QR codes are generated directly from the content you provide and compiled into image files, they are permanent and contain no tracking or scan limits."
      }
    ]
  },
  "developer-tools": {
    name: "Developer, Code & Web Engineering Tools",
    icon: "Code",
    description: "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
    detailedGuide: "Accelerate your debugging and development workflow with client-safe developer engines. No data entered ever leaves your device.",
    seoDescription: "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
    keywords: ["json formatter", "css gradient generator", "regex tester", "base64 encoder", "jwt decoder"],
    cards: [
      {
        title: "Client-Safe Syntax Formatting",
        icon: "Code",
        content: "Analyze and clean your code structures safely. Our formatters parse JSON, XML, SQL, HTML, CSS, and JavaScript using local TypeScript tokenizers. Clean nested syntax, minify stylesheets, or parse complex databases instantly."
      },
      {
        title: "Cryptographic Integrity Auditing",
        icon: "ShieldCheck",
        content: "Generate MD5, SHA-1, SHA-256, SHA-512, or SHA-3 hashes in real-time. Verify files or text checksums against software packages directly. The entire process runs client-side, making it ideal for checking proprietary files."
      },
      {
        title: "Regular Expression & Logic Testing",
        icon: "SearchCode",
        content: "Test your expressions using live JavaScript RegExp engines. View match highlighting, capturing groups, and execution speeds instantly, supported by a comprehensive syntax cheat sheet to build complex parameters."
      },
      {
        title: "Data Format Conversion Suite",
        icon: "RefreshCw",
        content: "Symmetrically convert between YAML and JSON, or JSON and CSV in a split-screen workspace. Adjust delimiters, flatten object hierarchies, and export files directly with single-click triggers."
      }
    ],
    faqs: [
      {
        q: "Is it safe to format proprietary JSON or XML code here?",
        a: "Yes, 100% safe. The formatting and linting operations happen locally. No network requests are sent with your code, keeping your intellectual property completely secure."
      },
      {
        q: "How does the JWT Decoder handle secure tokens?",
        a: "The decoder splits the JSON Web Token structure (header, payload, signature) using client-side base64 url-decoding. No keys or tokens are stored or sent anywhere."
      },
      {
        q: "Does the SQL Formatter support multiple dialects?",
        a: "Yes, you can format queries tailored for Standard SQL, PostgreSQL, MySQL, and Microsoft SQL Server (T-SQL) with customized indentation spacing."
      }
    ]
  },
  "password-tools": {
    name: "Password Management & Security Utilities",
    icon: "Lock",
    description: "Generate cryptographically strong passphrases and analyze password crack times 100% locally with zero data exposure.",
    detailedGuide: "Evaluate and construct extreme-strength local passwords using cryptographically secure PRNG architectures.",
    seoDescription: "Generate cryptographically strong passphrases and analyze password crack times 100% locally with zero data exposure.",
    keywords: ["password generator", "password strength checker", "passphrase generator"],
    cards: [
      {
        title: "Secure Random Key & Passphrase Generation",
        icon: "Lock",
        content: "Create custom alphanumeric passwords or word-based passphrases. Toggle symbols, numbers, and letter cases. The passwords are constructed using cryptographically secure random number generators (CSPRNG) for true unpredictability."
      },
      {
        title: "Mathematical Strength & Entropy Scoring",
        icon: "Cpu",
        content: "Evaluate your credentials using Shannon Entropy equations. Analyze password strength based on symbol diversity and length to calculate exact bits of entropy and identify common structural patterns."
      },
      {
        title: "Simulated Cracking Timelines",
        icon: "Clock",
        content: "See estimated brute-force times against standard computer hardware, graphics cards, and cloud-scale supercomputers. This gives you a clear visual metric of how well your credentials resist attacks."
      },
      {
        title: "Zero Server Interactions",
        icon: "ShieldCheck",
        content: "Unlike online databases that might log passwords, our security suite is entirely offline. All analysis, generation, and formatting reside in the volatile memory of your browser tab, deleted immediately upon closing."
      }
    ],
    faqs: [
      {
        q: "What makes this password generator secure?",
        a: "It leverages window.crypto.getRandomValues(), the web standard for cryptographically secure random numbers, making the generated sequences mathematically immune to prediction."
      },
      {
        q: "Are the analyzed passwords saved or compared to list leaks?",
        a: "We do not store, send, or share any passwords. Strength tests are evaluated locally using general patterns, dictionary lengths, and mathematical entropy equations."
      },
      {
        q: "What is a memorable passphrase and why is it better?",
        a: "A passphrase combines multiple random words. It is often longer than a normal password (giving it higher entropy and making it harder to brute-force) while remaining much easier for humans to remember."
      }
    ]
  },
  "calculators": {
    name: "Daily Essentials, Financial & Math Calculators",
    icon: "Calculator",
    description: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
    detailedGuide: "Run heavy mathematical calculations, date counts, and numerical evaluations in real-time with instant outputs.",
    seoDescription: "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
    keywords: ["financial calculators", "investment tools", "math calculators", "loan estimators", "unit converters"],
    cards: [
      {
        title: "High-Precision Math Computations",
        icon: "Calculator",
        content: "Our math suite handles chronological date differences, statistical metrics, percentages, and multi-domain conversions. We utilize advanced rounding techniques to avoid common floating-point bugs in JavaScript."
      },
      {
        title: "Statistical Data Set Analysis",
        icon: "Cpu",
        content: "Calculate mean, median, mode, variance, and standard deviation for datasets. Enter raw numbers or comma-separated lists, and get complete statistical breakdowns with detailed visualization formulas."
      },
      {
        title: "Chronological Date & Time Calculations",
        icon: "Clock",
        content: "Find exact ages down to the day, count elapsed days between dates, and see upcoming milestones. Perfect for scheduling, tracking project durations, or historical dates."
      },
      {
        title: "AdSense & Revenue Estimation Tools",
        icon: "Layers",
        content: "Determine business expenses, discounted rates, sales tax percentages, or Google AdSense earnings. Quickly calculate gross/net profit margins and test stacked promotions."
      }
    ],
    faqs: [
      {
        q: "Are calculations computed on a server?",
        a: "No. All equations, unit translations, and statistics are calculated by your local device's processor using client-side JavaScript, ensuring speed and confidentiality."
      },
      {
        q: "How does the Unit Converter handle precision?",
        a: "It converts values using precise scale factors. Results are displayed with up to 10 decimal places, preventing round-off error during multi-unit conversions."
      },
      {
        q: "Can I use these calculators on my phone?",
        a: "Yes. All calculators are designed with fully responsive grid layouts that adapt perfectly to touch screens, tablets, and desktop computers."
      }
    ]
  },
  "converter-tools": {
    name: "Data & Number Base Converter Utilities",
    icon: "RefreshCw",
    description: "Convert binary strings, ASCII codes, hexadecimals, bytes, and number bases instantly with real-time telemetry.",
    detailedGuide: "Quickly convert files, units, and structural values with high-precision mathematical precision scaling.",
    seoDescription: "Convert binary strings, ASCII codes, hexadecimals, bytes, and number bases instantly with real-time telemetry.",
    keywords: ["binary converter", "byte converter", "hex to string", "number base converter"],
    cards: [
      {
        title: "Multi-Base Numeric Conversions",
        icon: "RefreshCw",
        content: "Easily translate values between binary, octal, decimal, hexadecimal, and ASCII representations. The conversions update dynamically as you type, providing real-time feedback."
      },
      {
        title: "Hexadecimal String Translators",
        icon: "Cpu",
        content: "Convert text strings to their hexadecimal byte arrays and back. Highly useful for debugging network packets, inspection of file structures, or formatting binary logs."
      },
      {
        title: "Bitwise Data Representation",
        icon: "Code",
        content: "Examine binary data streams. Understand the raw byte structure of characters and integers, supporting both UTF-8 and standard ASCII character sets."
      },
      {
        title: "Safe Offline Processing",
        icon: "ShieldCheck",
        content: "All data encoding and decoding is processed using client-side memory buffers. No data is stored, making it safe to convert private keys, encoded variables, or passwords."
      }
    ],
    faqs: [
      {
        q: "How does the converter handle special characters and emojis?",
        a: "It supports standard UTF-8 encoding, meaning non-ASCII characters and emojis are correctly mapped to their multiple-byte binary or hexadecimal equivalents."
      },
      {
        q: "Is there a size limit for files or strings?",
        a: "You can convert strings up to several megabytes instantly. For larger files, browser thread limitations might cause slight pauses, but the conversion remains local."
      },
      {
        q: "Do you store history of the converted text?",
        a: "No. All inputs and outputs exist solely within the runtime state of your browser tab. Reloading the page clears all session memory."
      }
    ]
  },
  "text-tools": {
    name: "Text Analysis, List Comparison & Editing Tools",
    icon: "FileText",
    description: "Powerful browser-native utilities to compare lists, extract URLs, format text, analyze word counts, and style fonts.",
    detailedGuide: "Execute bulk text modifications, alphabetical sorting, and line extraction with optimized string processing.",
    seoDescription: "Powerful browser-native utilities to compare lists, extract URLs, format text, analyze word counts, and style fonts.",
    keywords: ["list comparison", "url extractor", "duplicate line remover", "text case converter", "word counter"],
    cards: [
      {
        title: "Interactive Text Case Transformation",
        icon: "Type",
        content: "Instantly adjust capitalization formats. Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, or toggle character sequences in real-time."
      },
      {
        title: "List Cleaners & Comma Separators",
        icon: "RefreshCw",
        content: "Scrub data lists easily. Convert column listings, spreadsheets, or tab-delimited text into clean comma-separated lists, SQL array inputs, or customize split characters."
      },
      {
        title: "Text Merging & Keyword Matrix Generator",
        icon: "Layers",
        content: "Merge separate lists of words into combinations, domain ideas, or search phrases. Configure prefixing, suffixing, or separators to compile marketing keywords."
      },
      {
        title: "Browser-Based Paraphraser & Editors",
        icon: "FileText",
        content: "Format rich documents, count words, or rewrite articles. All text transformations are computed locally, maintaining formatting structure without remote database storage."
      }
    ],
    faqs: [
      {
        q: "How fast can these tools process long lists?",
        a: "Most tasks process lists of up to 50,000 lines in less than 100 milliseconds, using optimized local string buffer arrays."
      },
      {
        q: "Does the Article Rewriter send data to AI APIs?",
        a: "No, all synonym swaps and text transformations are calculated using browser-based text replacement logic without external API costs or privacy risks."
      },
      {
        q: "Can I convert list items into formatted CSV files?",
        a: "Yes. Use the Comma Separator or text formatting utilities to arrange text and export it as clean text files."
      }
    ]
  },
  "image-tools": {
    name: "Image Editing, Compression & Conversion Tools",
    icon: "Image",
    description: "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
    detailedGuide: "Crop, resize, compress, and check aspect ratios locally on your device without upload delays.",
    seoDescription: "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
    keywords: ["image compressor", "image resizer", "heic to jpg", "svg converter", "favicon generator"],
    cards: [
      {
        title: "100% Private Local Image Processing",
        icon: "Image",
        content: "We run all graphic operations inside your browser's HTML5 Canvas, WebGL, or WebAssembly sandbox. This means your images are never sent to a cloud server, ensuring privacy for personal photos."
      },
      {
        title: "High-Ratio Image Compression",
        icon: "Minimize2",
        content: "Reduce image file sizes for PNG, JPG, WebP, and GIF formats. Adjust quality scales, compare file sizes in real-time, and download compressed files with maximum visual clarity."
      },
      {
        title: "SVG Vector Converter & Rasterizer",
        icon: "Palette",
        content: "Convert SVG vector files into high-resolution PNG, JPG, or WebP raster formats. Or vectorize simple images into clean vector paths using local canvas edge detection."
      },
      {
        title: "Favicon & PWA Asset Generator",
        icon: "Globe",
        content: "Create favicon files (.ico) and PWA icon sets from any image. Export multi-resolution sizes from 16x16 up to 512x512 with proper manifest files in a single zip package."
      }
    ],
    faqs: [
      {
        q: "Are my uploaded photos safe?",
        a: "Absolutely. Images are processed locally on your hardware. We do not run image storage backends, meaning your files are never uploaded or stored online."
      },
      {
        q: "What is HEIC and can I convert it here?",
        a: "HEIC is Apple's high-efficiency image format. Yes, our HEIC-to-JPG tool translates these files directly in the browser so they can be viewed on non-Apple devices."
      },
      {
        q: "Does compressing images reduce their dimensions?",
        a: "Not by default. Compression optimizes color palettes and reduces metadata. However, you can use our Image Resizer card if you wish to adjust the pixel width and height."
      }
    ]
  },
  "web-tools": {
    name: "SEO, Domain & Network Inspector Tools",
    icon: "Globe",
    description: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
    detailedGuide: "Analyze headers, encode query URIs, inspect configurations, and test networking elements safely.",
    seoDescription: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
    keywords: ["domain age checker", "what is my ip", "dns record finder", "ssl checker", "sitemap generator"],
    cards: [
      {
        title: "Dynamic WHOIS & Domain Age Auditing",
        icon: "Clock",
        content: "Inspect creation dates, registrar details, domain status, and age records. Analyze web performance histories and expiration milestones."
      },
      {
        title: "SSL Trust & Cipher Audits",
        icon: "ShieldCheck",
        content: "Verify SSL/TLS certificates. Check key sizes, CA issuer paths, trust validity, and security protocol compatibility."
      },
      {
        title: "GeoIP Lookup & ASN Telemetry",
        icon: "Globe",
        content: "Find public IP locations, internet providers, ASNs, and network details. Visualize coordinates on offline-first vectors."
      },
      {
        title: "Sitemaps & SEO Indexing Utilities",
        icon: "Server",
        content: "Generate XML, TXT, or HTML sitemaps complying with Google Search guidelines. Customize update frequencies, change counts, and priorities."
      }
    ],
    faqs: [
      {
        q: "Does checking a domain name register it in search histories?",
        a: "No, queries are fetched using secure APIs that inspect public registers without recording search intentions."
      },
      {
        q: "How does What Is My IP work?",
        a: "It makes a direct client-side request to secure geolocation resolvers to capture your IP and network details."
      },
      {
        q: "Are SSL checks updated in real-time?",
        a: "Yes, we connect directly to the target hostname to query the live certificate chain returned by the server."
      }
    ]
  },
  "pdf-tools": {
    name: "PDF & Document Utilities",
    icon: "FileCheck2",
    description: "Fast, secure, and privacy-first PDF document processing engines for converting, merging, compressing, and editing PDF files.",
    detailedGuide: "Process and edit your PDF files client-side without uploading them to external servers. High privacy, fast conversion.",
    seoDescription: "Fast, secure, and privacy-first PDF document processing engines for converting, merging, compressing, and editing PDF files.",
    keywords: ["merge pdf", "compress pdf", "unlock pdf", "pdf to image", "pdf metadata editor"],
    cards: [
      {
        title: "100% Offline PDF Utilities",
        icon: "ShieldCheck",
        content: "Our PDF tools run entirely within your browser using client-side JavaScript. Your files are processed locally and are never uploaded to any remote servers, maintaining complete confidentiality of sensitive documents."
      },
      {
        title: "Symmetrical Format Conversion",
        icon: "RefreshCw",
        content: "Convert Word documents, text files, and images (JPG, PNG, GIF, BMP, TIFF) to PDF instantly. Convert PDFs to ZIP archives or extract text contents with simple one-click controls."
      },
      {
        title: "Document Protection & Management",
        icon: "Lock",
        content: "Encrypt your PDF documents with secure passwords or remove existing password protections. Merge multiple files into a single unified document or organize and rearrange pages."
      },
      {
        title: "Visual Enhancement & Watermarking",
        icon: "Palette",
        content: "Apply text or image-based watermarks to PDF pages. Adjust transparency, positioning, and rotation to protect your intellectual property before sharing."
      }
    ],
    faqs: [
      {
        q: "Are my PDF files uploaded to your servers for processing?",
        a: "No. All PDF generation, merging, conversion, and watermarking actions are executed locally on your computer's browser thread. No document data is transmitted."
      },
      {
        q: "What is the file size limit for PDF processing?",
        a: "Since conversion runs in the browser, performance is determined by your system's RAM. We recommend processing files under 30 MB for the best experience."
      },
      {
        q: "Is password encryption secure?",
        a: "Yes. PDF locking uses standard AES encryption implemented natively in local WebAssembly modules, ensuring your passwords and documents are secure."
      }
    ]
  },
  "date-tools": {
    name: "Date, Time & Scheduling Tools",
    icon: "Calendar",
    description: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
    detailedGuide: "Perform date calculations, convert timezones, count working days, or generate countdown timers locally in your browser session with zero server uploads.",
    seoDescription: "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
    keywords: ["days between dates", "timezone converter", "workday calculator", "countdown timer", "date calculator"],
    cards: [
      {
        title: "100% Offline Date & Time Math",
        icon: "ShieldCheck",
        content: "All calculations, timezone offsets, and duration counting happen completely locally within your browser tab. We never transmit your calendar entries, event details, or scheduling calculations to any server."
      },
      {
        title: "High Precision Chronological Engines",
        icon: "Timer",
        content: "Our date engines strictly comply with ISO-8601 week specifications, standard Gregorian leap year rule sets, and global daylight saving transition database guidelines. Avoid manual calculation errors with custom roundings."
      },
      {
        title: "Event Countdowns & Scheduling Utilities",
        icon: "Clock",
        content: "Easily plan projects or track personal milestones. Convert UTC times to local time zones in real-time, generate custom countdown widget timers, and compute net business workdays in seconds."
      },
      {
        title: "Zero Account Sign-ups Required",
        icon: "Layers",
        content: "No subscription plans or account configurations are necessary. Load the date tools and start calculating immediately on any desktop or mobile device."
      }
    ],
    faqs: [
      {
        q: "Are my schedules or event dates sent to a server?",
        a: "No. All date, timezone, and calendar math is calculated purely client-side on your own CPU in real-time."
      },
      {
        q: "Does the workday calculator account for holidays?",
        a: "Yes. Our upcoming workday utilities support custom configurations so you can toggle local public holiday calendars and weekend schedules."
      },
      {
        q: "Does the timezone converter adjust for daylight saving transitions?",
        a: "Yes. It leverages native browser Internationalization APIs (Intl) and timezone offset registries to correctly calculate DST changes."
      }
    ]
  },
  "random-tools": {
    name: "Randomization, Games & Decision Tools",
    icon: "Dices",
    description: "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
    detailedGuide: "Make quick decisions, play chance games, or shuffle lists securely. All calculations run entirely in your browser with zero server transmission.",
    seoDescription: "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
    keywords: ["random picker", "dice roller", "coin flipper", "team generator", "list shuffler"],
    cards: [
      {
        title: "100% Client-Side Randomization",
        icon: "Dices",
        content: "Our randomizers use cryptographically secure random number generation or high-performance pseudo-random algorithms directly inside your browser. No seed data or choices are sent to external servers."
      },
      {
        title: "Fair Play & Transparency",
        icon: "ShieldCheck",
        content: "Every coin flip, dice roll, or list shuffle is computed locally with mathematical fairness. There are no rigged outcomes, bias, or hidden algorithms—what you see is exactly what the random math produces."
      },
      {
        title: "Clean, Touch-Friendly Layouts",
        icon: "Layers",
        content: "Whether you need to pick a name out of a hat on your phone or roll a set of D&D dice on your tablet, our tools feature responsive, fast, and interactive design elements with satisfying animations."
      },
      {
        title: "Bulk Shuffling & Group Operations",
        icon: "Cpu",
        content: "Quickly generate random team groups, assign tasks, or shuffle large lists. Export your randomized outputs or copy them to your clipboard with a single click."
      }
    ],
    faqs: [
      {
        q: "Are the coin flips or dice rolls rigged?",
        a: "No. The outcomes are generated using native JavaScript random number generation (Math.random or Web Crypto API), ensuring unbiased and mathematically random distributions."
      },
      {
        q: "Can I input custom names or lists?",
        a: "Yes. Our random picker and team generator tools allow you to paste custom list entries, shuffle them, and pick single or multiple items locally in your browser memory."
      },
      {
        q: "Is my list data stored anywhere?",
        a: "Never. All list inputs, names, and generated teams exist purely in the temporary memory of your current browser session. Reloading the page clears all data."
      }
    ]
  }
};

// Next.js static params generation
export async function generateStaticParams() {
  return Object.keys(CATEGORIES_METADATA).map((category) => ({
    category
  }));
}

// Next.js dynamic metadata generator
export async function generateMetadata({
  params
}: {
  params: Params;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryData = CATEGORIES_METADATA[category as keyof typeof CATEGORIES_METADATA];

  if (!categoryData) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found."
    };
  }

  const canonicalUrl = `https://www.twistertools.com/tools/${category}`;
  
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;

  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";


  return {
    title: categoryData.name,
    description: categoryData.seoDescription,
    keywords: categoryData.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${categoryData.name} - TwisterTools`,
      description: categoryData.seoDescription,
      url: canonicalUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: categoryData.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryData.name} - TwisterTools`,
      description: categoryData.seoDescription,
      images: [featuredImage]
    }
  };
}

export default async function CategoryDirectoryPage({
  params
}: {
  params: Params;
}) {
  const { category } = await params;
  const categoryData = CATEGORIES_METADATA[category as keyof typeof CATEGORIES_METADATA];

  if (!categoryData) {
    notFound();
  }

  // Filter tools belonging to this category from the dynamic registry import and sort featured first
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;

  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === category)
    .sort((a, b) => {
      const aFeatured = a.isFeatured ? 1 : 0;
      const bFeatured = b.isFeatured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return b.originalIndex - a.originalIndex;
    });

  const CategoryIcon = SERVER_ICON_MAP[categoryData.icon] || BookOpen;

  // JSON-LD Schemas injection structures
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.twistertools.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Tools",
        "item": "https://www.twistertools.com/tools"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryData.name,
        "item": `https://www.twistertools.com/tools/${category}`
      }
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${categoryData.name} - TwisterTools`,
    "description": categoryData.seoDescription,
    "url": `https://www.twistertools.com/tools/${category}`,
    "about": {
      "@type": "Thing",
      "name": categoryData.name,
      "description": categoryData.description
    },
    "hasPart": categoryTools.map((tool) => ({
      "@type": "WebApplication",
      "name": tool.title,
      "description": tool.description,
      "url": `https://www.twistertools.com${tool.href}`,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All"
    }))
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": categoryData.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 text-slate-800 dark:text-slate-200">
      {/* Dynamic JSON-LD injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header: Slate-to-Indigo Title Bar */}
      <header className="relative overflow-hidden bg-slate-900 text-white border-b border-indigo-700/50">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/og-hero.jpg"
            alt="TwisterTools Background Visual"
            fill
            priority
            className="object-cover object-center opacity-50 mix-blend-luminosity"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Navigation Breadcrumbs */}
          <div className="flex items-center gap-1 text-indigo-100 text-xs md:text-sm font-medium flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link href="/" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {categoryData.name}
            </span>
          </div>

          {/* Title Block with 1:1 Rounded icon container */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <CategoryIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {categoryData.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                {categoryData.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">

        {/* Dynamic Search grid component */}
        <CategoryToolSearchGrid
          tools={categoryTools}
          categorySlug={category}
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {categoryData.cards.map((card, idx) => {
              const CardIcon = SERVER_ICON_MAP[card.icon] || Info;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Full-width FAQ SEO Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoryData.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5 shadow-xs space-y-2"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm md:text-base">
                    {faq.q}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}