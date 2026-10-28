import type { RankedRecipe } from '../types/recipe.ts';
import { shuffle } from '../utils/shuffle.ts';

/** 후보 무작위 정렬 */
export function shuffleRecipes(
  recipes: readonly RankedRecipe[],
  random = Math.random,
): RankedRecipe[] {
  return shuffle(recipes, random);
}
