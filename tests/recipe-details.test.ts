import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { validateSources } from '../scripts/validate-recipes.ts';
import { isRecipeIndex } from '../src/services/recipeValidation.ts';
import { isRecipeContent, isRecipeImage } from '../src/services/recipeContentValidation.ts';
import {
  getRecipePath,
  findRecipeByPath,
  getRelatedRecipes,
  getRecipeMetadata,
  getRecipeStructuredData,
  serializeStructuredData,
} from '../src/services/recipeDetails.ts';
import type { Recipe, RecipeContent } from '../src/types/recipe.ts';

const content: RecipeContent = {
  introduction: '두부와 양념을 비교하는 테스트용 조리 예시입니다.',
  difficulty: 'easy',
  totalMinutes: 15,
  servings: '2인분',
  ingredients: [{ name: '두부', amount: '1모' }],
  seasonings: [{ name: '간장', amount: '1큰술' }],
  steps: ['두부를 준비합니다.', '양념과 함께 조리합니다.'],
  sources: [{ name: '테스트 자료', url: 'https://example.invalid/recipe' }],
};
const make = (id: string, patch: Partial<Recipe> = {}): Recipe => ({
  id,
  name: id,
  cuisine: 'korean',
  flavors: ['spicy'],
  ingredients: ['두부'],
  seasonings: ['간장'],
  ...patch,
});
const source = (recipes: Recipe[]) => ({
  cuisine: 'korean',
  categories: { tofu: { name: '두부', recipes } },
});

test('기존 ID를 경로로 유지하고 명시적 slug는 ID를 바꾸지 않는다', () => {
  const legacy = make('legacy_id');
  const detailed = make('original_id', { slug: 'stable-url', content });
  assert.equal(getRecipePath(legacy), '/recipes/legacy_id/');
  assert.equal(getRecipePath(detailed), '/recipes/stable-url/');
  assert.equal(findRecipeByPath([detailed], '/recipes/stable-url')?.id, 'original_id');
  assert.equal(findRecipeByPath([detailed], '/recipes/missing/'), undefined);
  const parsed = validateSources([source([legacy, detailed])], ['spicy']);
  assert.equal(parsed[0].content, undefined);
  assert.deepEqual(parsed[1].content, content);
  assert.equal(isRecipeIndex(parsed, 2), true);
});

test('slug 충돌·상세 타입 오염·위험한 URL·권리 정보 없는 이미지를 거부한다', () => {
  assert.throws(() =>
    validateSources([source([make('same'), make('other', { slug: 'same' })])], ['spicy']),
  );
  assert.throws(() => validateSources([source([make('a', { slug: '../outside' })])], ['spicy']));
  for (const patch of [
    { difficulty: 'unknown' },
    { totalMinutes: -1 },
    { totalMinutes: 1.5 },
    { steps: [] },
    { ingredients: [] },
    { sources: [] },
    { sources: [{ name: 'bad', url: 'javascript:alert(1)' }] },
    { servings: '' },
    { tips: [''] },
    { storage: 23 },
  ]) {
    assert.equal(isRecipeContent({ ...content, ...patch }), false);
    assert.throws(() =>
      validateSources(
        [source([make('a', { content: { ...content, ...patch } as RecipeContent })])],
        ['spicy'],
      ),
    );
  }
  assert.equal(isRecipeContent(content), true);
  assert.equal(isRecipeImage({ src: 'https://external.invalid/food.jpg', alt: '사진' }), false);
  assert.equal(isRecipeImage({ src: '/food.jpg', alt: '사진' }), false);
  assert.equal(isRecipeIndex([make('same'), make('different', { slug: 'same' })], 2), false);
});

test('관련 메뉴는 자기 자신·중복을 제외하고 재료가 겹치는 메뉴를 우선한다', () => {
  const current = make('current');
  const match = make('match');
  const flavorOnly = make('flavor', { ingredients: ['감자'], cuisine: 'western' });
  const unrelated = make('other', {
    ingredients: ['우유'],
    flavors: ['sweet'],
    cuisine: 'western',
  });
  const data = [current, flavorOnly, match, match, unrelated];
  assert.deepEqual(
    getRelatedRecipes(current, data).map((r) => r.id),
    ['match', 'flavor'],
  );
  assert.deepEqual(
    getRelatedRecipes(current, data, 1).map((r) => r.id),
    ['match'],
  );
  assert.deepEqual(getRelatedRecipes(current, data, 0), []);
});

test('실제 계량·단계·사진이 갖춰진 경우만 Recipe JSON-LD를 만들고 스크립트 종료 문자를 이스케이프한다', () => {
  const recipe = make('test', { content });
  assert.equal(getRecipeStructuredData(recipe, 'https://example.invalid'), undefined);
  const image = {
    src: '/images/test.jpg',
    alt: '완성 요리',
    credit: '테스트 제작자',
    sourceUrl: 'https://example.invalid/source',
    license: '테스트 허가',
    licenseUrl: 'https://example.invalid/license',
  };
  const complete = { ...recipe, image };
  assert.equal(isRecipeImage(image), true);
  const structured = getRecipeStructuredData(complete, 'https://example.invalid');
  assert.equal(structured?.['@type'], 'Recipe');
  assert.equal(structured?.totalTime, 'PT15M');
  assert.deepEqual(
    structured?.recipeInstructions.map((s) => s.text),
    content.steps,
  );
  assert.deepEqual(structured?.image, ['https://example.invalid/images/test.jpg']);
  assert.equal(getRecipeStructuredData(complete, ''), undefined);
  const json = serializeStructuredData({ description: '</script><script>alert(1)</script>' });
  assert.ok(!json.includes('<'));
  assert.equal(JSON.parse(json).description, '</script><script>alert(1)</script>');
  assert.ok(!JSON.stringify(structured).includes('aggregateRating'));
  assert.ok(!JSON.stringify(structured).includes('nutrition'));
});

test('대표 3종과 기존 요리 모두 상세 화면에서 렌더링하며 없는 선택 항목을 숨긴다', async () => {
  const recipes = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  assert.equal(recipes.length, 2100);
  assert.equal(recipes.filter((r) => r.content).length, 3);
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  });
  try {
    const { RecipeDetail } = await server.ssrLoadModule('/src/pages/RecipeDetail.tsx');
    for (const id of ['kimchi_rice', 'tomato_egg', 'aglio_olio']) {
      const recipe = recipes.find((r) => r.id === id)!;
      const html = renderToStaticMarkup(createElement(RecipeDetail, { recipe, recipes }));
      assert.equal((html.match(/<h1/g) ?? []).length, 1);
      assert.match(html, /만드는 순서/);
      assert.match(html, /참고한 조리 자료/);
      assert.match(html, /함께 비교할 메뉴/);
      assert.match(html, /target="_blank"/);
      assert.match(html, /rel="noopener noreferrer"/);
      assert.ok(html.includes('https://www.youtube.com/results?search_query='));
      assert.ok(html.includes(getRecipePath(getRelatedRecipes(recipe, recipes)[0])));
      assert.ok(getRecipeMetadata(recipe).title.includes(recipe.name));
    }
    const legacy = recipes.find((r) => !r.content)!;
    const html = renderToStaticMarkup(createElement(RecipeDetail, { recipe: legacy, recipes: [] }));
    assert.match(html, /아직 단계별 조리법과 계량 정보는 제공하지 않으며/);
    assert.doesNotMatch(html, /만드는 순서|예상 총 시간|기준 분량|보관 안내|recipe-photo/);
    assert.ok(!getRecipeMetadata(legacy).title.includes('조리법'));
  } finally {
    await server.close();
  }
});
