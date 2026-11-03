export interface RecipeAmount {
  name: string;
  amount?: string;
  optional?: boolean;
}
export interface RecipeReference {
  name: string;
  url: string;
}
export interface RecipeImage {
  src: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
}
export interface RecipeContent {
  introduction: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalMinutes?: number;
  timeNote?: string;
  servings: string;
  measurementNote?: string;
  ingredients: RecipeAmount[];
  seasonings: RecipeAmount[];
  steps: string[];
  tips?: string[];
  substitutions?: string[];
  storage?: string;
  sources: RecipeReference[];
}

export interface RecipeSource {
  id: string;
  name: string;
  flavors: string[];
  ingredients: string[];
  seasonings: string[];
  description?: string;
  slug?: string;
  image?: RecipeImage;
  content?: RecipeContent;
}
export interface Recipe extends RecipeSource {
  cuisine: string;
  category?: string;
}
export interface SearchQuery {
  flavors: readonly string[];
  ingredient: string;
}
export interface RankedRecipe {
  recipe: Recipe;
  rank: number;
}
export interface RecipeCursor {
  version: string;
  queryKey: string;
  rank: number;
  name: string;
  id: string;
}
export interface RecipePage {
  items: Recipe[];
  nextCursor: string | null;
  hasNext: boolean;
}
export interface RecipeData {
  recipes: Recipe[];
  version: string;
}

export interface RecipeManifest {
  version: string;
  count: number;
}

export interface RecipeSourceFile {
  cuisine: string;
  categories: Record<string, unknown>;
}

export interface RecipeSourceCategory {
  name: string;
  recipes: unknown[];
}
