import { SUGGESTION_LIMIT } from '../constants/search.ts';
import type { Recipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
import { queryTerms } from './recipeSearch.ts';
import { getActiveKeyword, parseIngredientKeywords } from '../utils/ingredientKeywords.ts';

/** 자동완성 인덱스 */
export function buildSuggestionIndex(recipes: readonly Recipe[]): string[] {
  const unique = new Map<string, string>();
  const labels = recipes.flatMap((recipe) => [
    recipe.name,
    ...recipe.ingredients,
    ...recipe.seasonings,
  ]);
  for (const label of labels) {
    const key = normalize(label);
    const shouldSkip = !key || unique.has(key);
    if (shouldSkip) continue;
    unique.set(key, label.trim().normalize('NFC'));
  }
  return [...unique.values()];
}

/** 자동완성 관련도 */
function rankSuggestion(value: string, terms: readonly string[]): number {
  const isExact = terms.includes(value);
  if (isExact) return 0;
  const isPrefix = terms.some((term) => value.startsWith(term));
  if (isPrefix) return 1;
  const isPartial = terms.some((term) => value.includes(term));
  return isPartial ? 2 : Infinity;
}

/** 연관 검색어 추출 */
export function suggestSearchTerms(
  index: readonly string[],
  keyword: string,
  limit = SUGGESTION_LIMIT,
): string[] {
  const query = normalize(getActiveKeyword(keyword));
  const previous = parseIngredientKeywords(keyword.split(/[,，]/).slice(0, -1).join(',')).flatMap(
    queryTerms,
  );
  const cannotSuggest = !query || limit <= 0;
  if (cannotSuggest) return [];
  const terms = queryTerms(query);
  return index
    .map((label) => {
      const value = normalize(label);
      const rank = rankSuggestion(value, terms);
      return { label, value, rank };
    })
    .filter(
      (item) =>
        item.value !== query && !previous.includes(item.value) && Number.isFinite(item.rank),
    )
    .sort(
      (a, b) => a.rank - b.rank || a.label.length - b.label.length || compareText(a.label, b.label),
    )
    .slice(0, Math.floor(limit))
    .map((item) => item.label);
}
