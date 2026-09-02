const fs = require('fs');
const files = [
  'app/page.tsx',
  'app/tools/[category]/page.tsx',
  'components/tools/ToolsDirectoryClient.tsx',
  'components/tools/CategoryToolSearchGrid.tsx',
  'components/RelatedTools.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // Add PenTool to imports if not there
    if (!content.includes('PenTool,') && content.includes('from "lucide-react"')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+["']lucide-react["']/, (match, p1) => {
        return `import { ${p1.trim()}, PenTool } from "lucide-react"`;
      });
      changed = true;
    }

    // Add PenTool to ICON_MAP if not there
    if (!content.includes('PenTool: PenTool') && !content.includes('PenTool,') && (content.includes('const ICON_MAP') || content.includes('const SERVER_ICON_MAP'))) {
      content = content.replace(/(const (SERVER_ICON_MAP|ICON_MAP): Record<string, [^>]+> = {)/, '$1\n  PenTool,');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
