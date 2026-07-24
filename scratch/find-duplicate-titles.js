const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const appToolsDir = path.join(projectDir, 'app/tools');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file === 'page.tsx') {
      results.push(fullPath);
    }
  });
  return results;
}

const pageFiles = walk(appToolsDir);
console.log('Total page.tsx files found:', pageFiles.length);

const results = [];
pageFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find title line inside metadata objects (metadata: Metadata = { ... title: ... }) or generateMetadata
  // Let's search using a regex or simple line checks
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('title:') && (line.includes('| TwisterTools') || line.includes('- TwisterTools'))) {
      results.push({
        file: path.relative(projectDir, file),
        lineNumber: idx + 1,
        lineContent: line.trim()
      });
    }
  });
});

console.log(JSON.stringify(results, null, 2));
