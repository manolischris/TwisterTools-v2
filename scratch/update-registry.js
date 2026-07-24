const fs = require('fs');
const path = require('path');

const registryPath = path.join(__dirname, '../lib/tools-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const updates = {
  "md5-generator": {
    "title": "MD5 Generator and File Checksum Tool",
    "description": "Free online MD5 hash generator with real-time single string hashing, bulk multi-line processing, and local file checksum verification. Pure client-side computation — no data is ever sent to a server."
  },
  "base64-encode-decode": {
    "title": "Base64 Encoder / Decoder",
    "description": "Free online tool to encode and decode Base64 and URL-Safe Base64 strings or local binary files. Processing runs 100% locally in your browser for total data privacy."
  },
  "url-encoder-decoder": {
    "title": "URL Encoder / Decoder Tool",
    "description": "Free online URL Encoder / Decoder tool with real-time encoding, standard variant selection, custom space character converters, and local file text ingestion. 100% secure client-side execution."
  },
  "html-entity-encoder-decoder": {
    "title": "HTML Entity Encoder / Decoder",
    "description": "Free online HTML Entity Encoder and Decoder tool. Encode reserved characters into named entities, decimal refs, or hex refs, and decode them back safely. Offline processing with drag-and-drop file upload."
  },
  "jwt-decoder": {
    "title": "JWT Decoder & Inspector",
    "description": "Decode and inspect JSON Web Tokens (JWT) locally and securely in real-time. View header and payload parameters, analyze security algorithms, and estimate cracking times client-side."
  },
  "password-generator": {
    "title": "Password Generator & Passphrase Creator",
    "description": "Our Advanced Password Generator processes all parameters locally in your browser's RAM using standard secure character arrays and a built-in cryptographic pseudo-random generator (window.crypto.getRandomValues). Zero server-side transmission."
  },
  "qr-code-generator": {
    "title": "Advanced QR Code Generator & Logo Overlay Suite",
    "description": "Generate premium, customizable QR codes with custom colors, gradients, custom shapes, and logo overlay support. 100% client-side rendering with export to high-resolution PNG or vector SVG."
  },
  "age-calculator": {
    "title": "Age Calculator & Chronological Milestone Suite",
    "description": "Calculate your precise chronological age in years, months, weeks, days, hours, and seconds. Includes next birthday countdown and milestones."
  },
  "percentage-calculator": {
    "title": "Percentage Calculator & Algebraic Ratio Suite",
    "description": "Free online percentage calculator with five specialized algebraic processors, offering dynamic real-time calculations entirely client-side. Zero latency, division-by-zero handling, and offline availability."
  },
  "average-calculator": {
    "title": "Average Calculator & Descriptive Statistics Suite",
    "description": "Free online average calculator to compute Arithmetic Mean, Median, Mode, Range, Geometric Mean, Harmonic Mean, Population Standard Deviation, and Sample Standard Deviation. Zero data transmission, computed locally."
  },
  "case-converter": {
    "title": "Case Converter Tool",
    "description": "Free online case converter tool supporting Sentence case, Title Case, UPPER CASE, lower case, Capitalized Case, alternating case, and inverse case conversions entirely in the browser."
  },
  "comma-separator": {
    "title": "Comma Separator Tool",
    "description": "Convert text lists or column entries into comma-delimited strings instantly inside your browser. Supports customizable input separators, sorting, deduplication, quote wrapping, and custom output delimiters."
  },
  "reverse-text-generator": {
    "title": "Reverse Text Generator",
    "description": "Free online reverse text generator supporting standard string reversing, reversing word order, flipping letters, upside down alphanumeric conversion, and mirror flipping characters horizontally in the browser."
  },
  "meta-tag-generator": {
    "title": "Meta Tag Generator & Social Preview Suite",
    "description": "Free online Meta Tag Generator and Social Preview Suite. Generate standard meta tags, OpenGraph tags, and Twitter Card tags with live Google search preview, Facebook/LinkedIn share card preview, and Twitter card preview. Pure TypeScript, 100% client-side, zero external dependencies."
  },
  "open-graph-generator": {
    "title": "Open Graph Generator & Social Card Suite",
    "description": "Generate and preview valid Open Graph and Twitter Card HTML meta tags for social media link optimization."
  },
  "domain-age-checker": {
    "title": "Domain Age Checker & WHOIS Longevity Analyzer",
    "description": "Instant online domain age checker tool to verify WHOIS creation date, registration longevity, expiration metrics, and domain trust score."
  }
};

let updatedCount = 0;
registry.forEach(tool => {
  if (updates[tool.id]) {
    tool.title = updates[tool.id].title;
    tool.description = updates[tool.id].description;
    updatedCount++;
  }
});

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
console.log(`Updated ${updatedCount} tools in tools-registry.json.`);
