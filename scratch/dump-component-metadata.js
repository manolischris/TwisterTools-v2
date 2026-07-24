const fs = require('fs');
const path = require('path');

const targetMapping = {
  'md5-generator': 'Md5Generator.tsx',
  'base64-encode-decode': 'Base64Converter.tsx',
  'url-encoder-decoder': 'UrlEncoderDecoder.tsx',
  'html-entity-encoder-decoder': 'HtmlEncoderDecoder.tsx',
  'jwt-decoder': 'JwtDecoder.tsx',
  'password-generator': 'PasswordGenerator.tsx',
  'qr-code-generator': 'QrCodeGenerator.tsx',
  'age-calculator': 'AgeCalculator.tsx',
  'percentage-calculator': 'PercentageCalculator.tsx',
  'average-calculator': 'AverageCalculator.tsx',
  'case-converter': 'CaseConverter.tsx',
  'comma-separator': 'CommaSeparator.tsx',
  'reverse-text-generator': 'ReverseTextGenerator.tsx',
  'meta-tag-generator': 'MetaTagGenerator.tsx',
  'open-graph-generator': 'OpenGraphGenerator.tsx',
  'domain-age-checker': 'DomainAgeChecker.tsx'
};

const results = [];

Object.entries(targetMapping).forEach(([slug, filename]) => {
  const filepath = path.join(__dirname, '../components/tools', filename);
  if (!fs.existsSync(filepath)) {
    results.push({ slug, error: `File not found: ${filename}` });
    return;
  }
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Try to find WebApplication schema
  const schemaRegex = /"@type":\s*"WebApplication",\s*([\s\S]*?)\n\s*\}/i;
  const match = content.match(schemaRegex);
  if (match) {
    const block = match[1];
    const nameMatch = block.match(/name:\s*"([\s\S]*?)"/i) || block.match(/"name":\s*"([\s\S]*?)"/i);
    const descMatch = block.match(/description:\s*"([\s\S]*?)"/i) || block.match(/"description":\s*"([\s\S]*?)"/i);
    
    results.push({
      slug,
      name: nameMatch ? nameMatch[1].trim() : 'Unknown Name',
      description: descMatch ? descMatch[1].trim() : 'Unknown Description'
    });
  } else {
    // Try simple regex search for headers/descriptions if schema not matches perfectly
    results.push({ slug, error: 'Schema not found' });
  }
});

console.log(JSON.stringify(results, null, 2));
