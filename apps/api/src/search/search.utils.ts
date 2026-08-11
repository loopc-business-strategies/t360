export type SynonymRow = { term: string; aliases: string[] };

/** Expand query tokens using synonym map (term ↔ aliases). */
export function expandSearchQuery(q: string, synonyms: SynonymRow[]): string {
  const raw = q.trim();
  if (!raw) return raw;

  const map = new Map<string, Set<string>>();
  for (const s of synonyms) {
    const group = new Set<string>([s.term.toLowerCase(), ...s.aliases.map((a) => a.toLowerCase())]);
    for (const token of group) {
      const existing = map.get(token) ?? new Set<string>();
      for (const g of group) existing.add(g);
      map.set(token, existing);
    }
  }

  const tokens = raw.split(/\s+/).filter(Boolean);
  const expanded: string[] = [];
  for (const t of tokens) {
    const key = t.toLowerCase();
    const alts = map.get(key);
    if (alts && alts.size > 1) {
      expanded.push(`(${[...alts].join(" OR ")})`);
    } else {
      expanded.push(t);
    }
  }
  return expanded.join(" ");
}
