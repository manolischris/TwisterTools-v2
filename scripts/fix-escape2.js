const fs = require("fs");
const path =
  "c:/Users/Manolis/Documents/Apps/twistertools-workspace/twistertools-v2/components/tools/HtmlToMarkdown.tsx";
let content = fs.readFileSync(path, "utf8");

// Replace the decoded HTML entities with proper ones
// The file has: "&" but we need "&"
content = content.replace(
  '.replace(/&/g, "&")',
  '.replace(/&/g, "&")'
);
content = content.replace(
  '.replace(/</g, "<")',
  '.replace(/</g, "<")'
);
content = content.replace(
  '.replace(/>/g, ">")',
  '.replace(/>/g, ">")'
);
content = content.replace(
  '.replace(/"/g, """)',
  '.replace(/"/g, """)'
);

fs.writeFileSync(path, content, "utf8");
console.log("escapeHtml function fixed successfully");
