import type { Recipe } from '../types/recipe.ts';
import { normalize } from '../utils/normalize.ts';

interface RelatedEntry {
  recipe: Recipe;
  ingredients: Set<string>;
  flavors: Set<string>;
}
// 읽기 전용 JSON 목록: 갱신 시 새 배열 교체 · 이전 배열 GC
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
function scoreCandidate(current: RelatedEntry, candidate: RelatedEntry): ScoredRecipe | undefined {
  const same = candidate.recipe.id === current.recipe.id;
  if (same) return undefined;
  const score = relatedScore(current, candidate);
  return score > 0 ? { recipe: candidate.recipe, score } : undefined;
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
    const entry = scoreCandidate(prepared, candidate);
    const matched = entry !== undefined;
    if (matched) insertRelated(best, entry, count);
  }
  return best.map(({ recipe }) => recipe);
}
