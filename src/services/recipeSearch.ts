import { ALIAS_GROUPS } from '../constants/search.ts';
import type { Recipe, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
import { parseIngredientKeywords } from '../utils/ingredientKeywords.ts';

/** 별칭 그룹 확장 */
function expandAliasGroup(keyword: string, group: readonly string[]): string[] {
  return group.flatMap((alias) => {
    const isAbsent = !keyword.includes(alias);
    if (isAbsent) return [];
    return group.map((replacement) => keyword.replaceAll(alias, replacement));
  });
}

/** 검색어 확장 */
export function queryTerms(keyword: string): string[] {
  const query = normalize(keyword);
  const isEmpty = query.length === 0;
  if (isEmpty) return [];
  const aliases = ALIAS_GROUPS.flatMap((group) => expandAliasGroup(query, group));
  return [...new Set([query, ...aliases])];
}

/** 검색 키 생성 */
export const queryKey = (query: SearchQuery): string =>
  JSON.stringify([
    [...new Set(query.flavors)].sort(compareText),
    parseIngredientKeywords(query.ingredient).map(normalize).sort(compareText),
  ]);

/** 관련도 산정 */
export function rankRecipe(recipe: Recipe, terms: string[]): number {
  const hasNoTerms = terms.length === 0;
  if (hasNoTerms) return 0;
  const name = normalize(recipe.name);
  const ingredients = recipe.ingredients.map(normalize);
  const seasonings = recipe.seasonings.map(normalize);

  /** 정확 일치 */
  const exact = (value: string) => terms.includes(value);

  /** 부분 일치 */
  const partial = (value: string) => terms.some((term) => value.includes(term));

  const matches = [
    exact(name),
    partial(name),
    ingredients.some(exact),
    seasonings.some(exact),
    ingredients.some(partial),
    seasonings.some(partial),
  ];
  const rank = matches.findIndex(Boolean);
  const hasMatch = rank >= 0;
  return hasMatch ? rank : Infinity;
}

/** 복수 재료 관련도 */
function rankKeywordGroups(recipe: Recipe, groups: string[][]): number {
  const hasNoGroups = groups.length === 0;
  if (hasNoGroups) return 0;
  const ranks = groups.map((terms) => rankRecipe(recipe, terms));
  const hasMissingKeyword = ranks.some((rank) => !Number.isFinite(rank));
  if (hasMissingKeyword) return Infinity;
  return Math.min(...ranks);
}

/** 관련도 비교 */
export const compareRanked = (a: RankedRecipe, b: RankedRecipe): number =>
  a.rank - b.rank ||
  compareText(a.recipe.name, b.recipe.name) ||
  compareText(a.recipe.id, b.recipe.id);

/** 메뉴 검색 */
export function searchRecipes(
  recipes: readonly Recipe[],
  query: SearchQuery,
  sort = true,
): RankedRecipe[] {
  const groups = parseIngredientKeywords(query.ingredient).map(queryTerms);
  const found = recipes
    .filter(
      (recipe) =>
        query.flavors.length === 0 ||
        query.flavors.some((flavor) => recipe.flavors.includes(flavor)),
    )
    .map((recipe) => ({ recipe, rank: rankKeywordGroups(recipe, groups) }))
    .filter((item) => Number.isFinite(item.rank));
  return sort ? found.sort(compareRanked) : found;
}
