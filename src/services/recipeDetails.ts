import type { Recipe } from '../types/recipe.ts';
import { normalize } from '../utils/normalize.ts';
import { cuisineNames } from '../constants/cuisines.ts';

export const difficultyNames = { easy: '쉬움', medium: '보통', hard: '어려움' } as const;
export const getRecipeSlug = (recipe: Recipe): string => recipe.slug ?? recipe.id;
export const getRecipePath = (recipe: Recipe): string =>
  '/recipes/' + encodeURIComponent(getRecipeSlug(recipe)) + '/';
export function findRecipeByPath(recipes: readonly Recipe[], path: string): Recipe | undefined {
  return recipes.find(
    (recipe) => getRecipePath(recipe) === (path.endsWith('/') ? path : path + '/'),
  );
}
export function getRecipeMetadata(recipe: Recipe) {
  return {
    path: getRecipePath(recipe),
    title:
      recipe.name + (recipe.content ? ' 재료와 조리법 | 모해묵지' : ' 재료와 메뉴 안내 | 모해묵지'),
    description: (
      recipe.content?.introduction ??
      recipe.description ??
      recipe.name +
        '의 대표 재료 ' +
        recipe.ingredients.join(', ') +
        '과 맛의 특징을 확인하고 관련 메뉴를 비교해보세요.'
    )
      .replace(/\s+/g, ' ')
      .slice(0, 155),
  };
}
interface RelatedEntry {
  recipe: Recipe;
  ingredients: Set<string>;
  flavors: Set<string>;
}
// 읽기 전용 JSON 목록은 데이터 갱신 시 새 배열로 교체된다. 이전 목록은 GC 대상이다.
const relatedIndexes = new WeakMap<readonly Recipe[], Map<Recipe, RelatedEntry>>();
function prepareRelated(recipe: Recipe): RelatedEntry {
  return {
    recipe,
    ingredients: new Set(recipe.ingredients.map(normalize)),
    flavors: new Set(recipe.flavors.map(normalize)),
  };
}
function getRelatedIndex(recipes: readonly Recipe[]): Map<Recipe, RelatedEntry> {
  let index = relatedIndexes.get(recipes);
  const missing = !index;
  if (missing) {
    const unique = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    index = new Map([...unique.values()].map((recipe) => [recipe, prepareRelated(recipe)]));
    relatedIndexes.set(recipes, index);
  }
  return index!;
}
function sharedCount(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let count = 0;
  for (const value of a) count += Number(b.has(value));
  return count;
}
function relatedScore(current: RelatedEntry, candidate: RelatedEntry): number {
  return (
    sharedCount(current.ingredients, candidate.ingredients) * 3 +
    sharedCount(current.flavors, candidate.flavors) * 2 +
    Number(current.recipe.cuisine === candidate.recipe.cuisine) +
    Number(
      Boolean(current.recipe.category) && current.recipe.category === candidate.recipe.category,
    )
  );
}
interface ScoredRecipe {
  recipe: Recipe;
  score: number;
}
const compareRelated = (a: ScoredRecipe, b: ScoredRecipe) =>
  b.score - a.score || a.recipe.id.localeCompare(b.recipe.id, 'en');
function insertRelated(best: ScoredRecipe[], entry: ScoredRecipe, limit: number): void {
  const position = best.findIndex((item) => compareRelated(entry, item) < 0);
  const shouldAppend = position < 0;
  const insertAt = shouldAppend ? best.length : position;
  const outsideLimit = insertAt >= limit;
  if (outsideLimit) return;
  best.splice(insertAt, 0, entry);
  best.length = Math.min(best.length, limit);
}
export function getRelatedRecipes(
  current: Recipe,
  recipes: readonly Recipe[],
  limit = 4,
): Recipe[] {
  const count = Math.max(0, Math.floor(limit));
  const empty = count === 0;
  if (empty) return [];
  const index = getRelatedIndex(recipes);
  const prepared = index.get(current) ?? prepareRelated(current);
  const best: ScoredRecipe[] = [];
  for (const candidate of index.values()) {
    const same = candidate.recipe.id === current.id;
    if (same) continue;
    const score = relatedScore(prepared, candidate);
    const related = score > 0;
    if (related) insertRelated(best, { recipe: candidate.recipe, score }, count);
  }
  return best.map(({ recipe }) => recipe);
}

/** 사용 권한이 기재된 사진·조리 본문·실제 origin이 있을 때만 Recipe 출력 */
export function getRecipeStructuredData(recipe: Recipe, origin: string) {
  const content = recipe.content;
  const image = recipe.image;
  const unavailable = !content || !image || !origin;
  if (unavailable) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: content.introduction,
    image: [new URL(image.src, origin).href],
    url: origin + getRecipePath(recipe),
    recipeCuisine: cuisineNames[recipe.cuisine],
    recipeYield: content.servings,
    ...(content.totalMinutes ? { totalTime: 'PT' + content.totalMinutes + 'M' } : {}),
    recipeIngredient: [...content.ingredients, ...content.seasonings].map(
      (item) =>
        item.name + (item.amount ? ' ' + item.amount : '') + (item.optional ? ' (선택)' : ''),
    ),
    recipeInstructions: content.steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
      url: origin + getRecipePath(recipe) + '#step-' + (i + 1),
    })),
    citation: content.sources.map((source) => source.url),
  };
}
export const serializeStructuredData = (value: unknown): string =>
  JSON.stringify(value).replaceAll('<', '\\u003c');
