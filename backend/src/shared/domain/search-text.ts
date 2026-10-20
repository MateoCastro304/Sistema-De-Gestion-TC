export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

export function matchesSearch(search: string | undefined, fields: string[]): boolean {
  const terms = normalizeSearchText(search ?? '')
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = fields.map(normalizeSearchText);
  return terms.every((term) => haystack.some((field) => field.includes(term)));
}
