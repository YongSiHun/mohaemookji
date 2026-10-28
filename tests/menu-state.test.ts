import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuSearchReducer } from '../src/services/menuSearchState.ts';
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
