import { CARD_INGREDIENT_LIMIT } from '../constants/recipes';
import { Highlight } from './Highlight';
import { Fragment, memo } from 'react';
import type { IngredientLineProps, RecipeCardProps } from '../types/components';
import flavors from '../../data/flavors.json' with { type: 'json' };
import { getYouTubeRecipeUrl } from '../services/youtube';
import { cuisineNames } from '../constants/cuisines';

/** 재료 요약 */
function IngredientLine({ items, keyword }: IngredientLineProps) {
  return (
    <>
      {items.slice(0, CARD_INGREDIENT_LIMIT).map((item, i) => (
        <Fragment key={item}>
          {i > 0 && ' · '}
          <Highlight text={item} keyword={keyword} />
        </Fragment>
      ))}
      {items.length > CARD_INGREDIENT_LIMIT && (
        <span className="extra"> 외 {items.length - CARD_INGREDIENT_LIMIT}개</span>
      )}
    </>
  );
}

/** 메뉴 카드 */
export const RecipeCard = memo(function RecipeCard({ recipe, keyword }: RecipeCardProps) {
  return (
    <article className="recipe-card">
      <div className="card-top">
        <span className="cuisine">{cuisineNames[recipe.cuisine]}</span>
        <span className="card-decoration" aria-hidden="true">
          ↗
        </span>
      </div>
      <h3>
        <Highlight text={recipe.name} keyword={keyword} />
      </h3>
      <div className="card-flavors">
        {recipe.flavors.map((f) => (
          <span key={f}>{flavors.find((v) => v.id === f)?.name}</span>
        ))}
      </div>
      <dl>
        <div>
          <dt>주재료</dt>
          <dd>
            <IngredientLine items={recipe.ingredients} keyword={keyword} />
          </dd>
        </div>
        <div>
          <dt>소스</dt>
          <dd>
            <IngredientLine items={recipe.seasonings} keyword={keyword} />
          </dd>
        </div>
      </dl>
      <a
        className="recipe-overlay"
        href={getYouTubeRecipeUrl(recipe.name, keyword)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={recipe.name + ' 유튜브 레시피 보기 (새 탭)'}
      >
        <span className="recipe-overlay-label" aria-hidden="true">
          <svg viewBox="0 0 24 18" aria-hidden="true">
            <rect width="24" height="18" rx="5" fill="currentColor" />
            <path d="m10 5 6 4-6 4Z" fill="white" />
          </svg>
          유튜브 레시피 보기
        </span>
      </a>
    </article>
  );
});
