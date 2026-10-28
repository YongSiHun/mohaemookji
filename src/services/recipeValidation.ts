import {
  CUISINE_IDS,
  FLAVOR_IDS,
  MAX_TEXT_LENGTH,
  MAX_LIST_LENGTH,
  MAX_RECIPE_COUNT,
  MAX_RECIPE_RANK,
  RECIPE_VERSION_PATTERN,
} from '../constants/recipes.ts';
import type { Recipe, RecipeManifest, RecipeCursor } from '../types/recipe.ts';
import { isRecord, isNonEmptyText } from '../utils/validation.ts';

/** 제한 길이 문자열 */
function isText(value: unknown): value is string {
  return isNonEmptyText(value) && value.length <= MAX_TEXT_LENGTH;
}

/** 문자열 배열 확인 */
function isTextList(value: unknown): value is string[] {
  const isNotArray = !Array.isArray(value);
  if (isNotArray) return false;
  const hasValidLength = value.length > 0 && value.length <= MAX_LIST_LENGTH;
  return hasValidLength && value.every(isText);
}

/** 권역 확인 */
function isCuisine(value: unknown): value is string {
  return typeof value === 'string' && CUISINE_IDS.has(value);
}

/** 맛 태그 목록 확인 */
function isFlavorList(value: unknown): value is string[] {
  return isTextList(value) && value.every((id) => FLAVOR_IDS.has(id));
}

/** 메뉴 필드 검증 */
function isRecipe(value: unknown): value is Recipe {
  const isNotRecord = !isRecord(value);
  if (isNotRecord) return false;
  return (
    isText(value.id) &&
    isText(value.name) &&
    isCuisine(value.cuisine) &&
    isFlavorList(value.flavors) &&
    isTextList(value.ingredients) &&
    isTextList(value.seasonings)
  );
}

/** 버전 정보 검증 */
export function isRecipeManifest(value: unknown): value is RecipeManifest {
  const isNotRecord = !isRecord(value);
  if (isNotRecord) return false;
  const hasValidVersion =
    typeof value.version === 'string' && RECIPE_VERSION_PATTERN.test(value.version);
  const hasValidCount =
    typeof value.count === 'number' &&
    Number.isSafeInteger(value.count) &&
    value.count >= 0 &&
    value.count <= MAX_RECIPE_COUNT;
  return hasValidVersion && hasValidCount;
}

/** 메뉴 목록 검증 */
export function isRecipeIndex(value: unknown, count: number): value is Recipe[] {
  const isNotArray = !Array.isArray(value);
  if (isNotArray) return false;
  const hasWrongCount = value.length !== count;
  if (hasWrongCount) return false;
  const hasInvalidEntries = !value.every(isRecipe);
  if (hasInvalidEntries) return false;
  return new Set(value.map((recipe) => recipe.id)).size === value.length;
}

/** 페이지 커서 검증 */
export function isRecipeCursor(value: unknown): value is RecipeCursor {
  const isNotRecord = !isRecord(value);
  if (isNotRecord) return false;
  const hasValidRank =
    typeof value.rank === 'number' &&
    Number.isInteger(value.rank) &&
    value.rank >= 0 &&
    value.rank <= MAX_RECIPE_RANK;
  return (
    hasValidRank &&
    typeof value.version === 'string' &&
    typeof value.queryKey === 'string' &&
    typeof value.name === 'string' &&
    typeof value.id === 'string'
  );
}
