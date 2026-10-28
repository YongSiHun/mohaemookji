import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Recipe } from '../src/types/recipe.ts';

test('화면 통합: 검색 폼·조건·상태별 결과·유튜브 링크·안내 문구', async () => {
  const server = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false,
    server: { middlewareMode: true, watch: null, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
  });
  try {
    const { MenuSearchPanel } = await server.ssrLoadModule('/src/components/MenuSearchPanel.tsx');
    const { ActiveConditions } = await server.ssrLoadModule('/src/components/ActiveConditions.tsx');
    const { MenuResults } = await server.ssrLoadModule('/src/components/MenuResults.tsx');
    const { RecipeGuide } = await server.ssrLoadModule('/src/components/RecipeGuide.tsx');
    const { default: Home } = await server.ssrLoadModule('/src/pages/Home.tsx');
    const recipes = JSON.parse(
      await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
    ) as Recipe[];
    const noop = () => {};
    const query = { flavors: ['spicy'], ingredient: '김치,두부' };
    const panel = renderToStaticMarkup(
      createElement(MenuSearchPanel, {
        draft: query,
        suggestions: [],
        keywords: ['두부', '김치'],
        isReady: true,
        onDraftChange: noop,
        onSearch: noop,
        onRefreshKeywords: noop,
      }),
    );
    assert.match(panel, /1개 선택됨/);
    assert.match(panel, /추천 검색어 새로고침/);
    assert.match(panel, /예: 돼지고기, 김치, 고춧가루/);
    assert.match(panel, /재료가 여러 개라면 쉼표/);
    assert.doesNotMatch(panel, /선택 사항/);
    const conditions = renderToStaticMarkup(
      createElement(ActiveConditions, { query, onApply: noop }),
    );
    assert.match(conditions, /맛 조건 제거/);
    assert.match(conditions, /김치 검색 조건 제거/);
    assert.match(conditions, /두부 검색 조건 제거/);
    const props = {
      recipes: recipes.slice(0, 30),
      keyword: '<script>alert(1)</script>',
      isLoading: false,
      error: '',
      hasNext: true,
      onLoadMore: noop,
      onRetry: noop,
      onReset: noop,
    };
    const result = renderToStaticMarkup(createElement(MenuResults, props));
    assert.equal((result.match(/class="recipe-card"/g) ?? []).length, 30);
    assert.match(result, /메뉴 더 보기/);
    assert.doesNotMatch(result, /30 [/] 2000|2000개 메뉴|<script>/);
    assert.match(result, /target="_blank"/);
    assert.match(result, /rel="noopener noreferrer"/);
    assert.ok(result.includes('href="https://www.youtube.com/results?search_query='));
    const finished = renderToStaticMarkup(createElement(MenuResults, { ...props, hasNext: false }));
    assert.match(finished, /모든 메뉴를 확인했어요/);
    assert.doesNotMatch(finished, /메뉴 더 보기/);
    const loading = renderToStaticMarkup(
      createElement(MenuResults, { ...props, recipes: [], isLoading: true }),
    );
    assert.match(loading, /맛있는 메뉴를 준비/);
    const failure = renderToStaticMarkup(
      createElement(MenuResults, { ...props, error: '연결 실패' }),
    );
    assert.match(failure, /다시 시도/);
    const empty = renderToStaticMarkup(createElement(MenuResults, { ...props, recipes: [] }));
    assert.match(empty, /조건에 맞는 요리를 찾지 못했어요/);
    assert.match(empty, /검색 조건 초기화/);
    const guide = renderToStaticMarkup(createElement(RecipeGuide));
    assert.match(guide, /메뉴는 모해묵지에서 발견하고/);
    assert.match(guide, /카드를 클릭하면 유튜브 검색 결과/);
    const home = renderToStaticMarkup(createElement(Home));
    assert.match(home, /오늘의 메뉴 후보 새로고침/);
    assert.doesNotMatch(home, /2000/);
  } finally {
    await server.close();
  }
});
