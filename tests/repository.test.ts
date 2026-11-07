import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeService } from '../src/services/recipeLoader.ts';
import type { RecipeRepository } from '../src/types/recipeRepository.ts';

test('주입한 저장소는 서비스별 캐시를 격리하고 동시 요청을 공유한다', async () => {
  let calls = 0;
  const repository: RecipeRepository = {
    async readManifest() {
      calls++;
      return { version: 'v1', count: 0 };
    },
    async readIndex() {
      return [];
    },
  };
  const first = createRecipeService(repository);
  const second = createRecipeService(repository);
  const [a, b] = await Promise.all([first.loadRecipes(), first.loadRecipes()]);
  assert.equal(a, b);
  assert.equal(calls, 1);
  assert.equal(first.getCachedRecipeData(), a);
  assert.equal(second.getCachedRecipeData(), undefined);
  assert.notEqual(await second.loadRecipes(), a);
  assert.equal(calls, 2);
});
test('검증 오류는 갱신 모드로 한 번 복구하고 통신 오류는 다음 호출에서 재시도한다', async () => {
  const modes: boolean[] = [];
  let offline = false;
  const repository: RecipeRepository = {
    async readManifest(_signal, fresh) {
      modes.push(fresh);
      if (offline) throw new Error('offline');
      return fresh ? { version: 'v1', count: 0 } : { version: '../invalid', count: 0 };
    },
    async readIndex() {
      return [];
    },
  };
  const service = createRecipeService(repository);
  offline = true;
  await assert.rejects(service.loadRecipes(), /offline/);
  assert.deepEqual(modes, [false]);
  offline = false;
  assert.deepEqual(await service.loadRecipes(), { recipes: [], version: 'v1' });
  assert.deepEqual(modes, [false, false, true]);
});
