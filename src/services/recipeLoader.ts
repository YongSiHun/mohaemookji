import { FETCH_TIMEOUT_MS } from '../constants/recipes.ts';
import { isRecipeIndex, isRecipeManifest } from './recipeValidation.ts';
import type { RecipeData } from '../types/recipe.ts';
import type { RecipeRepository } from '../types/recipeRepository.ts';
import { RecipeDataFormatError } from '../types/recipeErrors.ts';
import { httpRecipeRepository } from '../repositories/recipeRepository.ts';
export { RecipeDataError } from '../types/recipeErrors.ts';

async function fetchData(
  repository: RecipeRepository,
  signal: AbortSignal,
  fresh: boolean,
): Promise<RecipeData> {
  const manifest = await repository.readManifest(signal, fresh);
  const invalidManifest = !isRecipeManifest(manifest);
  if (invalidManifest) throw new RecipeDataFormatError('검색 데이터 버전 정보가 올바르지 않아요.');
  const recipes = await repository.readIndex(manifest.version, signal, fresh);
  const invalidIndex = !isRecipeIndex(recipes, manifest.count);
  if (invalidIndex)
    throw new RecipeDataFormatError('검색 데이터가 최신 버전과 맞지 않아요. 다시 불러와 주세요.');
  return { recipes, version: manifest.version };
}
async function loadWithRecovery(
  repository: RecipeRepository,
  signal: AbortSignal,
): Promise<RecipeData> {
  try {
    return await fetchData(repository, signal, false);
  } catch (error) {
    const recoverable = error instanceof RecipeDataFormatError && !signal.aborted;
    if (recoverable) return fetchData(repository, signal, true);
    throw error;
  }
}
/** 저장소별 캐시를 격리하고 동시 요청·형식 오류 복구·시간 제한을 관리한다. */
export function createRecipeService(repository: RecipeRepository) {
  let cached: Promise<RecipeData> | undefined;
  let resolved: RecipeData | undefined;
  async function load(): Promise<RecipeData> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      resolved = await loadWithRecovery(repository, controller.signal);
      return resolved;
    } finally {
      clearTimeout(timer);
    }
  }
  function loadRecipes(): Promise<RecipeData> {
    cached ??= load().catch((error: unknown) => {
      cached = undefined;
      throw error;
    });
    return cached;
  }
  return { loadRecipes, getCachedRecipeData: (): RecipeData | undefined => resolved };
}
const recipeService = createRecipeService(httpRecipeRepository);
export const { loadRecipes, getCachedRecipeData } = recipeService;
