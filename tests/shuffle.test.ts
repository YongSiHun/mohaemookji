import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffleRecipes } from '../src/services/shuffleRecipes.ts';
import { paginateRecipes } from '../src/services/pagination.ts';
import type { RankedRecipe } from '../src/types/recipe.ts';

const query = { flavors: [], ingredient: '' };
const recipes: RankedRecipe[] = Array.from({ length: 95 }, (_, i) => ({
  rank: i % 6,
  recipe: {
    id: String(i),
    name: '메뉴' + i,
    cuisine: 'korean',
    flavors: [],
    ingredients: [],
    seasonings: [],
  },
}));

test('무작위 순서는 원본을 보존하고 모든 메뉴를 포함한다', () => {
  const original = recipes.map((r) => r.recipe.id);
  const shuffled = shuffleRecipes(recipes, () => 0);
  assert.notDeepEqual(
    shuffled.map((r) => r.recipe.id),
    original,
  );
  assert.deepEqual(
    recipes.map((r) => r.recipe.id),
    original,
  );
  assert.deepEqual(new Set(shuffled.map((r) => r.recipe.id)), new Set(original));
  assert.deepEqual(shuffleRecipes([]), []);
  assert.deepEqual(shuffleRecipes(recipes.slice(0, 1)), recipes.slice(0, 1));
});

test('랜덤 후보 전체 순회는 관련도·이름과 무관하게 중복 및 누락이 없다', () => {
  const shuffled = shuffleRecipes(recipes, () => 0.3);
  const seen: string[] = [];
  let cursor: string | null = null;
  do {
    const page = paginateRecipes(shuffled, query, 'snapshot:0', cursor);
    seen.push(...page.items.map((r) => r.id));
    cursor = page.nextCursor;
    assert.ok(seen.length <= recipes.length);
  } while (cursor);
  assert.deepEqual(
    seen,
    shuffled.map((r) => r.recipe.id),
  );
  assert.equal(new Set(seen).size, recipes.length);
});

test('후보 새로고침은 이전 순서의 커서를 초기화한다', () => {
  const previous = paginateRecipes(recipes, query, 'snapshot:0');
  const refreshed = shuffleRecipes(recipes, () => 0);
  assert.deepEqual(
    paginateRecipes(refreshed, query, 'snapshot:1', previous.nextCursor),
    paginateRecipes(refreshed, query, 'snapshot:1'),
  );
});

test('랜덤 표시용 검색은 관련도 정렬 비용 없이 같은 결과를 반환한다', async () => {
  const { searchRecipes } = await import('../src/services/recipeSearch.ts');
  const data = recipes.map((item) => ({
    ...item.recipe,
    flavors: ['spicy'],
    ingredients: ['두부'],
  }));
  const query = { flavors: ['spicy'], ingredient: '두부' };
  assert.deepEqual(
    new Set(searchRecipes(data, query, false).map((item) => item.recipe.id)),
    new Set(searchRecipes(data, query).map((item) => item.recipe.id)),
  );
});
