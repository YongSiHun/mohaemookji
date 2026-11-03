import { isRecord, isNonEmptyText } from '../utils/validation.ts';
import type { RecipeContent, RecipeImage } from '../types/recipe.ts';

export const RECIPE_SLUG_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const text = (v: unknown): v is string => isNonEmptyText(v) && v.length <= 2000;
const optionalText = (v: unknown) => v === undefined || text(v);
const list = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.length <= 30 && v.every(text);
const optionalList = (v: unknown) => v === undefined || list(v);
export function isReferenceUrl(value: unknown): value is string {
  const notText = typeof value !== 'string';
  if (notText) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
function isAmount(value: unknown): boolean {
  return (
    isRecord(value) &&
    text(value.name) &&
    optionalText(value.amount) &&
    (value.optional === undefined || typeof value.optional === 'boolean')
  );
}
function isAmounts(value: unknown, minimum = 1): boolean {
  return (
    Array.isArray(value) && value.length >= minimum && value.length <= 40 && value.every(isAmount)
  );
}
function isSource(value: unknown): boolean {
  return isRecord(value) && text(value.name) && isReferenceUrl(value.url);
}
function hasContentMetadata(v: Record<string, unknown>): boolean {
  const validTime =
    v.totalMinutes === undefined ||
    (Number.isInteger(v.totalMinutes) &&
      Number(v.totalMinutes) > 0 &&
      Number(v.totalMinutes) <= 2880);
  return (
    text(v.introduction) &&
    ['easy', 'medium', 'hard'].includes(String(v.difficulty)) &&
    text(v.servings) &&
    validTime &&
    optionalText(v.timeNote) &&
    optionalText(v.measurementNote)
  );
}
function hasContentAdvice(v: Record<string, unknown>): boolean {
  return optionalList(v.tips) && optionalList(v.substitutions) && optionalText(v.storage);
}
export function isRecipeContent(value: unknown): value is RecipeContent {
  const notRecord = !isRecord(value);
  if (notRecord) return false;
  return (
    hasContentMetadata(value) &&
    hasContentAdvice(value) &&
    isAmounts(value.ingredients) &&
    isAmounts(value.seasonings, 0) &&
    list(value.steps) &&
    Array.isArray(value.sources) &&
    value.sources.length > 0 &&
    value.sources.length <= 10 &&
    value.sources.every(isSource)
  );
}
export function isRecipeImage(value: unknown): value is RecipeImage {
  const notRecord = !isRecord(value);
  if (notRecord) return false;
  const localImage =
    typeof value.src === 'string' &&
    /^\/(?!\/)[a-zA-Z0-9_/-]+\.(?:avif|webp|png|jpe?g|svg)$/.test(value.src);
  return (
    localImage &&
    text(value.alt) &&
    text(value.credit) &&
    text(value.license) &&
    isReferenceUrl(value.sourceUrl) &&
    isReferenceUrl(value.licenseUrl)
  );
}
export function isRecipeExtension(value: Record<string, unknown>): boolean {
  const route = value.slug ?? value.id;
  const validSlug =
    typeof route === 'string' && route.length <= 100 && RECIPE_SLUG_PATTERN.test(route);
  const validContent = value.content === undefined || isRecipeContent(value.content);
  const validImage = value.image === undefined || isRecipeImage(value.image);
  return validSlug && validContent && validImage;
}
