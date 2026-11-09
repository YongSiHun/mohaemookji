import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { isFlavorLevels } from '../src/services/flavorLevels.ts';
import { isRecipeIndex } from '../src/services/recipeValidation.ts';
import { validateSources } from '../scripts/validate-recipes.ts';
import type { Recipe } from '../src/types/recipe.ts';

const recipe: Recipe = {
  id: 'flavor-test',
  name: '맛 테스트',
  cuisine: 'korean',
  flavors: ['spicy', 'savory'],
  flavorLevels: { spicy: 1, savory: 5 },
  ingredients: ['두부'],
  seasonings: ['고추장'],
};
const source = (value: unknown) => [
  {
    cuisine: 'korean',
    categories: { tofu: { name: '두부', recipes: [value] } },
  },
];

test('맛 강도는 등록된 태그별 1~5 정수이며 빌드와 로더에서 검증한다', () => {
  assert.equal(isFlavorLevels(recipe.flavorLevels, recipe.flavors), true);
  assert.equal(isFlavorLevels(undefined, recipe.flavors), true);
  const parsed = validateSources(source(recipe), recipe.flavors);
  assert.deepEqual(parsed[0].flavorLevels, recipe.flavorLevels);
  assert.equal(isRecipeIndex(parsed, 1), true);
  for (const flavorLevels of [
    null,
    [],
    {},
    { spicy: 1 },
    { spicy: 0, savory: 5 },
    { spicy: 6, savory: 5 },
    { spicy: 2.5, savory: 5 },
    { spicy: '3', savory: 5 },
    { spicy: 3, savory: 5, unknown: 2 },
    { spicy: NaN, savory: 5 },
  ]) {
    assert.equal(isFlavorLevels(flavorLevels, recipe.flavors), false);
    assert.equal(isRecipeIndex([{ ...recipe, flavorLevels }], 1), false);
    assert.throws(() => validateSources(source({ ...recipe, flavorLevels }), recipe.flavors));
  }
});

test('전체 메뉴 인덱스의 모든 맛에 강도가 저장되어 있다', async () => {
  const recipes = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  assert.equal(recipes.length, 2520);
  for (const item of recipes) {
    assert.ok(item.flavorLevels, item.id);
    assert.equal(isFlavorLevels(item.flavorLevels, item.flavors), true, item.id);
  }
});

test('카드와 상세 화면은 강도를 별 다섯 칸과 접근성 설명으로 표시한다', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  });
  try {
    const { FlavorRatings } = await server.ssrLoadModule('/src/components/FlavorRatings.tsx');
    const html = renderToStaticMarkup(createElement(FlavorRatings, { recipe }));
    assert.match(html, /매운 맛 강도 1\/5/);
    assert.match(html, /고소한 맛 강도 5\/5/);
    assert.match(html, /★★★★★/);
    assert.match(html, /☆☆☆☆/);
    assert.equal((html.match(/★/g) ?? []).length, 6);
    assert.equal((html.match(/☆/g) ?? []).length, 4);
    const legacy = renderToStaticMarkup(
      createElement(FlavorRatings, { recipe: { ...recipe, flavorLevels: undefined } }),
    );
    assert.doesNotMatch(legacy, /★|☆|undefined/);
    for (const [path, name] of [
      ['/src/components/RecipeCard.tsx', 'RecipeCard'],
      ['/src/pages/RecipeDetail.tsx', 'RecipeDetail'],
    ]) {
      const component = (await server.ssrLoadModule(path))[name];
      const page = renderToStaticMarkup(
        createElement(component, { recipe, recipes: [], keyword: '' }),
      );
      assert.match(page, /고소한 맛 강도 5\/5/);
    }
  } finally {
    await server.close();
  }
});
