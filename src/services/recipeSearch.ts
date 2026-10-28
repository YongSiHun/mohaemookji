import aliases from '../data/ingredient_aliases.json' with { type: 'json' };
import type { Recipe, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { normalize, compareText } from '../utils/normalize.ts';
import { parseIngredientKeywords } from '../utils/ingredientKeywords.ts';
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
export const queryKey = (q: SearchQuery): string => JSON.stringify([[...new Set(q.flavors)].sort(compareText),parseIngredientKeywords(q.ingredient).map(normalize).sort(compareText)]);
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
 const groups=parseIngredientKeywords(query.ingredient).map(queryTerms);
 return recipes.filter(recipe=>query.flavors.length===0 || query.flavors.some(flavor=>recipe.flavors.includes(flavor)))
  .map(recipe=>{
   const ranks=groups.map(terms=>rankRecipe(recipe,terms));
   const rank=ranks.some(value=>!Number.isFinite(value)) ? Infinity : ranks.length ? Math.min(...ranks) : 0;
   return {recipe,rank};
  }).filter(item=>Number.isFinite(item.rank)).sort(compareRanked);
}
