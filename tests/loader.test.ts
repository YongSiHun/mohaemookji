import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRecipes } from '../src/services/recipeLoader.ts';
test('로딩 실패 뒤 재시도 및 동시/반복 호출 데이터 캐시', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      return new Response('', { status: 503 });
    };
    await assert.rejects(loadRecipes());
    assert.equal(calls, 1);
    for (const payload of [null, { version: '../bad', count: 0 }, { version: 'v1', count: -1 }]) {
      globalThis.fetch = async () => {
        calls++;
        return Response.json(payload);
      };
      await assert.rejects(loadRecipes());
    }
    globalThis.fetch = async (input) => {
      calls++;
      return Response.json(
        String(input).includes('manifest')
          ? { version: 'v1', count: 1 }
          : [{ name: '<script>alert(1)</script>' }],
      );
    };
    await assert.rejects(loadRecipes());
    const failedCalls = calls;
    globalThis.fetch = async (input) => {
      calls++;
      return new Response(
        JSON.stringify(String(input).includes('manifest') ? { version: 'v1', count: 0 } : []),
        { status: 200 },
      );
    };
    const [first, second] = await Promise.all([loadRecipes(), loadRecipes()]);
    assert.equal(first, second);
    assert.equal(calls, failedCalls + 2);
    assert.equal(await loadRecipes(), first);
    assert.equal(calls, failedCalls + 2);
  } finally {
    globalThis.fetch = original;
  }
});
