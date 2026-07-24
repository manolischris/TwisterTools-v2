const fs = require("fs");
const path =
  "c:/Users/Manolis/Documents/Apps/twistertools-workspace/twistertools-v2/components/tools/HtmlToMarkdown.tsx";
let content = fs.readFileSync(path, "utf8");

// Fix the escapeHtml function - replace the decoded entities with proper ones
content = content.replace(
  /function escapeHtml\(text: string\): string \{[\s\S]*?^}/m,
  `function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}`
);

fs.writeFileSync(path, content, "utf8");
console.log("escapeHtml function fixed successfully");
