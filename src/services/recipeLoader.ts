import { FETCH_TIMEOUT_MS } from '../constants/recipes.ts';
import { isRecipeIndex, isRecipeManifest } from './recipeValidation.ts';
import type { RecipeData, RecipeManifest, Recipe } from '../types/recipe.ts';
let cached: Promise<RecipeData> | undefined;
let resolved: RecipeData | undefined;

export class RecipeDataError extends Error {}
class RecipeDataFormatError extends RecipeDataError {}
export const getCachedRecipeData = (): RecipeData | undefined => resolved;

async function readJson(response: Response): Promise<unknown> {
  const failed = !response.ok;
  if (failed)
    throw new RecipeDataError('요리 데이터 요청에 실패했어요. 연결을 확인하고 다시 시도해 주세요.');
  const html = response.headers.get('content-type')?.includes('text/html');
  if (html)
    throw new RecipeDataFormatError(
      '요리 데이터 대신 다른 페이지가 응답했어요. 접속 주소와 개발 서버를 확인해 주세요.',
    );
  try {
    return await response.json();
  } catch (error) {
    const invalidJson = error instanceof SyntaxError;
    if (invalidJson)
      throw new RecipeDataFormatError('요리 데이터 형식이 올바르지 않아요. 다시 불러와 주세요.');
    throw error;
  }
}
async function fetchData(signal: AbortSignal, fresh: boolean): Promise<RecipeData> {
  const manifest: unknown = await readJson(
    await fetch('/data/manifest.json', { cache: fresh ? 'reload' : 'no-cache', signal }),
  );
  const invalidManifest = !isRecipeManifest(manifest);
  if (invalidManifest) throw new RecipeDataFormatError('검색 데이터 버전 정보가 올바르지 않아요.');
  return fetchIndex(manifest, signal, fresh);
}
async function fetchIndex(
  manifest: RecipeManifest,
  signal: AbortSignal,
  fresh: boolean,
): Promise<RecipeData> {
  const recipes: unknown = await readJson(
    await fetch('/data/recipe_index.json?v=' + encodeURIComponent(manifest.version), {
      cache: fresh ? 'reload' : 'force-cache',
      signal,
    }),
  );
  const invalidIndex = !isRecipeIndex(recipes, manifest.count);
  if (invalidIndex)
    throw new RecipeDataFormatError('검색 데이터가 최신 버전과 맞지 않아요. 다시 불러와 주세요.');
  return { recipes: recipes as Recipe[], version: manifest.version };
}
async function loadWithRecovery(signal: AbortSignal): Promise<RecipeData> {
  try {
    return await fetchData(signal, false);
  } catch (error) {
    const recoverable = error instanceof RecipeDataFormatError && !signal.aborted;
    if (recoverable) return fetchData(signal, true);
    throw error;
  }
}
/** 동시 요청 공유. 잘못 캐시된 HTML·JSON만 한 번 갱신하고 전체 대기를 제한한다. */
export function loadRecipes(): Promise<RecipeData> {
  cached ??= (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      resolved = await loadWithRecovery(controller.signal);
      return resolved;
    } finally {
      clearTimeout(timer);
    }
  })().catch((error: unknown) => {
    cached = undefined;
    throw error;
  });
  return cached;
}
