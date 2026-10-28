import type { MenuSearchAction, MenuSearchState } from '../types/search.ts';
import { PAGE_SIZE } from '../constants/recipes.ts';
import { parseIngredientKeywords } from '../utils/ingredientKeywords.ts';

/** 검색 상태 전환 */
export function menuSearchReducer(
  state: MenuSearchState,
  action: MenuSearchAction,
): MenuSearchState {
  switch (action.type) {
    case 'draft':
      return { ...state, draft: action.query };
    case 'apply':
      return {
        draft: action.query,
        applied: {
          ...action.query,
          ingredient: parseIngredientKeywords(action.query.ingredient).join(', '),
        },
        visibleCount: PAGE_SIZE,
      };
    case 'refresh':
      return { ...state, applied: { ...state.applied }, visibleCount: PAGE_SIZE };
    case 'more':
      return { ...state, visibleCount: Math.min(state.visibleCount + PAGE_SIZE, action.total) };
  }
}
