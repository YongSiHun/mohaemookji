import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { selectFlavorLevel, toggleFlavor, removeFlavor } from '../src/services/flavorSelection.ts';
import { searchRecipes, queryKey } from '../src/services/recipeSearch.ts';
import { menuSearchReducer } from '../src/services/menuSearchState.ts';
import { INITIAL_MENU_SEARCH_STATE, EMPTY_SEARCH_QUERY } from '../src/constants/recipes.ts';
import type { Recipe, SearchQuery } from '../src/types/recipe.ts';

const empty: SearchQuery = { flavors: [], ingredient: '' };
const make = (id: string, level?: 1 | 3 | 5): Recipe => ({
  id,
  name: id,
  cuisine: 'korean',
  flavors: ['spicy'],
  flavorLevels: level ? { spicy: level } : undefined,
  ingredients: ['두부'],
  seasonings: ['소금'],
});

test('별로 맛을 선택·수정하고 강도 무관 전환과 맛 해제를 할 수 있다', () => {
  const selected = selectFlavorLevel(empty, 'spicy', 3);
  assert.deepEqual(selected.flavors, ['spicy']);
  assert.equal(selected.flavorLevels?.spicy, 3);
  const updated = selectFlavorLevel(selected, 'spicy', 5);
  assert.deepEqual(updated.flavors, ['spicy']);
  assert.equal(updated.flavorLevels?.spicy, 5);
  assert.equal(selectFlavorLevel(updated, 'spicy').flavorLevels?.spicy, undefined);
  assert.deepEqual(removeFlavor(updated, 'spicy'), { ...empty, flavorLevels: {} });
  assert.deepEqual(toggleFlavor(updated, 'spicy'), removeFlavor(updated, 'spicy'));
  assert.deepEqual(toggleFlavor(empty, 'spicy').flavors, ['spicy']);
  assert.equal(selected.flavorLevels?.spicy, 3);
  assert.deepEqual(empty.flavors, []);
});

test('맛 강도는 정확히 일치하고 여러 맛은 OR, 재료와는 AND로 검색한다', () => {
  const data = [make('mild', 1), make('medium', 3), make('strong', 5), make('legacy')];
  const query = selectFlavorLevel(empty, 'spicy', 3);
  assert.deepEqual(
    searchRecipes(data, query).map((item) => item.recipe.id),
    ['medium'],
  );
  assert.equal(searchRecipes(data, toggleFlavor(empty, 'spicy')).length, 4);
  assert.equal(searchRecipes(data, { ...query, ingredient: '김치' }).length, 0);
  const savory = { ...make('savory'), flavors: ['savory'], flavorLevels: { savory: 5 as const } };
  const either = selectFlavorLevel(query, 'savory', 5);
  assert.deepEqual(
    searchRecipes([...data, savory], either).map((item) => item.recipe.id),
    ['medium', 'savory'],
  );
  assert.equal(searchRecipes([...data, savory], { ...either, ingredient: '두부' }).length, 2);
});

test('강도를 바꾸면 검색 키가 바뀌고 선택 순서와 무관하다', () => {
  const query = selectFlavorLevel(empty, 'spicy', 3);
  assert.notEqual(queryKey(query), queryKey(selectFlavorLevel(query, 'spicy', 5)));
  assert.equal(queryKey(query), queryKey({ ...query, flavorLevels: { spicy: 3, savory: 5 } }));
  assert.equal(
    queryKey(selectFlavorLevel(query, 'savory', 5)),
    queryKey({
      flavors: ['savory', 'spicy'],
      flavorLevels: { savory: 5, spicy: 3 },
      ingredient: '',
    }),
  );
});

test('검색 적용·새로고침·초기화는 강도 상태를 올바르게 유지한다', () => {
  const query = selectFlavorLevel(empty, 'spicy', 3);
  const draft = menuSearchReducer(INITIAL_MENU_SEARCH_STATE, { type: 'draft', query });
  assert.equal(draft.applied.flavorLevels, undefined);
  const applied = menuSearchReducer(draft, { type: 'apply', query });
  assert.equal(applied.applied.flavorLevels?.spicy, 3);
  assert.equal(menuSearchReducer(applied, { type: 'refresh' }).applied.flavorLevels?.spicy, 3);
  assert.deepEqual(
    menuSearchReducer(applied, { type: 'apply', query: EMPTY_SEARCH_QUERY }).applied,
    empty,
  );
});

test('14가지 맛에 별 다섯 개씩 제공하고 현재 강도와 적용 조건을 표시한다', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  });
  try {
    const { FlavorSelector } = await server.ssrLoadModule('/src/components/FlavorSelector.tsx');
    const { ActiveConditions } = await server.ssrLoadModule('/src/components/ActiveConditions.tsx');
    const query = selectFlavorLevel(empty, 'spicy', 3);
    const html = renderToStaticMarkup(createElement(FlavorSelector, { query, onChange: () => {} }));
    assert.equal((html.match(/class="flavor-star-button/g) ?? []).length, 70);
    assert.equal((html.match(/class="flavor-star-button filled"/g) ?? []).length, 3);
    assert.match(html, /aria-label="매운 맛 강도 3\/5 선택" aria-pressed="true"/);
    assert.equal((html.match(/강도 무관/g) ?? []).length, 14);
    const conditions = renderToStaticMarkup(
      createElement(ActiveConditions, { query, onApply: () => {} }),
    );
    assert.match(conditions, /★★★/);
    assert.match(conditions, /3\/5/);
  } finally {
    await server.close();
  }
});
