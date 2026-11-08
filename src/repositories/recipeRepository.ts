import type { RecipeRepository } from '../types/recipeRepository.ts';
import { RecipeDataError, RecipeDataFormatError } from '../types/recipeErrors.ts';

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
/** HTTP 전송·캐시 모드·응답 파싱 전담 */
export const httpRecipeRepository: RecipeRepository = {
  async readManifest(signal, fresh) {
    return readJson(
      await fetch('/data/manifest.json', { cache: fresh ? 'reload' : 'no-cache', signal }),
    );
  },
  async readIndex(version, signal, fresh) {
    return readJson(
      await fetch('/data/recipe_index.json?v=' + encodeURIComponent(version), {
        cache: fresh ? 'reload' : 'force-cache',
        signal,
      }),
    );
  },
};
