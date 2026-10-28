export interface RecipeSource { id: string; name: string; flavors: string[]; ingredients: string[]; seasonings: string[] }
export interface Recipe extends RecipeSource { cuisine: string }
export interface SearchQuery { flavor: string; ingredient: string }
export interface RankedRecipe { recipe: Recipe; rank: number }
export interface RecipeCursor { version: string; queryKey: string; rank: number; name: string; id: string }
export interface RecipePage { items: Recipe[]; nextCursor: string | null; hasNext: boolean }
export interface RecipeData { recipes: Recipe[]; version: string }
