import type { MenuSearchState } from '../types/search.ts';
import type { Recipe, SearchQuery } from '../types/recipe.ts';
import flavors from '../../data/flavors.json' with { type: 'json' };
import { cuisineNames } from './cuisines.ts';

export const EMPTY_SEARCH_QUERY: SearchQuery = { flavors: [], ingredient: '' };
export const EMPTY_RECIPES: readonly Recipe[] = [];
export const PAGE_SIZE = 30;
export const FETCH_TIMEOUT_MS = 15_000;
export const MAX_CURSOR_LENGTH = 4096;
export const MAX_RECIPE_RANK = 5;
export const MAX_TEXT_LENGTH = 256;
export const MAX_LIST_LENGTH = 100;
export const MAX_RECIPE_COUNT = 20_000;
export const RECIPE_VERSION_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;
export const FLAVOR_IDS = new Set<string>(flavors.map((flavor) => flavor.id));
export const CUISINE_IDS = new Set(Object.keys(cuisineNames));

export const INITIAL_MENU_SEARCH_STATE: MenuSearchState = {
  draft: EMPTY_SEARCH_QUERY,
  applied: EMPTY_SEARCH_QUERY,
  visibleCount: PAGE_SIZE,
};

export const CARD_INGREDIENT_LIMIT = 3;
