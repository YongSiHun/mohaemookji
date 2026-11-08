import type { PreparedRecipe } from '../types/search.ts';
import { queryTerms } from './searchTerms.ts';
import type { Recipe, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
import { parseIngredientKeywords } from '../utils/ingredientKeywords.ts';

/** 검색 키 생성 */
export const queryKey = (query: SearchQuery): string =>
  JSON.stringify([
    [...new Set(query.flavors)]
      .sort(compareText)
      .map((id) => [id, query.flavorLevels?.[id] ?? null]),
    parseIngredientKeywords(query.ingredient).map(normalize).sort(compareText),
  ]);

/** 데이터 갱신 시 요리 문자열 1회 정규화 */
export function buildRecipeSearchIndex(recipes: readonly Recipe[]): PreparedRecipe[] {
  return recipes.map((recipe) => ({
    recipe,
    name: normalize(recipe.name),
    ingredients: recipe.ingredients.map(normalize),
    seasonings: recipe.seasonings.map(normalize),
  }));
}
type RankRule = (entry: PreparedRecipe, matches: (value: string) => boolean) => boolean;
const matchName: RankRule = (entry, matches) => matches(entry.name);
const matchIngredients: RankRule = (entry, matches) => entry.ingredients.some(matches);
const matchSeasonings: RankRule = (entry, matches) => entry.seasonings.some(matches);
/** 우선순위 확장: 규칙 추가 */
const rankingRules = [
  { match: matchName, exact: true },
  { match: matchName, exact: false },
  { match: matchIngredients, exact: true },
  { match: matchSeasonings, exact: true },
  { match: matchIngredients, exact: false },
  { match: matchSeasonings, exact: false },
] as const;
function rankPrepared(recipe: PreparedRecipe, terms: readonly string[]): number {
  const exact = (value: string) => terms.includes(value);
  const partial = (value: string) => terms.some((term) => value.includes(term));
  const rank = rankingRules.findIndex((rule) => rule.match(recipe, rule.exact ? exact : partial));
  return rank < 0 ? Infinity : rank;
}
/** 공개 단건 API 관련도 규칙 유지 */
export function rankRecipe(recipe: Recipe, terms: string[]): number {
  const empty = terms.length === 0;
  if (empty) return 0;
  return rankPrepared(buildRecipeSearchIndex([recipe])[0], terms);
}
/** 검색어별 이름·주재료·소스 OR · 검색어 간 AND */
function rankKeywordGroups(recipe: PreparedRecipe, groups: string[][]): number {
  let rank = Infinity;
  for (const terms of groups) {
    const current = rankPrepared(recipe, terms);
    const missing = !Number.isFinite(current);
    if (missing) return Infinity;
    rank = Math.min(rank, current);
  }
  return groups.length === 0 ? 0 : rank;
}

/** 관련도 비교 */
export const compareRanked = (a: RankedRecipe, b: RankedRecipe): number =>
  a.rank - b.rank ||
  compareText(a.recipe.name, b.recipe.name) ||
  compareText(a.recipe.id, b.recipe.id);

/** 선택 맛 AND · 지정 강도별 정확 일치 */
function matchesFlavors(recipe: Recipe, query: SearchQuery): boolean {
  return query.flavors.every((id) => {
    const level = query.flavorLevels?.[id];
    return (
      recipe.flavors.includes(id) && (level === undefined || recipe.flavorLevels?.[id] === level)
    );
  });
}

function rankEntry(
  entry: PreparedRecipe,
  query: SearchQuery,
  groups: string[][],
): RankedRecipe | undefined {
  const excluded = !matchesFlavors(entry.recipe, query);
  if (excluded) return undefined;
  const rank = rankKeywordGroups(entry, groups);
  return Number.isFinite(rank) ? { recipe: entry.recipe, rank } : undefined;
}

/** 메뉴 검색 · 준비된 인덱스 재사용 */
export function searchRecipeIndex(
  index: readonly PreparedRecipe[],
  query: SearchQuery,
  sort = true,
): RankedRecipe[] {
  const groups = parseIngredientKeywords(query.ingredient).map(queryTerms);
  const found: RankedRecipe[] = [];
  for (const entry of index) {
    const ranked = rankEntry(entry, query, groups);
    if (ranked) found.push(ranked);
  }
  return sort ? found.sort(compareRanked) : found;
}
/** 기존 호출부와 하위 호환 */
export function searchRecipes(
  recipes: readonly Recipe[],
  query: SearchQuery,
  sort = true,
): RankedRecipe[] {
  return searchRecipeIndex(buildRecipeSearchIndex(recipes), query, sort);
}
