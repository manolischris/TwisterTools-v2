const fs = require('fs');
const urlMap = require('../url-map.json');

console.log('Total tools in url-map.json:', urlMap.tools.length);
const targetSlugs = [
  'md5-generator', 'base64-encode-decode', 'url-encoder-decoder', 'html-entity-encoder-decoder',
  'jwt-decoder', 'password-generator', 'qr-code-generator', 'age-calculator',
  'percentage-calculator', 'average-calculator', 'case-converter', 'comma-separator',
  'reverse-text-generator', 'meta-tag-generator', 'open-graph-generator', 'domain-age-checker'
];

targetSlugs.forEach(slug => {
  const matches = urlMap.tools.filter(t => t.new_url.includes(slug) || t.legacy_url.includes(slug));
  console.log(`\nMatches for slug: ${slug}`);
  matches.forEach(m => {
    console.log(` - ID: ${m.id}, Name: "${m.name}", New URL: "${m.new_url}", Desc: "${m.description}"`);
  });
});
