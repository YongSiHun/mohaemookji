import { Fragment } from 'react';
import type { Recipe } from '../types/recipe';
import flavors from '../data/flavors.json';
import { queryTerms } from '../services/recipeSearch';
import { normalize } from '../utils/normalize';
import { parseIngredientKeywords } from '../utils/ingredientKeywords';
import { getYouTubeRecipeUrl } from '../services/youtube';
export const cuisineNames: Record<string,string>={korean:'한식',chinese:'중식',japanese:'일식',western:'양식',southeast_asian:'동남아 요리',indian:'인도 요리',other:'기타'};
export function Highlight({text,keyword}:{text:string;keyword:string}) {
 const normalized=normalize(text), spans: [number,number][]=[];
 for(const term of parseIngredientKeywords(keyword).flatMap(queryTerms)) { let from=0; while(from<normalized.length) { const at=normalized.indexOf(term,from); if(at<0) break; spans.push([at,at+term.length]); from=at+term.length; } }
 spans.sort((a,b)=>a[0]-b[0]); const merged: [number,number][]=[];
 for(const span of spans) {const last=merged.at(-1); if(last && span[0]<=last[1]) last[1]=Math.max(last[1],span[1]); else merged.push([...span]);}
 const content=[]; let start=0;
 for(const [a,b] of merged) {content.push(<Fragment key={a}>{text.slice(start,a)}<mark>{text.slice(a,b)}</mark></Fragment>);start=b;}
 return <>{content}{text.slice(start)}</>;
}
function IngredientLine({items,keyword}:{items:string[];keyword:string}) {
 return <>{items.slice(0,3).map((item,i)=><Fragment key={item}>{i>0 && ' · '}<Highlight text={item} keyword={keyword}/></Fragment>)}{items.length>3 && <span className="extra"> 외 {items.length-3}개</span>}</>;
}
export function RecipeCard({recipe,keyword}:{recipe:Recipe;keyword:string}) {
 return <article className="recipe-card"><div className="card-top"><span className="cuisine">{cuisineNames[recipe.cuisine]}</span><span className="card-decoration" aria-hidden="true">↗</span></div><h3><Highlight text={recipe.name} keyword={keyword}/></h3><div className="card-flavors">{recipe.flavors.map(f=><span key={f}>{flavors.find(v=>v.id===f)?.name}</span>)}</div><dl><div><dt>주재료</dt><dd><IngredientLine items={recipe.ingredients} keyword={keyword}/></dd></div><div><dt>양념 · 소스</dt><dd><IngredientLine items={recipe.seasonings} keyword={keyword}/></dd></div></dl><a className="recipe-overlay" href={getYouTubeRecipeUrl(recipe.name,keyword)} target="_blank" rel="noopener noreferrer" aria-label={recipe.name+' 유튜브 레시피 보기 (새 탭)'}><span className="recipe-overlay-label" aria-hidden="true"><svg viewBox="0 0 24 18" aria-hidden="true"><rect width="24" height="18" rx="5" fill="currentColor"/><path d="m10 5 6 4-6 4Z" fill="white"/></svg>유튜브 레시피 보기<span>↗</span></span></a></article>;
}
