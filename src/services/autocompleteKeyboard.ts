import type { AutocompleteAction, AutocompleteKeyState } from '../types/search.ts';

/** 자동완성 이동 인덱스 */
function nextSuggestionIndex(state: AutocompleteKeyState): number {
  const current = state.expanded ? state.activeIndex : -1;
  const movesDown = state.key === 'ArrowDown';
  const previous = current <= 0 ? state.count - 1 : current - 1;
  return movesDown ? (current + 1) % state.count : previous;
}

/** 자동완성 키 입력 해석 */
export function getAutocompleteAction(state: AutocompleteKeyState): AutocompleteAction {
  const isComposing = state.isComposing;
  if (isComposing) return { kind: 'ignore', preventDefault: false };
  const isEscape = state.key === 'Escape';
  if (isEscape) return { kind: 'close', preventDefault: true };
  const isArrowKey = state.key === 'ArrowDown' || state.key === 'ArrowUp';
  const canMove = isArrowKey && state.count > 0;
  if (canMove) return { kind: 'move', preventDefault: true, index: nextSuggestionIndex(state) };
  const isNotEnter = state.key !== 'Enter';
  if (isNotEnter) return { kind: 'ignore', preventDefault: false };
  const canSelect = state.expanded && state.activeIndex >= 0 && state.activeIndex < state.count;
  if (canSelect) return { kind: 'select', preventDefault: true, index: state.activeIndex };
  return { kind: 'close', preventDefault: false };
}
