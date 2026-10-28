import type { SearchQuery } from './recipe.ts';

export interface KeywordFrequency {
  label: string;
  count: number;
}

export interface FlavorOption {
  id: string;
  name: string;
}

export type HighlightSpan = [start: number, end: number];

export interface AutocompleteKeyState {
  key: string;
  isComposing: boolean;
  expanded: boolean;
  activeIndex: number;
  count: number;
}

export type AutocompleteAction =
  | { kind: 'ignore'; preventDefault: false }
  | { kind: 'close'; preventDefault: boolean }
  | { kind: 'move'; preventDefault: true; index: number }
  | { kind: 'select'; preventDefault: true; index: number };

export interface MenuSearchState {
  draft: SearchQuery;
  applied: SearchQuery;
  visibleCount: number;
}

export type MenuSearchAction =
  | { type: 'draft'; query: SearchQuery }
  | { type: 'apply'; query: SearchQuery }
  | { type: 'refresh' }
  | { type: 'more'; total: number };
