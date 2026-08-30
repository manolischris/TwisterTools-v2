/**
 * Shared search ranking engine for TwisterTools 2.0
 *
 * Provides a weighted relevance scoring system that prioritises
 * exact and word-boundary title matches over description hits.
 */

export interface SearchableTool {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  iconName: string;
  isFeatured?: boolean;
}

/**
 * Rank an array of tools against a free-text query.
 *
 * Scoring tiers (cumulative):
 *   +1500  Exact title match
 *   +1000  Title starts with query
 *    +600  Title matches at a word boundary
 *    +300  Title contains query as substring
 *    +150  Category starts with / matches query
 *     +80  Description matches at a word boundary
 *     +20  Description contains query as substring
 *
 * Returns only tools with score > 0, sorted descending.
 * Ties broken by isFeatured (desc) then title length (shorter first).
 */
export function rankTools<T extends SearchableTool>(
  tools: T[],
  rawQuery: string
): T[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  // Escape special regex characters, then build a word-boundary pattern
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundaryRegex = new RegExp(`\\b${escaped}`, "i");

  const scored = tools
    .map((tool) => {
      let score = 0;
      const titleLower = tool.title.toLowerCase();
      const descLower = tool.description.toLowerCase();
      const catLower = tool.category.toLowerCase();

      // ── Title scoring ──────────────────────────────────
      if (titleLower === q) {
        score += 1500;
      }
      if (titleLower.startsWith(q)) {
        score += 1000;
      }
      if (wordBoundaryRegex.test(tool.title)) {
        score += 600;
      }
      if (titleLower.includes(q)) {
        score += 300;
      }

      // ── Category scoring ───────────────────────────────
      if (catLower === q || catLower.startsWith(q)) {
        score += 150;
      }

      // ── Description scoring ────────────────────────────
      if (wordBoundaryRegex.test(tool.description)) {
        score += 80;
      }
      if (descLower.includes(q)) {
        score += 20;
      }

      return { tool, score };
    })
    .filter((entry) => entry.score > 0);

  // Sort: highest score first → featured first → shorter title first
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const aFeatured = a.tool.isFeatured ? 1 : 0;
    const bFeatured = b.tool.isFeatured ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    return a.tool.title.length - b.tool.title.length;
  });

  return scored.map((entry) => entry.tool);
}
