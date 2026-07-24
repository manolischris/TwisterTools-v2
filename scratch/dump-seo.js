const fs = require('fs');
const path = require('path');

const state = require('../project-state.json');

const targetSlugs = [
  'md5-generator', 'base64-encode-decode', 'url-encoder-decoder', 'html-entity-encoder-decoder',
  'jwt-decoder', 'password-generator', 'qr-code-generator', 'age-calculator',
  'percentage-calculator', 'average-calculator', 'case-converter', 'comma-separator',
  'reverse-text-generator', 'meta-tag-generator', 'open-graph-generator', 'domain-age-checker'
];

const results = [];
targetSlugs.forEach(slug => {
  const tool = state.tools_completed.list.find(t => t.slug === slug);
  if (tool) {
    results.push({
      slug,
      name: tool.name,
      description: tool.description
    });
  } else {
    results.push({ slug, error: 'Not found in completed list' });
  }
});

console.log(JSON.stringify(results, null, 2));
