import type { Recipe, SearchQuery } from './recipe.ts';

export interface FlavorSelectorProps {
  selected: readonly string[];
  onChange: (flavors: string[]) => void;
}

export interface IngredientSearchProps {
  value: string;
  suggestions: readonly string[];
  onChange: (value: string) => void;
}

export interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}

export interface HighlightProps {
  text: string;
  keyword: string;
}

export interface IngredientLineProps {
  items: string[];
  keyword: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  keyword: string;
}

export interface MenuSearchPanelProps {
  draft: SearchQuery;
  suggestions: readonly string[];
  keywords: readonly string[];
  isReady: boolean;
  onDraftChange: (query: SearchQuery) => void;
  onSearch: (query: SearchQuery) => void;
  onRefreshKeywords: () => void;
}

export interface ActiveConditionsProps {
  query: SearchQuery;
  onApply: (query: SearchQuery, scroll?: boolean) => void;
}

export interface MenuResultsProps {
  recipes: Recipe[];
  keyword: string;
  isLoading: boolean;
  error: string;
  hasNext: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onReset: () => void;
}
