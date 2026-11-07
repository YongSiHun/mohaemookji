import type { RecipeContent } from '../types/recipe';
import { CARD_INGREDIENT_LIMIT } from '../constants/recipes';
import { Highlight } from './Highlight';
import { Fragment, memo } from 'react';
import type { IngredientLineProps, RecipeCardProps } from '../types/components';
import { FlavorRatings } from './FlavorRatings';
import { getRecipePath, difficultyNames } from '../services/recipeDetails';
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

function CardSummary({ content }: { content?: RecipeContent }) {
  const absent = !content;
  if (absent) return null;
  return (
    <p className="card-summary">
      {content.totalMinutes && <>약 {content.totalMinutes}분 · </>}
      {difficultyNames[content.difficulty]} · {content.servings}
    </p>
  );
}

/** 메뉴 카드 */
export const RecipeCard = memo(function RecipeCard({ recipe, keyword }: RecipeCardProps) {
  const description = recipe.content?.introduction ?? recipe.description;
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
      <FlavorRatings recipe={recipe} />
      {description && <p className="recipe-description">{description}</p>}
      {recipe.image && (
        <img
          className="card-image"
          src={recipe.image.src}
          alt={recipe.image.alt}
          width="480"
          height="320"
          loading="lazy"
        />
      )}
      <CardSummary content={recipe.content} />
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
        href={getRecipePath(recipe)}
        aria-label={recipe.name + ' 요리 상세 보기'}
      >
        <span className="recipe-overlay-label" aria-hidden="true">
          요리 상세 보기 →
        </span>
      </a>
    </article>
  );
});
