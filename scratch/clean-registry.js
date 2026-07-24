const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const registryPath = path.join(projectDir, 'lib/tools-registry.json');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// The 60 completed tools list
const targetSlugs = [
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
  "base64-encode-decode",
  "url-encoder-decoder",
  "html-entity-encoder-decoder",
  "json-formatter-validator",
  "xml-formatter-validator",
  "jwt-decoder",
  "uuid-generator",
  "string-to-hex",
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
  "adsense-calculator",
  "discount-calculator",
  "master-unit-converter",
  "probability-calculator",
  "sales-tax-calculator",
  "binary-converter",
  "image-resizer",
  "what-is-my-ip"
];

// Let's filter the current registry to keep only these 60 tools
const filteredRegistry = [];

targetSlugs.forEach(slug => {
  let matched = registry.find(t => t.id === slug);
  
  if (!matched) {
    // If not in registry (should be there), construct a default template
    matched = {
      id: slug,
      title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: 'Free online helper utility.',
      category: 'developer-tools',
      href: `/tools/developer-tools/${slug}`,
      iconName: 'Code2',
      isFeatured: false
    };
  }
  
  // Clean placeholder descriptions
  if (matched.description === 'Free online developer helper utility.' || 
      matched.description === 'Free online web utility.' ||
      matched.description === 'Free online helper utility.') {
    
    // Provide high-quality custom descriptions
    if (slug === 'master-unit-converter') {
      matched.description = 'Convert between various standard units of measurement including length, weight, temperature, area, volume, speed, and more.';
    } else if (slug === 'binary-converter') {
      matched.description = 'Convert text to binary code and binary back to text or other bases in real-time.';
    } else if (slug === 'reverse-text-generator') {
      matched.description = 'Instantly reverse words, letters, sentences, or flip text upside down for fun or custom styling.';
    }
  }
  
  // Ensure Lucide icon names are correct and match implementation
  if (slug === 'master-unit-converter') matched.iconName = 'Scale';
  if (slug === 'adsense-calculator') matched.iconName = 'DollarSign';
  if (slug === 'discount-calculator') matched.iconName = 'Percent';
  if (slug === 'image-resizer') matched.iconName = 'Scaling';
  if (slug === 'png-to-jpg') matched.iconName = 'FileImage';
  if (slug === 'svg-converter') matched.iconName = 'FileCode';
  if (slug === 'image-compressor') matched.iconName = 'Minimize2';
  if (slug === 'favicon-generator') matched.iconName = 'Globe';
  if (slug === 'credit-card-generator') matched.iconName = 'CreditCard';
  if (slug === 'heic-to-jpg') matched.iconName = 'ImageIcon';
  if (slug === 'what-is-my-ip') matched.iconName = 'Cpu';
  if (slug === 'ip-location') matched.iconName = 'MapPin';
  if (slug === 'sitemap-generator') matched.iconName = 'Globe';
  if (slug === 'meta-tag-generator') matched.iconName = 'Globe';
  
  // Ensure clean category-based hrefs
  matched.href = `/tools/${matched.category}/${slug}`;
  
  filteredRegistry.push({
    id: matched.id,
    title: matched.title,
    description: matched.description,
    category: matched.category,
    href: matched.href,
    iconName: matched.iconName,
    isFeatured: !!matched.isFeatured
  });
});

// Write registry
fs.writeFileSync(registryPath, JSON.stringify(filteredRegistry, null, 2), 'utf8');
console.log(`Successfully generated registry with ${filteredRegistry.length} active tools!`);

// Print list of icons used now
const icons = new Set(filteredRegistry.map(t => t.iconName));
console.log('Unique icons in new registry:', Array.from(icons));
