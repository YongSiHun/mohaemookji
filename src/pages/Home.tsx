import { useRef } from 'react';
import type { SearchQuery } from '../types/recipe';
import { EMPTY_SEARCH_QUERY, EMPTY_RECIPES } from '../constants/recipes';
import { useRecipeData } from '../hooks/useRecipeData';
import { useMenuSearch } from '../hooks/useMenuSearch';
import { useRecommendedKeywords } from '../hooks/useRecommendedKeywords';
import { SiteHeader, SiteFooter } from '../components/SiteLayout';
import { Hero } from '../components/Hero';
import { MenuSearchPanel } from '../components/MenuSearchPanel';
import { ActiveConditions } from '../components/ActiveConditions';
import { MenuResults } from '../components/MenuResults';
import { RefreshButton } from '../components/RefreshButton';
import { RecipeGuide } from '../components/RecipeGuide';

/** 홈 화면 조합 */
export default function Home() {
  const { data, error, isReady, isLoading, retry } = useRecipeData();
  const recipes = data?.recipes ?? EMPTY_RECIPES;
  const search = useMenuSearch(recipes);
  const recommended = useRecommendedKeywords(recipes);
  const resultRef = useRef<HTMLElement>(null);
  const resultStatus =
    error ||
    (isLoading
      ? '메뉴 데이터를 불러오는 중입니다.'
      : search.visibleRecipes.length + '개의 메뉴 후보를 표시하고 있어요.');

  /** 검색 적용·결과 이동 */
  function apply(query: SearchQuery, scroll = true) {
    search.apply(query);
    recommended.refresh();
    const shouldSkipScroll = !scroll;
    if (shouldSkipScroll) return;
    requestAnimationFrame(() => {
      const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      resultRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? 'instant' : 'smooth',
        block: 'start',
      });
    });
  }

  /** 검색 조건 초기화 */
  function reset() {
    apply(EMPTY_SEARCH_QUERY, false);
  }

  return (
    <>
      <a className="skip-link" href="#search">
        메뉴 검색으로 건너뛰기
      </a>
      <SiteHeader />
      <main className="shell">
        <Hero />
        <MenuSearchPanel
          draft={search.draft}
          suggestions={search.suggestions}
          keywords={recommended.keywords}
          isReady={isReady}
          onDraftChange={search.setDraft}
          onSearch={apply}
          onRefreshKeywords={recommended.refresh}
        />
        <section
          className="results"
          ref={resultRef}
          aria-labelledby="results-title"
          aria-busy={isLoading}
        >
          <div className="results-heading">
            <div>
              <p className="eyebrow">YOUR NEXT MEAL</p>
              <div className="candidate-heading">
                <h2 id="results-title">오늘의 메뉴 후보</h2>
                <RefreshButton
                  onClick={search.refresh}
                  disabled={!isReady}
                  label="오늘의 메뉴 후보 새로고침"
                />
              </div>
            </div>
            {isReady && (
              <span className="results-note">마음에 드는 메뉴를 골라 레시피를 만나보세요.</span>
            )}
          </div>
          <ActiveConditions query={search.applied} onApply={apply} />
          <p className="sr-only" role="status" aria-live="polite">
            {resultStatus}
          </p>
          <MenuResults
            recipes={search.visibleRecipes}
            keyword={search.applied.ingredient}
            isLoading={isLoading}
            error={error}
            hasNext={search.hasNext}
            onLoadMore={search.loadMore}
            onRetry={retry}
            onReset={reset}
          />
        </section>
        <RecipeGuide />
      </main>
      <SiteFooter />
    </>
  );
}
