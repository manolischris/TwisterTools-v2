const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = 'c:/Users/Manolis/Documents/Apps/twistertools-workspace/twistertools-v2';

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
];

// Let's load url-map.json
const urlMapPath = path.join(WORKSPACE_DIR, 'url-map.json');
const urlMap = JSON.parse(fs.readFileSync(urlMapPath, 'utf8'));

// Scan filesystem for specific page.tsx files under app/tools
const activeTools = new Map();

// Helper to add tool to active set
function addActiveTool(slug, category, title, description, href) {
  if (activeTools.has(slug)) return;
  
  // Decide icon
  let iconName = 'Code2';
  if (slug.includes('calculator') || slug.includes('average') || slug.includes('percentage') || slug === 'age-calculator') {
    iconName = 'Calculator';
  } else if (slug.includes('image') || slug.includes('png') || slug.includes('jpg') || slug.includes('favicon') || slug.includes('svg') || slug.includes('heic')) {
    iconName = 'ImageIcon';
  } else if (slug.includes('compressor') || slug.includes('minifier')) {
    iconName = 'Minimize2';
  } else if (slug.includes('generator') || slug === 'uuid-generator') {
    iconName = 'Sparkles';
  } else if (slug.includes('password')) {
    iconName = 'Lock';
  } else if (slug.includes('hash') || slug.includes('md5') || slug.includes('sha')) {
    iconName = 'Shield';
  } else if (slug.includes('dns') || slug.includes('sql') || slug.includes('database')) {
    iconName = 'Database';
  } else if (slug.includes('text') || slug.includes('markdown') || slug.includes('word') || slug.includes('case') || slug.includes('comma') || slug.includes('editor')) {
    iconName = 'FileText';
  } else if (slug.includes('ip') || slug.includes('domain') || slug.includes('sitemap') || slug.includes('url') || slug.includes('ssl') || slug.includes('http')) {
    iconName = 'Globe';
  } else if (slug.includes('converter') || slug.includes('binary') || slug.includes('hex') || slug.includes('base64') || slug.includes('time') || slug.includes('yaml') || slug.includes('json') || slug.includes('xml') || slug.includes('csv') || slug.includes('encoder') || slug.includes('decoder') || slug.includes('reverse') || slug.includes('diff')) {
    iconName = 'RefreshCw';
  }
  
  // Custom overrides for specific tools
  if (slug === 'investment-calculator') iconName = 'TrendingUp';
  if (slug === 'uuid-generator') iconName = 'Sparkles';
  if (slug === 'credit-card-generator') iconName = 'CreditCard';
  
  // Featured list
  const featuredSlugs = [
    'investment-calculator',
    'json-formatter-validator',
    'uuid-generator',
    'heic-to-jpg'
  ];
  const isFeatured = featuredSlugs.includes(slug);
  
  activeTools.set(slug, {
    id: slug,
    title,
    description,
    category,
    href,
    iconName,
    isFeatured
  });
}

// 1. Process COMPLETED_TOOLS list
COMPLETED_TOOLS.forEach(slug => {
  // Find in url-map
  const matched = urlMap.tools.find(t => {
    const parts = t.new_url.split('/');
    return parts[parts.length - 1] === slug;
  });
  
  if (matched) {
    addActiveTool(
      slug, 
      matched.new_category, 
      matched.name, 
      matched.description, 
      matched.new_url
    );
  } else {
    // If not in urlMap, construct defaults
    addActiveTool(
      slug,
      'developer-tools', // default
      slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      'Free online developer helper utility.',
      `/tools/developer-tools/${slug}`
    );
  }
});

// 2. Scan folders for custom page.tsx implementations (to catch folders that might not be in COMPLETED_TOOLS)
const toolsDir = path.join(WORKSPACE_DIR, 'app/tools');
const categories = fs.readdirSync(toolsDir);
categories.forEach(cat => {
  const catPath = path.join(toolsDir, cat);
  if (!fs.statSync(catPath).isDirectory()) return;
  
  const items = fs.readdirSync(catPath);
  items.forEach(item => {
    const itemPath = path.join(catPath, item);
    if (!fs.statSync(itemPath).isDirectory()) return;
    
    // Check if page.tsx exists
    if (fs.existsSync(path.join(itemPath, 'page.tsx'))) {
      const slug = item;
      const matched = urlMap.tools.find(t => t.new_category === cat && t.new_url.endsWith('/' + slug));
      
      if (matched) {
        addActiveTool(
          slug,
          cat,
          matched.name,
          matched.description,
          matched.new_url
        );
      } else {
        addActiveTool(
          slug,
          cat,
          slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          'Free online web utility.',
          `/tools/${cat}/${slug}`
        );
      }
    }
  });
});

// Output registry
const registryArray = Array.from(activeTools.values());
const registryPath = path.join(WORKSPACE_DIR, 'lib/tools-registry.json');
fs.mkdirSync(path.dirname(registryPath), { recursive: true });
fs.writeFileSync(registryPath, JSON.stringify(registryArray, null, 2), 'utf8');

console.log(`Generated registry with ${registryArray.length} active tools at ${registryPath}`);
