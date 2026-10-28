import { normalize } from '../utils/normalize.ts';
import { parseIngredientKeywords } from '../utils/ingredientKeywords.ts';
import { queryTerms } from './recipeSearch.ts';
export function getYouTubeRecipeUrl(recipeName: string, ingredient=''): string {
 const name=normalize(recipeName);
 const keywords=parseIngredientKeywords(ingredient).filter(keyword=>!queryTerms(keyword).some(term=>name.includes(term)));
 const query=[recipeName,...keywords,'레시피'].join(' ');
 return 'https://www.youtube.com/results?search_query='+encodeURIComponent(query);
}
