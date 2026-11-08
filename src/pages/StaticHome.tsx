import { SiteHeader, SiteFooter } from '../components/SiteLayout';
import { Hero } from '../components/Hero';
import { RecipeGuide } from '../components/RecipeGuide';
import { RecipeCard } from '../components/RecipeCard';
import type { Recipe } from '../types/recipe';

/** JS 실행 전 메뉴 예시·링크 안내 */
export function StaticHome({ recipes }: { recipes: Recipe[] }) {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <Hero />
        <noscript>
          <p>
            맛·재료 검색과 메뉴 더 보기는 JavaScript가 필요합니다. 아래 메뉴 예시를 바로 볼 수
            있습니다.
          </p>
        </noscript>
        <section aria-labelledby="example-title">
          <h2 id="example-title">메뉴 고르기 예시</h2>
          <div className="recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} keyword="" />
            ))}
          </div>
        </section>
        <RecipeGuide />
      </main>
      <SiteFooter />
    </>
  );
}
