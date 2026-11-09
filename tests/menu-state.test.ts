import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuSearchReducer } from '../src/services/menuSearchState.ts';
import type { MenuSearchState } from '../src/types/search.ts';
import {
  INITIAL_MENU_SEARCH_STATE,
  PAGE_SIZE,
  EMPTY_SEARCH_QUERY,
} from '../src/constants/recipes.ts';

test('입력 변경은 현재 결과·더 보기 위치를 바꾸지 않는다', () => {
  const state = { ...INITIAL_MENU_SEARCH_STATE, visibleCount: PAGE_SIZE * 2 };
  const next = menuSearchReducer(state, {
    type: 'draft',
    query: { flavors: ['spicy'], ingredient: '김치' },
  });
  assert.equal(next.applied, state.applied);
  assert.equal(next.visibleCount, state.visibleCount);
  assert.equal(next.draft.ingredient, '김치');
});

test('검색은 재료를 정규화하고 첫 페이지·새 후보 순서로 전환한다', () => {
  const state = { ...INITIAL_MENU_SEARCH_STATE, visibleCount: 100 };
  const next = menuSearchReducer(state, {
    type: 'apply',
    query: { flavors: ['spicy'], ingredient: ' 김치, 두부,김치 ' },
  });
  assert.equal(next.applied.ingredient, '김치, 두부');
  assert.deepEqual(next.applied.flavors, ['spicy']);
  assert.notEqual(next.applied, state.applied);
  assert.equal(next.visibleCount, PAGE_SIZE);
});

test('더 보기는 검색 스냅샷을 유지하며 마지막 메뉴에서 멈춘다', () => {
  let state = INITIAL_MENU_SEARCH_STATE;
  for (const expected of [60, 65, 65]) {
    const next = menuSearchReducer(state, { type: 'more', total: 65 });
    assert.equal(next.visibleCount, expected);
    assert.equal(next.applied, state.applied);
    state = next;
  }
});

test('새로고침은 조건을 보존하고 페이지·후보 순서만 갱신한다', () => {
  const state = { ...INITIAL_MENU_SEARCH_STATE, visibleCount: 100 };
  const next = menuSearchReducer(state, { type: 'refresh' });
  assert.deepEqual(next.applied, state.applied);
  assert.notEqual(next.applied, state.applied);
  assert.equal(next.visibleCount, PAGE_SIZE);
  const reset = menuSearchReducer(next, { type: 'apply', query: EMPTY_SEARCH_QUERY });
  assert.deepEqual(reset.applied, EMPTY_SEARCH_QUERY);
});

test('초기화는 미적용 입력·적용 조건·맛 강도·더 보기 위치를 함께 비운다', () => {
  const state: MenuSearchState = {
    draft: { flavors: ['spicy'], flavorLevels: { spicy: 5 }, ingredient: '닭가슴살' },
    applied: { flavors: ['savory'], flavorLevels: { savory: 3 }, ingredient: '돼지고기' },
    visibleCount: PAGE_SIZE * 3,
  };
  const next = menuSearchReducer(state, { type: 'apply', query: EMPTY_SEARCH_QUERY });
  assert.deepEqual(next.draft, EMPTY_SEARCH_QUERY);
  assert.deepEqual(next.applied, EMPTY_SEARCH_QUERY);
  assert.equal(next.visibleCount, PAGE_SIZE);
  assert.equal(state.draft.ingredient, '닭가슴살');
  assert.equal(state.applied.ingredient, '돼지고기');
});
