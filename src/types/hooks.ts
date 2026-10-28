import type { IngredientSearchProps } from './components.ts';
import type { RecipeData } from './recipe.ts';

export interface RecipeLoadState {
  data: RecipeData | null;
  error: string;
}

export interface KeywordSelection {
  pool: readonly string[];
  keywords: string[];
}

export type IngredientAutocompleteOptions = IngredientSearchProps;
