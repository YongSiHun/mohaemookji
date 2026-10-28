import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAutocompleteAction } from '../src/services/autocompleteKeyboard.ts';
import type { AutocompleteKeyState } from '../src/types/search.ts';

const base: AutocompleteKeyState = {
  key: '',
  isComposing: false,
  expanded: true,
  activeIndex: -1,
  count: 3,
};

test('한글 조합 중 Enter·방향키·Escape는 입력을 가로채지 않는다', () => {
  for (const key of ['Enter', 'ArrowDown', 'Escape'])
    assert.deepEqual(getAutocompleteAction({ ...base, key, isComposing: true }), {
      kind: 'ignore',
      preventDefault: false,
    });
});

test('방향키는 첫·끝 항목으로 순환하고 닫힌 목록도 연다', () => {
  for (const [key, activeIndex, expanded, expected] of [
    ['ArrowDown', -1, true, 0],
    ['ArrowDown', 2, true, 0],
    ['ArrowUp', 0, true, 2],
    ['ArrowUp', 2, false, 2],
    ['ArrowDown', 2, false, 0],
  ] as const)
    assert.deepEqual(getAutocompleteAction({ ...base, key, activeIndex, expanded }), {
      kind: 'move',
      preventDefault: true,
      index: expected,
    });
});

test('Enter는 선택된 제안만 확정하고 일반 검색 제출은 허용한다', () => {
  assert.deepEqual(getAutocompleteAction({ ...base, key: 'Enter', activeIndex: 1 }), {
    kind: 'select',
    preventDefault: true,
    index: 1,
  });
  for (const state of [
    { activeIndex: -1 },
    { activeIndex: 4 },
    { activeIndex: 1, expanded: false },
    { activeIndex: 0, count: 0 },
  ])
    assert.deepEqual(getAutocompleteAction({ ...base, key: 'Enter', ...state }), {
      kind: 'close',
      preventDefault: false,
    });
});

test('Escape는 닫고 일반 입력·빈 목록 방향키는 보존한다', () => {
  assert.deepEqual(getAutocompleteAction({ ...base, key: 'Escape' }), {
    kind: 'close',
    preventDefault: true,
  });
  assert.deepEqual(getAutocompleteAction({ ...base, key: 'a' }), {
    kind: 'ignore',
    preventDefault: false,
  });
  assert.deepEqual(getAutocompleteAction({ ...base, key: 'ArrowDown', count: 0 }), {
    kind: 'ignore',
    preventDefault: false,
  });
});
