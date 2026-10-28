import type { RecipeCursor, RecipePage, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { compareRanked, queryKey } from './recipeSearch.ts';
export const PAGE_SIZE=30;
export function encodeCursor(cursor: RecipeCursor): string {
 const bytes=new TextEncoder().encode(JSON.stringify(cursor));
 return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function decodeCursor(value: string): RecipeCursor | null {
 try {
  if(value.length>4096 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const raw=atob(value.replaceAll('-','+').replaceAll('_','/'));
  const c=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,x=>x.charCodeAt(0))));
  return c && typeof c.version==='string' && typeof c.queryKey==='string' && Number.isInteger(c.rank) && c.rank>=0 && c.rank<=5 && typeof c.name==='string' && typeof c.id==='string' ? c : null;
 }catch{return null;}
}
export function paginateRecipes(sorted: RankedRecipe[], query: SearchQuery, version: string, cursor?: string | null): RecipePage {
 const c=cursor ? decodeCursor(cursor) : null;
 const valid=c && c.version===version && c.queryKey===queryKey(query) && sorted.some(r=>r.rank===c.rank && r.recipe.name===c.name && r.recipe.id===c.id);
 const remaining=valid ? sorted.filter(r=>compareRanked(r,{rank:c.rank,recipe:{id:c.id,name:c.name,cuisine:'',flavors:[],ingredients:[],seasonings:[]}})>0) : sorted;
 const page=remaining.slice(0,PAGE_SIZE+1), hasNext=page.length>PAGE_SIZE;
 const items=page.slice(0,PAGE_SIZE); const last=items.at(-1);
 return {items:items.map(r=>r.recipe),hasNext,nextCursor:hasNext && last ? encodeCursor({version,queryKey:queryKey(query),rank:last.rank,name:last.recipe.name,id:last.recipe.id}) : null};
}
