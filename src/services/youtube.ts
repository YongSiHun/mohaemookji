import { normalize } from '../utils/normalize.ts';
export function getYouTubeRecipeUrl(recipeName: string, ingredient=''): string {
 const keyword=ingredient.trim().normalize('NFC');
 const query=[recipeName,keyword && !normalize(recipeName).includes(normalize(keyword)) ? keyword : '', '레시피'].filter(Boolean).join(' ');
 return 'https://www.youtube.com/results?search_query='+encodeURIComponent(query);
}
