import { useEffect, useState } from 'react';
import type { RecipeLoadState } from '../types/hooks';
import type { RecipeData } from '../types/recipe';
import { loadRecipes, getCachedRecipeData, RecipeDataError } from '../services/recipeLoader';

/** 메뉴 로딩 상태 */
export function useRecipeData() {
  const [state, setState] = useState<RecipeLoadState>(() => ({
    data: getCachedRecipeData() ?? null,
    error: '',
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    /** 로딩 성공 반영 */
    function complete(data: RecipeData) {
      const shouldIgnore = !isActive;
      if (shouldIgnore) return;
      setState((previous) =>
        previous.data === data && !previous.error ? previous : { data, error: '' },
      );
    }

    /** 로딩 실패 반영 */
    function fail(error: unknown) {
      const shouldIgnore = !isActive;
      if (shouldIgnore) return;
      setState({
        data: null,
        error:
          error instanceof RecipeDataError
            ? error.message
            : '검색 데이터를 불러오지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.',
      });
    }

    loadRecipes().then(complete).catch(fail);
    return () => {
      isActive = false;
    };
  }, [attempt]);

  /** 데이터 재시도 */
  function retry() {
    setState({ data: null, error: '' });
    setAttempt((value) => value + 1);
  }

  const isReady = state.data !== null;
  const isLoading = !isReady && !state.error;
  return { ...state, isReady, isLoading, retry };
}
