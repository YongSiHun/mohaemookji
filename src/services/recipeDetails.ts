import type { Recipe } from '../types/recipe.ts';
import { cuisineNames } from '../constants/cuisines.ts';

export const difficultyNames = { easy: '쉬움', medium: '보통', hard: '어려움' } as const;
export const getRecipeSlug = (recipe: Recipe): string => recipe.slug ?? recipe.id;
export const getRecipePath = (recipe: Recipe): string =>
  '/recipes/' + encodeURIComponent(getRecipeSlug(recipe)) + '/';
export function findRecipeByPath(recipes: readonly Recipe[], path: string): Recipe | undefined {
  return recipes.find(
    (recipe) => getRecipePath(recipe) === (path.endsWith('/') ? path : path + '/'),
  );
}
export function getRecipeMetadata(recipe: Recipe) {
  return {
    path: getRecipePath(recipe),
    title:
      recipe.name + (recipe.content ? ' 재료와 조리법 | 모해묵지' : ' 재료와 메뉴 안내 | 모해묵지'),
    description: (
      recipe.content?.introduction ??
      recipe.description ??
      recipe.name +
        '의 대표 재료 ' +
        recipe.ingredients.join(', ') +
        '과 맛의 특징을 확인하고 관련 메뉴를 비교해보세요.'
    )
      .replace(/\s+/g, ' ')
      .slice(0, 155),
  };
}
/** 사용 권한이 기재된 사진·조리 본문·실제 origin이 있을 때만 Recipe 출력 */
export function getRecipeStructuredData(recipe: Recipe, origin: string) {
  const content = recipe.content;
  const image = recipe.image;
  const unavailable = !content || !image || !origin;
  if (unavailable) return undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    description: content.introduction,
    image: [new URL(image.src, origin).href],
    url: origin + getRecipePath(recipe),
    recipeCuisine: cuisineNames[recipe.cuisine],
    recipeYield: content.servings,
    ...(content.totalMinutes ? { totalTime: 'PT' + content.totalMinutes + 'M' } : {}),
    recipeIngredient: [...content.ingredients, ...content.seasonings].map(
      (item) =>
        item.name + (item.amount ? ' ' + item.amount : '') + (item.optional ? ' (선택)' : ''),
    ),
    recipeInstructions: content.steps.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text,
      url: origin + getRecipePath(recipe) + '#step-' + (i + 1),
    })),
    citation: content.sources.map((source) => source.url),
  };
}
export const serializeStructuredData = (value: unknown): string =>
  JSON.stringify(value).replaceAll('<', '\\u003c');
