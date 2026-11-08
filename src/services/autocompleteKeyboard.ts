import type { AutocompleteAction, AutocompleteKeyState } from '../types/search.ts';

/** 자동완성 이동 인덱스 */
function nextSuggestionIndex(state: AutocompleteKeyState): number {
  const current = state.expanded ? state.activeIndex : -1;
  const movesDown = state.key === 'ArrowDown';
  const previous = current <= 0 ? state.count - 1 : current - 1;
  return movesDown ? (current + 1) % state.count : previous;
}

const ignored = { kind: 'ignore', preventDefault: false } as const;
function move(state: AutocompleteKeyState): AutocompleteAction {
  const empty = state.count <= 0;
  if (empty) return ignored;
  return { kind: 'move', preventDefault: true, index: nextSuggestionIndex(state) };
}
function select(state: AutocompleteKeyState): AutocompleteAction {
  const canSelect = state.expanded && state.activeIndex >= 0 && state.activeIndex < state.count;
  return canSelect
    ? { kind: 'select', preventDefault: true, index: state.activeIndex }
    : { kind: 'close', preventDefault: false };
}
const keyActions: Readonly<Record<string, (state: AutocompleteKeyState) => AutocompleteAction>> = {
  Escape: () => ({ kind: 'close', preventDefault: true }),
  ArrowDown: move,
  ArrowUp: move,
  Enter: select,
};
/** 키 동작 확장: 핸들러 추가 */
export function getAutocompleteAction(state: AutocompleteKeyState): AutocompleteAction {
  const isComposing = state.isComposing;
  if (isComposing) return ignored;
  const action = Object.hasOwn(keyActions, state.key) ? keyActions[state.key] : undefined;
  return action?.(state) ?? ignored;
}
