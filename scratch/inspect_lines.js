const fs = require('fs');
const content = fs.readFileSync('components/tools/InvestmentCalculator.tsx', 'utf8');
console.log(JSON.stringify(content.substring(0, 200)));
