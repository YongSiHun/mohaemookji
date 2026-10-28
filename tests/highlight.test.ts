import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getHighlightSpans } from '../src/utils/highlight.ts';

test('강조 범위는 겹친 검색어를 병합하고 반복·별칭을 모두 반영한다', () => {
  assert.deepEqual(getHighlightSpans('두부두부', '두부, 부'), [[0, 4]]);
  assert.deepEqual(getHighlightSpans('고춧가루', '고추가루'), [[0, 4]]);
  assert.deepEqual(getHighlightSpans('김치 두부', '김치,두부'), [
    [0, 2],
    [3, 5],
  ]);
  assert.deepEqual(getHighlightSpans('두부', ''), []);
});
