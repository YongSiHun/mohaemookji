const functions = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);
const structural = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'CatchClause',
  'ConditionalExpression',
]);
const loops = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);
const isElseIf = (node) =>
  node.type === 'IfStatement' &&
  node.parent.type === 'IfStatement' &&
  node.parent.alternate === node;
function localAncestors(node) {
  const ancestors = [];
  let parent = node.parent;
  while (parent && !functions.has(parent.type)) {
    ancestors.push(parent);
    parent = parent.parent;
  }
  return ancestors;
}
function nesting(node) {
  return localAncestors(node).filter((parent) => structural.has(parent.type) && !isElseIf(parent))
    .length;
}
function branchCost(node) {
  const cost = isElseIf(node) ? 1 : 1 + nesting(node);
  const hasElse =
    node.type === 'IfStatement' && node.alternate && node.alternate.type !== 'IfStatement';
  return cost + Number(Boolean(hasElse));
}
function logicalCost(node) {
  const parent = node.parent;
  return Number(parent.type !== 'LogicalExpression' || parent.operator !== node.operator);
}
const cognitiveComplexity = {
  meta: {
    type: 'suggestion',
    schema: [{ type: 'integer', minimum: 0 }],
    messages: { excess: '인지복잡도 {{score}}: 함수별 최대 {{max}} 이하로 책임을 분리하세요.' },
  },
  create(context) {
    const frames = [];
    const max = context.options[0] ?? 5;
    function enterFunction(node) {
      frames.push({ node, score: 0 });
    }
    function leaveFunction() {
      const frame = frames.pop();
      const withinLimit = frame.score <= max;
      if (withinLimit) return;
      context.report({ node: frame.node, messageId: 'excess', data: { score: frame.score, max } });
    }
    function add(node) {
      const frame = frames.at(-1);
      const outsideFunction = !frame;
      if (outsideFunction) return;
      frame.score += branchCost(node);
    }
    function addLogical(node) {
      const frame = frames.at(-1);
      const outsideFunction = !frame;
      if (outsideFunction) return;
      frame.score += logicalCost(node);
    }
    function addJump(node) {
      const frame = frames.at(-1);
      const counted = frame && node.label;
      if (counted) frame.score += 1;
    }
    return {
      ':function': enterFunction,
      ':function:exit': leaveFunction,
      IfStatement: add,
      ForStatement: add,
      ForInStatement: add,
      ForOfStatement: add,
      WhileStatement: add,
      DoWhileStatement: add,
      SwitchStatement: add,
      CatchClause: add,
      ConditionalExpression: add,
      LogicalExpression: addLogical,
      BreakStatement: addJump,
      ContinueStatement: addJump,
    };
  },
};
const flatControlFlow = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      nestedIf: '중첩 if 대신 guard clause와 early return을 사용하세요.',
      nestedLoop: '중첩 반복문은 인덱스 또는 독립된 순회 책임으로 분리하세요.',
    },
  },
  create(context) {
    function checkIf(node) {
      const nested = localAncestors(node).some((parent) => parent.type === 'IfStatement');
      if (nested) context.report({ node, messageId: 'nestedIf' });
    }
    function checkLoop(node) {
      const nested = localAncestors(node).some((parent) => loops.has(parent.type));
      if (nested) context.report({ node, messageId: 'nestedLoop' });
    }
    return {
      IfStatement: checkIf,
      ForStatement: checkLoop,
      ForInStatement: checkLoop,
      ForOfStatement: checkLoop,
      WhileStatement: checkLoop,
      DoWhileStatement: checkLoop,
    };
  },
};
export default {
  rules: { 'cognitive-complexity': cognitiveComplexity, 'flat-control-flow': flatControlFlow },
};
