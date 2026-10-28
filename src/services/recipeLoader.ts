import { FETCH_TIMEOUT_MS } from '../constants/recipes.ts';
import { isRecipeIndex, isRecipeManifest } from './recipeValidation.ts';
import type { RecipeData } from '../types/recipe.ts';
let cached: Promise<RecipeData> | undefined;

/** 메뉴 데이터 로드 */
export function loadRecipes(): Promise<RecipeData> {
  cached ??= (async () => {
    const manifestResponse = await fetch('/data/manifest.json', {
      cache: 'no-cache',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const hasManifestRequestFailed = !manifestResponse.ok;
    if (hasManifestRequestFailed) throw new Error('검색 데이터 버전을 가져오지 못했어요.');
    const manifest: unknown = await manifestResponse.json();
    const hasInvalidManifest = !isRecipeManifest(manifest);
    if (hasInvalidManifest) throw new Error('검색 데이터 정보가 올바르지 않아요.');
    const response = await fetch(
      '/data/recipe_index.json?v=' + encodeURIComponent(manifest.version),
      { cache: 'force-cache', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    const hasIndexRequestFailed = !response.ok;
    if (hasIndexRequestFailed) throw new Error('검색 데이터를 가져오지 못했어요.');
    const recipes: unknown = await response.json();
    const hasInvalidIndex = !isRecipeIndex(recipes, manifest.count);
    if (hasInvalidIndex) throw new Error('검색 데이터가 올바르지 않아요. 다시 시도해 주세요.');
    return { recipes, version: manifest.version };
  })().catch((e) => {
    cached = undefined;
    throw e;
  });
  return cached;
}
