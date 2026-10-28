import type { Recipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
import { queryTerms } from './recipeSearch.ts';

export function buildSuggestionIndex(recipes: readonly Recipe[]): string[] {
  const unique = new Map<string, string>();
  for (const recipe of recipes) {
    for (const label of [recipe.name, ...recipe.ingredients, ...recipe.seasonings]) {
      const key = normalize(label);
      if (key && !unique.has(key)) unique.set(key, label.trim().normalize('NFC'));
    }
  }
  return [...unique.values()];
}

export function suggestSearchTerms(index: readonly string[], keyword: string, limit = 6): string[] {
  const query = normalize(keyword);
  if (!query || limit <= 0) return [];
  const terms = queryTerms(query);
  return index.map(label => {
    const value = normalize(label);
    const rank = terms.some(term => value === term) ? 0
      : terms.some(term => value.startsWith(term)) ? 1
      : terms.some(term => value.includes(term)) ? 2 : Infinity;
    return { label, value, rank };
  }).filter(item => item.value !== query && Number.isFinite(item.rank))
    .sort((a, b) => a.rank - b.rank || a.label.length - b.label.length || compareText(a.label, b.label))
    .slice(0, Math.floor(limit)).map(item => item.label);
}
