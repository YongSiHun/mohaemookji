import type { MenuResultsProps } from '../types/components';
import { RecipeCard } from './RecipeCard';

/** 메뉴 검색 결과 */
export function MenuResults({
  recipes,
  keyword,
  isLoading,
  error,
  hasNext,
  onLoadMore,
  onRetry,
  onReset,
}: MenuResultsProps) {
  const hasError = error.length > 0;
  const hasNoRecipes = recipes.length === 0;
  if (hasError)
    return (
      <div className="empty-state" role="alert">
        <h3>잠시 연결이 끊겼어요</h3>
        <p>{error}</p>
        <button className="secondary-button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    );
  if (isLoading)
    return (
      <div className="loading-state">
        <span className="spinner" />
        맛있는 메뉴를 준비하고 있어요…
      </div>
    );
  if (hasNoRecipes)
    return (
      <div className="empty-state">
        <img src="/logo.svg" width="60" height="60" alt="" />
        <h3>조건에 맞는 요리를 찾지 못했어요.</h3>
        <p>다른 맛이나 재료로 검색해 보세요.</p>
        <button className="secondary-button" onClick={onReset}>
          검색 조건 초기화
        </button>
      </div>
    );
  return (
    <>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} keyword={keyword} />
        ))}
      </div>
      <div className="pagination">
        {hasNext && (
          <button className="secondary-button load-more" onClick={onLoadMore}>
            메뉴 더 보기
          </button>
        )}
        {!hasNext && <p>모든 메뉴를 확인했어요</p>}
      </div>
    </>
  );
}
