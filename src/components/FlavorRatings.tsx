import flavors from '../../data/flavors.json' with { type: 'json' };
import type { Recipe } from '../types/recipe';

/** 별은 평점이 아닌 해당 맛의 예상 강도다. */
export function FlavorRatings({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flavor-ratings" aria-label="예상 맛 강도">
      {recipe.flavors.map((id) => {
        const name = flavors.find((flavor) => flavor.id === id)?.name ?? id;
        const level = recipe.flavorLevels?.[id];
        return (
          <span
            className="flavor-rating"
            key={id}
            aria-label={level ? name + ' 맛 강도 ' + level + '/5 (예상)' : name}
          >
            <span>{name}</span>
            {level && (
              <span className="flavor-stars" aria-hidden="true">
                {'★'.repeat(level)}
                <span className="flavor-stars-empty">{'☆'.repeat(5 - level)}</span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
