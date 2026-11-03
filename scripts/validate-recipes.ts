import { isRecipeExtension, RECIPE_SLUG_PATTERN } from '../src/services/recipeContentValidation.ts';
import type { Recipe, RecipeSourceFile, RecipeSourceCategory } from '../src/types/recipe.ts';
import type { SourceValidationContext } from '../src/types/validation.ts';
import { isRecord, isNonEmptyText } from '../src/utils/validation.ts';

/** 원본 오류 보고 */
function fail(context: SourceValidationContext, message: string): never {
  throw new Error('원본 ' + context.sourceIndex + ': ' + message);
}

/** 권역 구조 확인 */
function assertSource(
  source: unknown,
  context: SourceValidationContext,
): asserts source is RecipeSourceFile {
  const isNotRecord = !isRecord(source);
  if (isNotRecord) fail(context, 'cuisine/categories 구조 오류');
  const { cuisine, categories } = source;
  const hasInvalidStructure = !isNonEmptyText(cuisine) || !isRecord(categories);
  if (hasInvalidStructure) fail(context, 'cuisine/categories 구조 오류');
  const hasNoCategories = Object.keys(categories).length === 0;
  if (hasNoCategories) fail(context, 'cuisine/categories 구조 오류');
}

/** 카테고리 구조 확인 */
function assertCategory(
  value: unknown,
  category: string,
  context: SourceValidationContext,
): asserts value is RecipeSourceCategory {
  const isNotRecord = !isRecord(value);
  if (isNotRecord) fail(context, category + ' 카테고리 구조 오류');
  const { name, recipes } = value;
  const hasInvalidStructure = !isNonEmptyText(name) || !Array.isArray(recipes);
  if (hasInvalidStructure) fail(context, category + ' 카테고리 구조 오류');
  const hasNoRecipes = recipes.length === 0;
  if (hasNoRecipes) fail(context, category + ' 카테고리 구조 오류');
}

/** 필수 문자열 목록 */
function parseTextList(value: unknown, label: string, context: SourceValidationContext): string[] {
  const isInvalid = !Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyText);
  if (isInvalid) fail(context, label + ' 필수 배열 오류');
  return value.map((text) => text.trim().normalize('NFC'));
}

/** 메뉴 중복 확인 */
function registerIdentity(id: string, name: string, context: SourceValidationContext): void {
  const hasDuplicateId = context.ids.has(id);
  if (hasDuplicateId) fail(context, '중복 ID: ' + id);
  const nameKey = name
    .split('(')[0]
    .replace(/[\s·ㆍ_-]/g, '')
    .toLowerCase();
  const hasDuplicateName = context.names.has(nameKey);
  if (hasDuplicateName) fail(context, '중복 요리명: ' + name);
  context.ids.add(id);
  context.names.add(nameKey);
}

function parseExtension(
  raw: Record<string, unknown>,
  id: string,
  context: SourceValidationContext,
): Pick<Recipe, 'slug' | 'content' | 'image'> {
  const invalidExtension = !isRecipeExtension(raw);
  if (invalidExtension) fail(context, id + ' 상세 콘텐츠·이미지·slug 구조 오류');
  const routeId = typeof raw.slug === 'string' ? raw.slug : id;
  const invalidRoute = !RECIPE_SLUG_PATTERN.test(routeId);
  if (invalidRoute) fail(context, id + ' 상세 페이지 경로 오류');
  return {
    ...(typeof raw.slug === 'string' ? { slug: raw.slug } : {}),
    ...(raw.content !== undefined ? { content: raw.content as Recipe['content'] } : {}),
    ...(raw.image !== undefined ? { image: raw.image as Recipe['image'] } : {}),
  };
}

/** 원본 메뉴 파싱 */
function parseRecipe(
  raw: unknown,
  cuisine: string,
  category: string,
  context: SourceValidationContext,
): Recipe {
  const isNotRecord = !isRecord(raw);
  if (isNotRecord) fail(context, category + ' 요리 객체 오류');
  const { id: rawId, name: rawName } = raw;
  const hasInvalidIdentity = !isNonEmptyText(rawId) || !isNonEmptyText(rawName);
  if (hasInvalidIdentity) fail(context, category + ' 필수 id/name 누락 또는 빈 요리명');
  const id = rawId.trim();
  const name = rawName.trim().normalize('NFC');
  const flavors = parseTextList(raw.flavors, id + ' flavors', context);
  const ingredients = parseTextList(raw.ingredients, id + ' ingredients', context);
  const seasonings = parseTextList(raw.seasonings, id + ' seasonings', context);
  const hasUnknownFlavor = flavors.some((flavor) => !context.flavors.includes(flavor));
  if (hasUnknownFlavor) fail(context, id + ' 잘못된 맛 태그');
  const description = raw.description;
  const hasInvalidDescription =
    description !== undefined && (!isNonEmptyText(description) || description.length > 256);
  if (hasInvalidDescription) fail(context, id + ' description는 1~256자 문자열이어야 합니다');
  const extension = parseExtension(raw, id, context);
  registerIdentity(id, name, context);
  return {
    id,
    name,
    cuisine,
    category,
    flavors,
    ingredients,
    seasonings,
    ...extension,
    ...(typeof description === 'string'
      ? { description: description.trim().normalize('NFC') }
      : {}),
  };
}

/** 권역 메뉴 파싱 */
function parseSource(source: unknown, context: SourceValidationContext): Recipe[] {
  assertSource(source, context);
  return Object.entries(source.categories).flatMap(([category, value]) => {
    assertCategory(value, category, context);
    return value.recipes.map((raw) => parseRecipe(raw, source.cuisine, value.name, context));
  });
}

/** 원본 데이터 검증 */
export function validateSources(sources: unknown[], flavors: string[]): Recipe[] {
  const ids = new Set<string>();
  const names = new Set<string>();
  const recipes = sources.flatMap((source, sourceIndex) =>
    parseSource(source, { sourceIndex, flavors, ids, names }),
  );
  const paths = recipes.map((recipe) => recipe.slug ?? recipe.id);
  const duplicatePath = new Set(paths).size !== paths.length;
  if (duplicatePath) throw new Error('중복 상세 페이지 slug 또는 ID');
  return recipes;
}
