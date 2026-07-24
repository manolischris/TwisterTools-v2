const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/tools/page.tsx',
  'app/tools/[category]/page.tsx',
  'app/tools/calculators/adsense-calculator/page.tsx',
  'app/tools/calculators/discount-calculator/page.tsx',
  'app/tools/calculators/master-unit-converter/page.tsx',
  'app/tools/calculators/probability-calculator/page.tsx',
  'app/tools/calculators/sales-tax-calculator/page.tsx',
  'app/tools/converter-tools/binary-converter/page.tsx',
  'app/tools/developer-tools/html-css-minifier-unminifier/page.tsx',
  'app/tools/developer-tools/html-formatter-validator/page.tsx',
  'app/tools/developer-tools/rgb-to-hex/page.tsx',
  'app/tools/generator-tools/credit-card-generator/page.tsx',
  'app/tools/image-tools/image-compressor/page.tsx',
  'app/tools/image-tools/image-resizer/page.tsx',
  'app/tools/text-tools/word-combiner/page.tsx',
  'app/tools/web-tools/domain-to-ip/page.tsx',
  'app/tools/web-tools/sitemap-generator/page.tsx',
  'app/tools/web-tools/what-is-my-ip/page.tsx'
];

targetFiles.forEach(relPath => {
  const filepath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filepath)) {
    console.log(`File not found: ${relPath}`);
    return;
  }
  const content = fs.readFileSync(filepath, 'utf8');
  console.log(`\n--- File: ${relPath} ---`);
  
  // Print lines around export const metadata or generateMetadata to see the main title line
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('title:') && idx < 50) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    } else if (line.includes('title:') && relPath.includes('[category]')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
