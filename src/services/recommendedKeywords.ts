import {
  RECOMMENDED_KEYWORD_COUNT,
  RECOMMENDATION_POOL_LIMIT,
  MIN_KEYWORD_RECIPE_COUNT,
  EXCLUDED_RECOMMENDATION_KEYWORDS,
} from '../constants/search.ts';
import type { KeywordFrequency } from '../types/search.ts';
import { shuffle } from '../utils/shuffle.ts';
import type { Recipe } from '../types/recipe.ts';
import { compareText, normalize } from '../utils/normalize.ts';

/** 추천 가능한 재료 추출 */
function getRecipeKeywords(recipe: Recipe): Map<string, string> {
  const keywords = new Map<string, string>();
  for (const label of [...recipe.ingredients, ...recipe.seasonings]) {
    const key = normalize(label);
    const shouldSkip = !key || EXCLUDED_RECOMMENDATION_KEYWORDS.has(key);
    if (shouldSkip) continue;
    keywords.set(key, label.trim().normalize('NFC'));
  }
  return keywords;
}

/** 추천어 풀 생성 */
export function buildRecommendationPool(recipes: readonly Recipe[]): string[] {
  const counts = new Map<string, KeywordFrequency>();
  for (const recipe of recipes) {
    const keywords = getRecipeKeywords(recipe);
    for (const [key, label] of keywords) {
      const current = counts.get(key);
      counts.set(key, { label, count: (current?.count ?? 0) + 1 });
    }
  }
  const ordered = [...counts.values()].sort(
    (a, b) => b.count - a.count || compareText(a.label, b.label),
  );
  const frequent = ordered.filter((item) => item.count >= MIN_KEYWORD_RECIPE_COUNT);
  return (frequent.length >= RECOMMENDED_KEYWORD_COUNT ? frequent : ordered)
    .slice(0, RECOMMENDATION_POOL_LIMIT)
    .map((item) => item.label);
}

/** 추천어 추출 */
export function pickRecommendedKeywords(
  pool: readonly string[],
  count = RECOMMENDED_KEYWORD_COUNT,
  previous: readonly string[] = [],
  random: () => number = Math.random,
): string[] {
  const unique = [...new Set(pool)];
  const fresh = unique.filter((keyword) => !previous.includes(keyword));
  const hasEnoughFresh = fresh.length >= count;
  const candidates = shuffle(hasEnoughFresh ? fresh : unique, random);
  return candidates.slice(0, Math.max(0, Math.floor(count)));
}
