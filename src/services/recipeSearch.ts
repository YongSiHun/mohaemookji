import type { PreparedRecipe } from '../types/search.ts';
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
    [...new Set(query.flavors)]
      .sort(compareText)
      .map((id) => [id, query.flavorLevels?.[id] ?? null]),
    parseIngredientKeywords(query.ingredient).map(normalize).sort(compareText),
  ]);

/** 요리 문자열은 데이터가 바뀔 때 한 번만 정규화한다. */
export function buildRecipeSearchIndex(recipes: readonly Recipe[]): PreparedRecipe[] {
  return recipes.map((recipe) => ({
    recipe,
    name: normalize(recipe.name),
    ingredients: recipe.ingredients.map(normalize),
    seasonings: recipe.seasonings.map(normalize),
  }));
}
function rankPrepared(recipe: PreparedRecipe, terms: readonly string[]): number {
  const exact = (value: string) => terms.includes(value);
  const partial = (value: string) => terms.some((term) => value.includes(term));
  const nameExact = exact(recipe.name);
  if (nameExact) return 0;
  const namePartial = partial(recipe.name);
  if (namePartial) return 1;
  const ingredientExact = recipe.ingredients.some(exact);
  if (ingredientExact) return 2;
  const seasoningExact = recipe.seasonings.some(exact);
  if (seasoningExact) return 3;
  const ingredientPartial = recipe.ingredients.some(partial);
  if (ingredientPartial) return 4;
  const seasoningPartial = recipe.seasonings.some(partial);
  return seasoningPartial ? 5 : Infinity;
}
/** 공개 단건 API의 관련도 규칙은 유지한다. */
export function rankRecipe(recipe: Recipe, terms: string[]): number {
  const empty = terms.length === 0;
  if (empty) return 0;
  return rankPrepared(buildRecipeSearchIndex([recipe])[0], terms);
}
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

function matchesFlavors(recipe: Recipe, query: SearchQuery): boolean {
  const unrestricted = query.flavors.length === 0;
  if (unrestricted) return true;
  return query.flavors.some((id) => {
    const level = query.flavorLevels?.[id];
    return (
      recipe.flavors.includes(id) && (level === undefined || recipe.flavorLevels?.[id] === level)
    );
  });
}

/** 준비된 인덱스를 재사용하는 메뉴 검색 */
export function searchRecipeIndex(
  index: readonly PreparedRecipe[],
  query: SearchQuery,
  sort = true,
): RankedRecipe[] {
  const groups = parseIngredientKeywords(query.ingredient).map(queryTerms);
  const found = index
    .filter(({ recipe }) => matchesFlavors(recipe, query))
    .map((entry) => ({ recipe: entry.recipe, rank: rankKeywordGroups(entry, groups) }))
    .filter((item) => Number.isFinite(item.rank));
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
