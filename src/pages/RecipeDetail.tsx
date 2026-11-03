import { useEffect, useMemo } from 'react';
import type { Recipe, RecipeAmount } from '../types/recipe';
import { SiteHeader, SiteFooter } from '../components/SiteLayout';
import { RecipeCard } from '../components/RecipeCard';
import { useRecipeData } from '../hooks/useRecipeData';
import { cuisineNames } from '../constants/cuisines';
import flavors from '../../data/flavors.json' with { type: 'json' };
import { getYouTubeRecipeUrl } from '../services/youtube';
import {
  difficultyNames,
  findRecipeByPath,
  getRelatedRecipes,
  getRecipeMetadata,
} from '../services/recipeDetails';

function Amounts({ title, items }: { title: string; items: RecipeAmount[] }) {
  const empty = items.length === 0;
  if (empty) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul className="amount-list">
        {items.map((item, i) => (
          <li key={i}>
            <span>
              {item.name}
              {item.optional && ' (선택)'}
            </span>
            {item.amount && <strong>{item.amount}</strong>}
          </li>
        ))}
      </ul>
    </section>
  );
}
function Advice({ title, items }: { title: string; items?: string[] }) {
  const absent = !items?.length;
  if (absent) return null;
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {items.map((text, i) => (
          <li key={i}>{text}</li>
        ))}
      </ul>
    </section>
  );
}
function RecipeHeader({ recipe }: { recipe: Recipe }) {
  const content = recipe.content;
  const summary = content?.introduction ?? recipe.description;
  return (
    <header className="detail-header">
      <p className="eyebrow">
        {cuisineNames[recipe.cuisine]}
        {recipe.category && ' · ' + recipe.category}
      </p>
      <h1>{recipe.name}</h1>
      {summary && <p className="detail-intro">{summary}</p>}
      <div className="card-flavors">
        {recipe.flavors.map((id) => (
          <span key={id}>{flavors.find((f) => f.id === id)?.name}</span>
        ))}
      </div>
      {content && (
        <dl className="recipe-facts">
          {content.totalMinutes && (
            <div>
              <dt>예상 총 시간</dt>
              <dd>약 {content.totalMinutes}분</dd>
            </div>
          )}
          <div>
            <dt>난이도</dt>
            <dd>{difficultyNames[content.difficulty]}</dd>
          </div>
          <div>
            <dt>기준 분량</dt>
            <dd>{content.servings}</dd>
          </div>
        </dl>
      )}
      {content?.timeNote && <p className="detail-note">{content.timeNote}</p>}
    </header>
  );
}

