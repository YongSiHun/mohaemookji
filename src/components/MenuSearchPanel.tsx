import type { MenuSearchPanelProps } from '../types/components';
import { appendIngredientKeyword } from '../utils/ingredientKeywords';
import { RefreshButton } from './RefreshButton';
import { FlavorSelector } from './FlavorSelector';
import { IngredientSearch } from './IngredientSearch';

/** 메뉴 검색 폼 */
export function MenuSearchPanel({
  draft,
  suggestions,
  keywords,
  isReady,
  onDraftChange,
  onSearch,
  onRefreshKeywords,
}: MenuSearchPanelProps) {
  return (
    <section id="search" className="search-panel" aria-label="메뉴 검색">
      <form
        onSubmit={(e) => {
          e.preventDefault();
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
          선택한 맛 중 하나라도 포함된 메뉴를 찾아요.
        </p>
        <FlavorSelector
          selected={draft.flavors}
          onChange={(flavors) => onDraftChange({ ...draft, flavors })}
        />
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
          <button type="submit" className="primary-button" disabled={!isReady}>
            메뉴 찾아보기
          </button>
        </div>
      </form>
    </section>
  );
}
