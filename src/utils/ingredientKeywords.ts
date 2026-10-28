import { normalize } from './normalize.ts';

/** 재료 키워드 분리 */
export function parseIngredientKeywords(value: string): string[] {
  const unique = new Map<string, string>();
  for (const part of value.split(/[,，]/)) {
    const keyword = part.trim().normalize('NFC');
    const key = normalize(keyword);
    const shouldSkip = !key || unique.has(key);
    if (shouldSkip) continue;
    unique.set(key, keyword);
  }
  return [...unique.values()];
}

/** 입력 중 키워드 */
export const getActiveKeyword = (value: string): string =>
  value.split(/[,，]/).at(-1)?.trim().normalize('NFC') ?? '';

/** 자동완성 적용 */
export function completeIngredientKeyword(value: string, suggestion: string): string {
  const isEmptySuggestion = !suggestion;
  if (isEmptySuggestion) return '';
  const parts = value.split(/[,，]/);
  parts[parts.length - 1] = suggestion;
  return parseIngredientKeywords(parts.join(',')).join(', ');
}

/** 추천어 추가 */
export const appendIngredientKeyword = (value: string, keyword: string): string =>
  parseIngredientKeywords(value + ',' + keyword).join(', ');
