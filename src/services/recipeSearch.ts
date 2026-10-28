import aliases from '../data/ingredient_aliases.json' with { type: 'json' };
import type { Recipe, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
export function queryTerms(keyword: string): string[] {
 const q=normalize(keyword); if(!q) return [];
 const terms=new Set([q]);
 for(const [canonical, variants] of Object.entries(aliases)) {
  const group=[canonical,...variants].map(normalize);
  // Expand full aliases, including when they occur within a longer query.
  for(const from of group) if(q.includes(from)) for(const to of group) terms.add(q.replaceAll(from,to));
 }
 return [...terms];
}
export const queryKey = (q: SearchQuery): string => JSON.stringify([q.flavor,normalize(q.ingredient)]);
export function rankRecipe(recipe: Recipe, terms: string[]): number {
 if(!terms.length) return 0;
 const name=normalize(recipe.name), ingredients=recipe.ingredients.map(normalize), seasonings=recipe.seasonings.map(normalize);
 const exact=(s:string)=>terms.includes(s), partial=(s:string)=>terms.some(t=>s.includes(t));
 if(exact(name)) return 0; if(partial(name)) return 1;
 if(ingredients.some(exact)) return 2; if(seasonings.some(exact)) return 3;
 if(ingredients.some(partial)) return 4; if(seasonings.some(partial)) return 5;
 return Infinity;
}
export const compareRanked = (a: RankedRecipe, b: RankedRecipe): number => a.rank-b.rank || compareText(a.recipe.name,b.recipe.name) || compareText(a.recipe.id,b.recipe.id);
export function searchRecipes(recipes: Recipe[], query: SearchQuery): RankedRecipe[] {
 const terms=queryTerms(query.ingredient);
 return recipes.filter(r=>!query.flavor || r.flavors.includes(query.flavor)).map(recipe=>({recipe,rank:rankRecipe(recipe,terms)})).filter(r=>Number.isFinite(r.rank)).sort(compareRanked);
}
