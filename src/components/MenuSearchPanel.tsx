import type { MenuSearchPanelProps } from '../types/components';
import { appendIngredientKeyword } from '../utils/ingredientKeywords';
import { RefreshButton } from './RefreshButton';
import { FlavorSelector } from './FlavorSelector';
import { IngredientSearch } from './IngredientSearch';

function getEmptyKeywordMessage(isLoading: boolean, error: string): string {
  if (isLoading) return '메뉴 데이터를 준비하면 추천 검색어가 표시돼요.';
  if (error) return '추천 검색어를 불러오지 못했어요.';
  return '추천할 검색어가 없어요.';
}

/** 메뉴 검색 폼 */
export function MenuSearchPanel({
  draft,
  suggestions,
  keywords,
  isReady,
  error = '',
  onRetry,
  onDraftChange,
  onSearch,
  onRefreshKeywords,
}: MenuSearchPanelProps) {
  const isLoading = !isReady && !error;
  return (
    <section id="search" className="search-panel" aria-label="메뉴 검색">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (error) {
            onRetry?.();
            return;
          }
          const notReady = !isReady;
          if (notReady) return;
          onSearch(draft);
        }}
      >
        <div className="section-label">
          <span className="step">01</span>
          <h2>어떤 맛이 당기세요?</h2>
          <div className="flavor-selection-info">
            <span className="selection-count" role="status" aria-live="polite" aria-atomic="true">
              {draft.flavors.length > 0 ? draft.flavors.length + '개 선택됨' : null}
            </span>
            <span className="search-guidance">원하는 조건만 골라 검색해 보세요.</span>
          </div>
        </div>
        <p className="flavor-help" id="flavor-help">
          맛 이름으로 선택하고, 별 1~5개로 원하는 강도를 골라보세요. 별이 많을수록 강한 맛이에요.
          선택한 맛과 강도 중 하나 이상에 맞는 메뉴를 찾아요.
        </p>
        <FlavorSelector query={draft} onChange={onDraftChange} />
        <div className="search-divider" />
        <div className="section-label">
          <span className="step">02</span>
          <label htmlFor="ingredient">어떤 재료를 사용하고 싶으세요?</label>
        </div>
        <p className="ingredient-help" id="input-help">
          재료가 여러 개라면 쉼표(,)로 구분해 주세요.
        </p>
        <div className="input-row">
          <IngredientSearch
            value={draft.ingredient}
            suggestions={suggestions}
            onChange={(ingredient) => onDraftChange({ ...draft, ingredient })}
          />
        </div>
        <div className="search-bottom">
          <div className="recommendations">
            <div className="recommendation-heading">
              <span>추천 검색어</span>
              <RefreshButton
                onClick={onRefreshKeywords}
                disabled={!isReady}
                label="추천 검색어 새로고침"
              />
            </div>
            {keywords.length === 0 && (
              <p className="search-data-note" role="status">
                {getEmptyKeywordMessage(isLoading, error)}
              </p>
            )}
            <div className="recommendation-list">
              {keywords.map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() =>
                    onSearch({
                      ...draft,
                      ingredient: appendIngredientKeyword(draft.ingredient, k),
                    })
                  }
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="search-actions">
          {error && (
            <p id="search-data-error" className="search-data-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
            aria-busy={isLoading}
            aria-describedby={error ? 'search-data-error' : undefined}
          >
            {isLoading ? '메뉴 준비 중…' : error ? '데이터 다시 불러오기' : '메뉴 찾아보기'}
          </button>
        </div>
      </form>
    </section>
  );
}
