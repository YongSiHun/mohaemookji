import { useMemo, useState } from 'react';
import type { Recipe } from '../types/recipe';
import type { KeywordSelection } from '../types/hooks';
import { RECOMMENDED_KEYWORD_COUNT } from '../constants/search';
import { buildRecommendationPool, pickRecommendedKeywords } from '../services/recommendedKeywords';

/** 추천 검색어 상태 */
export function useRecommendedKeywords(recipes: readonly Recipe[]) {
  const pool = useMemo(() => buildRecommendationPool(recipes), [recipes]);
  const initialKeywords = useMemo(() => pickRecommendedKeywords(pool), [pool]);
  const [selection, setSelection] = useState<KeywordSelection | null>(null);
  const isCurrentSelection = selection?.pool === pool;
  const keywords = isCurrentSelection ? selection.keywords : initialKeywords;

  /** 추천 검색어 갱신 */
  function refresh() {
    setSelection({
      pool,
      keywords: pickRecommendedKeywords(pool, RECOMMENDED_KEYWORD_COUNT, keywords),
    });
  }

  return { keywords, refresh };
}
