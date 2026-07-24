const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../url-map.json');
const map = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Original count of tools:', map.tools.length);

// Find and update id 60
const tool60 = map.tools.find(t => t.id === 60);
if (tool60) {
  console.log('Updating tool 60:', tool60.name);
  tool60.new_url = '/tools/web-tools/meta-tag-generator';
}

// Find and update id 81
const tool81 = map.tools.find(t => t.id === 81);
if (tool81) {
  console.log('Updating tool 81:', tool81.name);
  tool81.new_url = '/tools/developer-tools/html-css-minifier-unminifier';
}

// Find and update id 83
const tool83 = map.tools.find(t => t.id === 83);
if (tool83) {
  console.log('Updating tool 83:', tool83.name);
  tool83.new_url = '/tools/developer-tools/html-css-minifier-unminifier';
}

// Filter out duplicates (id 163 and id 164)
const originalLength = map.tools.length;
map.tools = map.tools.filter(t => t.id !== 163 && t.id !== 164);
console.log('Removed duplicate tools:', originalLength - map.tools.length);

// Update count
map.total_tools = map.tools.length;
console.log('New count of tools:', map.tools.length);

// Write back with 2 space formatting
fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf8');
console.log('Successfully updated url-map.json');
