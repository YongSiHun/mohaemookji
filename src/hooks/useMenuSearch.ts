import { useMemo, useReducer } from 'react';
import type { Recipe, SearchQuery } from '../types/recipe';
import { INITIAL_MENU_SEARCH_STATE } from '../constants/recipes';
import { buildRecipeSearchIndex, searchRecipeIndex } from '../services/recipeSearch';
import { shuffle } from '../utils/shuffle';
import { buildSuggestionIndex, suggestSearchTerms } from '../services/searchSuggestions';
import { menuSearchReducer } from '../services/menuSearchState';

/** 메뉴 검색 상태 */
export function useMenuSearch(recipes: readonly Recipe[]) {
  const [state, dispatch] = useReducer(menuSearchReducer, INITIAL_MENU_SEARCH_STATE);
  const { draft, applied, visibleCount } = state;
  const searchIndex = useMemo(() => buildRecipeSearchIndex(recipes), [recipes]);
  const candidates = useMemo(
    () => shuffle(searchRecipeIndex(searchIndex, applied, false)),
    [searchIndex, applied],
  );
  const suggestionIndex = useMemo(() => buildSuggestionIndex(recipes), [recipes]);
  const suggestions = useMemo(
    () => suggestSearchTerms(suggestionIndex, draft.ingredient),
    [suggestionIndex, draft.ingredient],
  );
  const visibleRecipes = useMemo(
    () => candidates.slice(0, visibleCount).map((item) => item.recipe),
    [candidates, visibleCount],
  );
  const hasNext = visibleCount < candidates.length;

  /** 검색 입력 반영 */
  function setDraft(query: SearchQuery) {
    dispatch({ type: 'draft', query });
  }

  /** 검색 조건 적용 */
  function apply(query: SearchQuery) {
    dispatch({ type: 'apply', query });
  }

  /** 후보 순서 갱신 */
  function refresh() {
    dispatch({ type: 'refresh' });
  }

  /** 표시 메뉴 추가 */
  function loadMore() {
    dispatch({ type: 'more', total: candidates.length });
  }

  return {
    draft,
    setDraft,
    applied,
    suggestions,
    visibleRecipes,
    hasNext,
    apply,
    refresh,
    loadMore,
  };
}
