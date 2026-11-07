import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Linter } from 'eslint';
import maintainability from '../scripts/eslint-rules.js';
const linter = new Linter();
function lint(code: string, rule = 'cognitive-complexity', threshold = 5) {
  return linter.verify(code, [
    {
      plugins: { maintainability },
      rules: {
        ['maintainability/' + rule]:
          rule === 'cognitive-complexity' ? ['error', threshold] : 'error',
      },
    },
  ]);
}
test('복잡도 5는 허용하고 6은 거부한다', () => {
  const branch = 'if (value) return;';
  assert.equal(lint('function work(value) {' + branch.repeat(5) + '}').length, 0);
  assert.match(lint('function work(value) {' + branch.repeat(6) + '}')[0].message, /인지복잡도 6/);
});
test('중첩·else·조건식·논리 연산 전환·catch를 계산한다', () => {
  const cases = [
    ['function f(a,b){ if(a){if(b) return;} }', 3],
    ['function f(a,b){ if(a) return; else if(b) return; else return; }', 3],
    ['function f(a,b,c){ return a ? (b ? 1 : 2) : c; }', 3],
    ['function f(a,b,c){ return a && b && c; }', 1],
    ['function f(a,b,c){ return a && b || c; }', 2],
    ['function f(){try { work(); } catch { recover(); }}', 1],
    ['function f(a){switch(a){case 1: break; default: break;}}', 1],
    ['function f(a){outer: while(a){break outer;}}', 2],
  ] as const;
  for (const [code, score] of cases) {
    assert.match(
      lint(code, 'cognitive-complexity', 0)[0].message,
      new RegExp('인지복잡도 ' + score + ':'),
    );
  }
});
test('내부 콜백과 바깥 함수는 독립적으로 측정한다', () => {
  assert.equal(
    lint('function f(a){if(a) return () => {if(a) return;};}', 'cognitive-complexity', 1).length,
    0,
  );
});
test('중첩 if·반복문을 거부하고 독립 순회는 허용한다', () => {
  assert.equal(lint('function f(a){if(a){if(a) work();}}', 'flat-control-flow').length, 1);
  assert.equal(
    lint('for(const a of list){for(const b of a) work(b);}', 'flat-control-flow').length,
    1,
  );
  assert.equal(
    lint('function f(a){if(!a)return;work();} for(const a of list) work(a);', 'flat-control-flow')
      .length,
    0,
  );
});
