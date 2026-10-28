import aliases from '../../data/ingredient_aliases.json' with { type: 'json' };
import { normalize } from '../utils/normalize.ts';

export const RECOMMENDED_KEYWORD_COUNT = 6;
export const SUGGESTION_LIMIT = 6;
export const RECOMMENDATION_POOL_LIMIT = 80;
export const MIN_KEYWORD_RECIPE_COUNT = 3;
export const INGREDIENT_INPUT_MAX_LENGTH = 100;
export const ALIAS_GROUPS = Object.entries(aliases).map(([canonical, variants]) =>
  [canonical, ...variants].map(normalize),
);
export const EXCLUDED_RECOMMENDATION_KEYWORDS = new Set([
  '소금',
  '굵은소금',
  '후추',
  '백후추',
  '설탕',
  '식용유',
  '물',
  '전분',
  '올리브유',
  '버터',
  '기버터',
  '라드',
]);