function RecipeBody({ recipe }: { recipe: Recipe }) {
  const content = recipe.content;
  return (
    <>
      <RecipeHeader recipe={recipe} />
      {recipe.image && (
        <figure className="recipe-photo">
          <img src={recipe.image.src} alt={recipe.image.alt} width="960" height="640" />
          <figcaption>
            <a href={recipe.image.sourceUrl}>{recipe.image.credit}</a> ·{' '}
            <a href={recipe.image.licenseUrl}>{recipe.image.license}</a>
          </figcaption>
        </figure>
      )}
      {content ? (
        <>
          <section aria-labelledby="ingredients-title">
            <h2 id="ingredients-title">필요한 재료와 양념</h2>
            {content.measurementNote && <p className="detail-note">{content.measurementNote}</p>}
            <div className="detail-ingredients">
              <Amounts title="주요 재료" items={content.ingredients} />
              <Amounts title="양념과 소스" items={content.seasonings} />
            </div>
          </section>
          <section aria-labelledby="steps-title">
            <h2 id="steps-title">만드는 순서</h2>
            <ol className="cooking-steps">
              {content.steps.map((step, i) => (
                <li key={i} id={'step-' + (i + 1)}>
                  {step}
                </li>
              ))}
            </ol>
          </section>
          <Advice title="실패를 줄이는 요리 팁" items={content.tips} />
          <Advice title="재료가 없다면" items={content.substitutions} />
          {content.storage && (
            <section>
              <h2>보관 안내</h2>
              <p>{content.storage}</p>
            </section>
          )}
          <section className="detail-sources">
            <h2>참고한 조리 자료</h2>
            <p>
              분량과 조리 흐름을 아래 자료에서 확인해 한국어로 정리한 조리 예시입니다. 직접 조리
              검증을 완료한 레시피는 아닙니다. 난이도는 작업 수와 불 조절을 고려한 편집 기준이며,
              재료와 기구에 따라 시간·결과가 달라질 수 있습니다. 검색 카드의 대표 재료와 이 예시의
              구성이 다를 수 있습니다.
            </p>
            <ul>
              {content.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.name} (새 탭)
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="summary-only">
          <h2>메뉴 선택에 참고하세요</h2>
          <p>
            아래는 이 메뉴에 등록된 대표 구성입니다. 아직 단계별 조리법과 계량 정보는 제공하지
            않으며, 실제 조리에 필요한 전체 재료를 뜻하지 않습니다.
          </p>
          <div className="detail-ingredients">
            <Amounts title="대표 재료" items={recipe.ingredients.map((name) => ({ name }))} />
            <Amounts title="대표 양념·소스" items={recipe.seasonings.map((name) => ({ name }))} />
          </div>
        </section>
      )}
      <section className="detail-youtube">
        <h2>영상으로 더 살펴보기</h2>
        <p>다른 조리 방식이나 손질 동작은 YouTube 검색 결과에서 참고할 수 있습니다.</p>
        <a
          className="secondary-button detail-button"
          href={getYouTubeRecipeUrl(recipe.name)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 18" aria-hidden="true">
            <rect width="24" height="18" rx="5" fill="currentColor" />
            <path d="m10 5 6 4-6 4Z" fill="#b93d15" />
          </svg>
          <span>{recipe.name} YouTube 조리 영상 검색 (새 탭)</span>
        </a>
      </section>
    </>
  );
}

export function RecipeDetail({ recipe, recipes }: { recipe: Recipe; recipes: readonly Recipe[] }) {
  const related = useMemo(() => getRelatedRecipes(recipe, recipes), [recipe, recipes]);
  return (
    <>
      <a className="skip-link" href="#recipe-detail">
        요리 본문으로 건너뛰기
      </a>
      <SiteHeader />
      <main id="recipe-detail" className="shell recipe-detail" tabIndex={-1}>
        <nav className="detail-breadcrumb" aria-label="현재 위치">
          <a href="/">메뉴 검색</a>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{recipe.name}</span>
        </nav>
        <RecipeBody recipe={recipe} />
        {related.length > 0 && (
          <section className="related-recipes">
            <h2>함께 비교할 메뉴</h2>
            <p>공통 재료와 맛, 같은 권역·분류를 기준으로 골랐어요.</p>
            <div className="recipe-grid">
              {related.map((item) => (
                <RecipeCard key={item.id} recipe={item} keyword="" />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

/** 개발 서버 및 브라우저 진입. 프로덕션 본문은 빌드 시 같은 컴포넌트로 생성한다. */
export function RecipeDetailPage({ path }: { path: string }) {
  const { data, error, retry } = useRecipeData();
  const recipe = findRecipeByPath(data?.recipes ?? [], path);
  const ready = Boolean(data);
  useEffect(() => {
    const missing = !recipe;
    if (missing) return;
    const meta = getRecipeMetadata(recipe);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute('content', meta.description);
  }, [recipe]);
  if (recipe) return <RecipeDetail recipe={recipe} recipes={data?.recipes ?? []} />;
  return (
    <>
      <SiteHeader />
      <main className="shell information">
        <h1>
          {error
            ? '요리를 불러오지 못했어요'
            : ready
              ? '요리를 찾을 수 없어요'
              : '요리를 불러오는 중이에요'}
        </h1>
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button className="secondary-button" onClick={retry}>
              다시 시도
            </button>
          </div>
        )}
        <p>
          <a href="/">메뉴 검색으로 돌아가기</a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
