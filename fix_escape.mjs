import { readFileSync, writeFileSync } from 'fs';
const path = 'c:\\Users\\Manolis\\Documents\\Apps\\twistertools-workspace\\twistertools-v2\\components\\tools\\HtmlToMarkdown.tsx';
let content = readFileSync(path, 'utf8');

// Fix the escapeHtml function
content = content.replace(
  `    .replace(/&/g, "&")`,
  `    .replace(/&/g, "&")`
);
content = content.replace(
  `    .replace(/</g, "<")`,
  `    .replace(/</g, "<")`
);
content = content.replace(
  `    .replace(/>/g, ">")`,
  `    .replace(/>/g, ">")`
);

// Fix the quote replacement - handle both left/right curly quotes
content = content.replace(
  `    .replace(/"/g, "\u201c")`,
  `    .replace(/"/g, """)`
);
content = content.replace(
  `    .replace(/"/g, "\u201d")`,
  `    .replace(/"/g, """)`
);

writeFileSync(path, content, 'utf8');
console.log('Fixed escapeHtml function');