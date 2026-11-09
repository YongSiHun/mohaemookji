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

function getSearchButtonLabel(isLoading: boolean, error: string): string {
  if (isLoading) return '메뉴 준비 중…';
  if (error) return '데이터 다시 불러오기';
  return '메뉴 찾아보기';
}
function SearchActions({
  isLoading,
  error,
  onReset,
}: {
  isLoading: boolean;
  error: string;
  onReset: () => void;
}) {
  return (
    <div className="search-actions">
      {error && (
        <p id="search-data-error" className="search-data-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="secondary-button search-reset"
        onClick={onReset}
        aria-label="검색 조건 초기화"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 4v6h6" />
          <path d="M3.5 10a8.5 8.5 0 1 1 1.8 8" />
        </svg>
        <span className="search-reset-tooltip" aria-hidden="true">
          검색 조건 초기화
        </span>
      </button>
      <button
        type="submit"
        className="primary-button"
        disabled={isLoading}
        aria-busy={isLoading}
        aria-describedby={error ? 'search-data-error' : undefined}
      >
        {getSearchButtonLabel(isLoading, error)}
      </button>
    </div>
  );
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
  onReset,
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
          <label htmlFor="ingredient">어떤 재료를 사용하고 싶으세요?</label>
        </div>
        <p className="ingredient-help" id="input-help">
          재료가 여러 개라면 쉼표(,)로 구분해 주세요. 각 검색어는 부분 일치로 찾으며, 모두
          포함되어야 해요.
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
        <div className="search-divider" />
        <div className="section-label flavor-section-label">
          <span className="step">02</span>
          <h2>어떤 맛이 당기세요?</h2>
          <div className="flavor-selection-info">
            <span className="selection-count" role="status" aria-live="polite" aria-atomic="true">
              {draft.flavors.length > 0 ? draft.flavors.length + '개 선택됨' : null}
            </span>
            <span className="search-guidance">원하는 조건만 골라 검색해 보세요.</span>
          </div>
        </div>
        <p className="flavor-help" id="flavor-help">
          카드를 누르면 별 0개로 맛을 선택해요. 맛 이름 옆의 별 1~5개로 강도를 골라보세요. 별이
          많을수록 강한 맛이며, 별 0개는 강도와 관계없이 검색해요.
        </p>
        <FlavorSelector query={draft} onChange={onDraftChange} />
        <SearchActions isLoading={isLoading} error={error} onReset={onReset} />
      </form>
    </section>
  );
}
