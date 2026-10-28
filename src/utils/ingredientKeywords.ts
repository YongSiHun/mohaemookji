import { normalize } from './normalize.ts';

export function parseIngredientKeywords(value: string): string[] {
  const unique = new Map<string, string>();
  for (const part of value.split(/[,，]/)) {
    const keyword = part.trim().normalize('NFC');
    const key = normalize(keyword);
    if (key && !unique.has(key)) unique.set(key, keyword);
  }
  return [...unique.values()];
}

export const getActiveKeyword = (value: string): string => value.split(/[,，]/).at(-1)?.trim().normalize('NFC') ?? '';

export function completeIngredientKeyword(value: string, suggestion: string): string {
  if (!suggestion) return '';
  const parts = value.split(/[,，]/);
  parts[parts.length - 1] = suggestion;
  return parseIngredientKeywords(parts.join(',')).join(', ');
}

export const appendIngredientKeyword = (value: string, keyword: string): string => parseIngredientKeywords(value + ',' + keyword).join(', ');
