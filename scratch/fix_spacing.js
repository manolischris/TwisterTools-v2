const fs = require('fs');
const content = fs.readFileSync('components/tools/InvestmentCalculator.tsx', 'utf8');
const lines = content.split(/\r?\n/);
const fixedLines = [];
for (let i = 0; i < lines.length; i += 2) {
    fixedLines.push(lines[i]);
}
const fixedContent = fixedLines.join('\r\n');
fs.writeFileSync('components/tools/InvestmentCalculator.tsx', fixedContent, 'utf8');
console.log('Fixed spacing!');
