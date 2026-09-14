import fs from "node:fs";
import path from "node:path";

const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
const outputPath = path.join(process.cwd(), "public", "llms.txt");

if (!fs.existsSync(registryPath)) {
  console.error("tools-registry.json not found!");
  process.exit(1);
}

const tools = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const CATEGORY_NAMES = {
  "web-tools": "Web & SEO Tools",
  "developer-tools": "Developer & Code Tools",
  "converter-tools": "Data & Number Converters",
  "calculators": "Calculators & Financial Utilities",
  "image-tools": "Image & Media Tools",
  "text-tools": "Text & Content Analysis Tools",
  "password-tools": "Password & Security Utilities",
  "generator-tools": "Random Data & Key Generators",
  "pdf-tools": "PDF & Document Utilities",
  "date-tools": "Date, Time & Scheduling Tools",
  "random-tools": "Randomization & Game Tools",
  "home-tools": "Home & Everyday Utilities",
  "math-tools": "Math & Geometry Calculators",
  "health-tools": "Health, Fitness & Wellness Tools",
  "social-tools": "Social Media & Content Creator Tools"
};

// Group tools by category
const grouped = {};
for (const tool of tools) {
  const cat = tool.category || "other";
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push(tool);
}

let content = "# TwisterTools\n\n";
content += "> TwisterTools is a fast, 100% browser-native web utility platform providing developer, media, mathematical, and social utilities without server uploads or logins.\n\n";

for (const [catKey, catName] of Object.entries(CATEGORY_NAMES)) {
  if (grouped[catKey] && grouped[catKey].length > 0) {
    content += `## ${catName} (${catKey})\n`;
    for (const tool of grouped[catKey]) {
      const url = tool.href.startsWith("http")
        ? tool.href
        : `https://www.twistertools.com${tool.href}`;
      content += `- [${tool.title}](${url}): ${tool.description}\n`;
    }
    content += "\n";
  }
}

fs.writeFileSync(outputPath, content.trim() + "\n", "utf8");
console.log(`Successfully generated public/llms.txt with ${tools.length} tools.`);
