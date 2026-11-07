import { removeFlavor } from '../services/flavorSelection';
import type { ActiveConditionsProps } from '../types/components';
import { getFlavorName } from '../services/flavorCatalog';
import { EMPTY_SEARCH_QUERY } from '../constants/recipes';
import { parseIngredientKeywords } from '../utils/ingredientKeywords';

/** 검색 조건 표시 */
export function ActiveConditions({ query, onApply }: ActiveConditionsProps) {
  const keywords = parseIngredientKeywords(query.ingredient);
  const hasNoConditions = query.flavors.length === 0 && !query.ingredient;
  if (hasNoConditions)
    return (
      <div className="active-conditions">
        <span className="all-label">모든 메뉴를 둘러보고 있어요</span>
      </div>
    );
  return (
    <div className="active-conditions">
      <>
        <span className="condition-label">적용된 조건</span>
        {query.flavors.map((flavor) => (
          <button
            key={flavor}
            aria-label={getFlavorName(flavor) + ' 맛 조건 제거'}
            onClick={() => onApply(removeFlavor(query, flavor), false)}
          >
            {getFlavorName(flavor)}
            {query.flavorLevels?.[flavor] && (
              <span className="condition-flavor-level">
                {'★'.repeat(query.flavorLevels[flavor])} {query.flavorLevels[flavor]}/5
              </span>
            )}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        {keywords.map((keyword) => (
          <button
            key={keyword}
            aria-label={keyword + ' 검색 조건 제거'}
            onClick={() =>
              onApply(
                {
                  ...query,
                  ingredient: keywords.filter((value) => value !== keyword).join(', '),
                },
                false,
              )
            }
          >
            {keyword}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <button className="reset" onClick={() => onApply(EMPTY_SEARCH_QUERY, false)}>
          초기화
        </button>
      </>
    </div>
  );
}
