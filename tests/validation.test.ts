import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isRecipeManifest, isRecipeIndex } from '../src/services/recipeValidation.ts';

test('잘못된 버전 정보와 과도한 데이터 개수를 거부한다', () => {
  for (const value of [
    null,
    [],
    {},
    { version: '../file', count: 1 },
    { version: 'v1', count: -1 },
    { version: 'v1', count: 0.5 },
    { version: 'v1', count: 20001 },
  ])
    assert.equal(isRecipeManifest(value), false);
  assert.equal(isRecipeManifest({ version: 'abc-12.3', count: 2000 }), true);
});

test('실제 인덱스는 통과하고 오염된 필드·중복 ID·개수 불일치를 거부한다', async () => {
  const recipes = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  );
  assert.equal(isRecipeIndex(recipes, recipes.length), true);
  const valid = recipes[0];
  for (const patch of [
    { ingredients: '<img>' },
    { seasonings: [null] },
    { flavors: ['unknown'] },
    { cuisine: '__proto__' },
    { name: 'x'.repeat(257) },
    { id: '' },
  ])
    assert.equal(isRecipeIndex([{ ...valid, ...patch }], 1), false);
  assert.equal(isRecipeIndex([valid, valid], 2), false);
  assert.equal(isRecipeIndex([valid], 2), false);
  assert.equal(isRecipeIndex(null, 0), false);
});
