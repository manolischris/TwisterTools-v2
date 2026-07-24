const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');
const pagePath = path.join(projectDir, 'app/tools/[category]/[tool-slug]/page.tsx');
const registryPath = path.join(projectDir, 'lib/tools-registry.json');
const statePath = path.join(projectDir, 'project-state.json');

const pageContent = fs.readFileSync(pagePath, 'utf8');

// Find COMPLETED_TOOLS array content
const completedToolsMatch = pageContent.match(/const COMPLETED_TOOLS = \[\s*([\s\S]*?)\s*\];/);
if (!completedToolsMatch) {
  console.log('Could not find COMPLETED_TOOLS in page.tsx');
  process.exit(1);
}

const completedTools = completedToolsMatch[1]
  .split(',')
  .map(s => s.trim().replace(/"/g, '').replace(/'/g, ''))
  .filter(s => s.length > 0);

console.log('COMPLETED_TOOLS count in page.tsx:', completedTools.length);

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
console.log('tools-registry.json count:', registry.length);

const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
console.log('project-state.json completed list count:', state.tools_completed.list.length);

// Compare lists
console.log('\n--- COMPLETED_TOOLS slugs: ---');
console.log(completedTools.join(', '));

console.log('\n--- project-state.json completed slugs: ---');
const stateSlugs = state.tools_completed.list.map(t => t.slug);
console.log(stateSlugs.join(', '));

console.log('\n--- tools-registry.json slugs: ---');
const registrySlugs = registry.map(t => t.id);
console.log(registrySlugs.join(', '));

// Tools in COMPLETED_TOOLS but not in state:
const inPageButNotState = completedTools.filter(s => !stateSlugs.includes(s));
console.log('\nIn COMPLETED_TOOLS but not in project-state.json completed list:', inPageButNotState);

// Tools in state but not in COMPLETED_TOOLS:
const inStateButNotPage = stateSlugs.filter(s => !completedTools.includes(s));
console.log('\nIn project-state.json completed list but not in COMPLETED_TOOLS:', inStateButNotPage);

// Tools in registry but not in COMPLETED_TOOLS:
const inRegistryButNotPage = registrySlugs.filter(s => !completedTools.includes(s));
console.log('\nIn registry but not in COMPLETED_TOOLS:', inRegistryButNotPage);
