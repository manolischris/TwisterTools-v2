const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');

const replacements = [
  {
    file: 'app/tools/page.tsx',
    target: 'title: "All Online Utilities & Tools | TwisterTools",',
    replacement: 'title: "All Online Utilities & Tools",',
    onlyFirst: true
  },
  {
    file: 'app/tools/[category]/page.tsx',
    target: 'title: "Category Not Found - TwisterTools",',
    replacement: 'title: "Category Not Found",',
    onlyFirst: false
  },
  {
    file: 'app/tools/[category]/page.tsx',
    target: 'title: `${categoryData.name} - TwisterTools`,',
    replacement: 'title: categoryData.name,',
    onlyFirst: true // We only want the top-level title, which is the first one
  },
  {
    file: 'app/tools/calculators/adsense-calculator/page.tsx',
    target: 'title: "AdSense Revenue & CTR/RPM Earnings Calculator - TwisterTools",',
    replacement: 'title: "AdSense Revenue & CTR/RPM Earnings Calculator",',
    onlyFirst: true
  },
  {
    file: 'app/tools/calculators/discount-calculator/page.tsx',
    target: 'title: "Discount Calculator & Savings Percentage Suite | TwisterTools",',
    replacement: 'title: "Discount Calculator & Savings Percentage Suite",',
    onlyFirst: true
  },
  {
    file: 'app/tools/calculators/master-unit-converter/page.tsx',
    target: 'title: "Universal Unit Converter Suite | TwisterTools",',
    replacement: 'title: "Universal Unit Converter Suite",',
    onlyFirst: true
  },
  {
    file: 'app/tools/calculators/probability-calculator/page.tsx',
    target: 'title: "Probability Calculator & Event Odds Suite - TwisterTools",',
    replacement: 'title: "Probability Calculator & Event Odds Suite",',
    onlyFirst: true
  },
  {
    file: 'app/tools/calculators/sales-tax-calculator/page.tsx',
    target: 'title: "Sales Tax Calculator & Gross/Net Expense Suite - TwisterTools",',
    replacement: 'title: "Sales Tax Calculator & Gross/Net Expense Suite",',
    onlyFirst: true
  },
  {
    file: 'app/tools/converter-tools/binary-converter/page.tsx',
    target: 'title: "Unified Binary & Number Base Converter | TwisterTools",',
    replacement: 'title: "Unified Binary & Number Base Converter",',
    onlyFirst: true
  },
  {
    file: 'app/tools/developer-tools/html-css-minifier-unminifier/page.tsx',
    target: 'title: "HTML & CSS Minifier & Unminifier | TwisterTools",',
    replacement: 'title: "HTML & CSS Minifier & Unminifier",',
    onlyFirst: true
  },
  {
    file: 'app/tools/developer-tools/html-formatter-validator/page.tsx',
    target: 'title: "HTML Formatter, Beautifier & Validator | TwisterTools",',
    replacement: 'title: "HTML Formatter, Beautifier & Validator",',
    onlyFirst: true
  },
  {
    file: 'app/tools/developer-tools/rgb-to-hex/page.tsx',
    target: 'title: "RGB to Hex & Hex to RGB Color Converter - TwisterTools",',
    replacement: 'title: "RGB to Hex & Hex to RGB Color Converter",',
    onlyFirst: true
  },
  {
    file: 'app/tools/generator-tools/credit-card-generator/page.tsx',
    target: 'title: "Test Credit Card & Mock Identity Generator - TwisterTools",',
    replacement: 'title: "Test Credit Card & Mock Identity Generator",',
    onlyFirst: true
  },
  {
    file: 'app/tools/image-tools/image-compressor/page.tsx',
    target: 'title: "Image Compressor & Quality Optimizer | TwisterTools",',
    replacement: 'title: "Image Compressor & Quality Optimizer",',
    onlyFirst: true
  },
  {
    file: 'app/tools/image-tools/image-resizer/page.tsx',
    target: 'title: "Image Resizer & Pixel Dimensions Scaler | TwisterTools",',
    replacement: 'title: "Image Resizer & Pixel Dimensions Scaler",',
    onlyFirst: true
  },
  {
    file: 'app/tools/text-tools/word-combiner/page.tsx',
    target: 'title: "Word Combiner & Phrase Generator | TwisterTools",',
    replacement: 'title: "Word Combiner & Phrase Generator",',
    onlyFirst: true
  },
  {
    file: 'app/tools/web-tools/domain-to-ip/page.tsx',
    target: 'title: "Domain to IP Converter & DNS Inspector | TwisterTools",',
    replacement: 'title: "Domain to IP Converter & DNS Inspector",',
    onlyFirst: true
  },
  {
    file: 'app/tools/web-tools/sitemap-generator/page.tsx',
    target: 'title: "XML Sitemap Generator & URL Crawler Suite | TwisterTools",',
    replacement: 'title: "XML Sitemap Generator & URL Crawler Suite",',
    onlyFirst: true
  },
  {
    file: 'app/tools/web-tools/what-is-my-ip/page.tsx',
    target: 'title: "What Is My IP Address & Network Inspector | TwisterTools",',
    replacement: 'title: "What Is My IP Address & Network Inspector",',
    onlyFirst: true
  }
];

replacements.forEach(({ file, target, replacement, onlyFirst }) => {
  const filepath = path.join(projectDir, file);
  if (!fs.existsSync(filepath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (onlyFirst) {
    // Replace only the first occurrence of the target line
    const idx = content.indexOf(target);
    if (idx !== -1) {
      content = content.substring(0, idx) + replacement + content.substring(idx + target.length);
      console.log(`Replaced first match in ${file}`);
    } else {
      console.log(`Warning: Target not found in ${file}: "${target}"`);
    }
  } else {
    // Replace all occurrences of the target line
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      console.log(`Replaced all matches in ${file}`);
    } else {
      console.log(`Warning: Target not found in ${file}: "${target}"`);
    }
  }
  
  fs.writeFileSync(filepath, content, 'utf8');
});

console.log('Finished updating titles.');
