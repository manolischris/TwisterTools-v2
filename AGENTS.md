<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Tool Imports Policy
- When adding a new tool to `app/tools/[category]/[tool-slug]/page.tsx`, you **must** import the component dynamically using `next/dynamic` to maintain fast dev server compilation speeds and support optimal production code splitting:
  ```typescript
  const MyNewTool = dynamic(() => import("../../../../components/tools/MyNewTool"));
  ```

