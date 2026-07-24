const fs = require("fs");
const path =
  "c:/Users/Manolis/Documents/Apps/twistertools-workspace/twistertools-v2/components/tools/HtmlToMarkdown.tsx";
let content = fs.readFileSync(path, "utf8");

// Find the escapeHtml function and replace it
const searchStr = `function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}`;

const replaceStr = `function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, """)
    .replace(/'/g, "&#039;");
}`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(path, content, "utf8");
  console.log("escapeHtml function fixed successfully");
} else {
  console.log("Could not find the exact escapeHtml function to replace");
  // Try to find it with a more flexible approach
  const idx = content.indexOf("function escapeHtml");
  if (idx >= 0) {
    const endIdx = content.indexOf("\n}", idx);
    const funcStr = content.substring(idx, endIdx + 2);
    console.log("Found function at", idx, "to", endIdx + 2);
    console.log("Content:", funcStr);
  }
}
