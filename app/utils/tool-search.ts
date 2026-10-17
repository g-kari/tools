/** A tool's existing public catalog fields; no input or usage data is searched. */
interface SearchableTool {
  label: string;
  description: string;
  path: string;
}

/**
 * Build one local, literal AND matcher for the catalog and command search.
 * NFKC treats full-width Latin text and half-width kana like their usual forms.
 * Each whitespace-separated term may match any field, but never spans fields.
 * Blank queries return null so each caller keeps its existing default results.
 */
export function createToolSearchMatcher(
  query: string,
): ((tool: SearchableTool, categoryName: string) => boolean) | null {
  const normalized = query.normalize("NFKC").toLowerCase().trim();
  if (!normalized) return null;
  const terms = normalized.split(/\s+/u);
  return (tool, categoryName) => {
    const fields = [tool.label, tool.description, tool.path, categoryName].map((field) =>
      field.normalize("NFKC").toLowerCase(),
    );
    return terms.every((term) => fields.some((field) => field.includes(term)));
  };
}
