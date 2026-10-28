import type { RecipeData, Recipe } from '../types/recipe.ts';
let cached: Promise<RecipeData> | undefined;
export function loadRecipes(): Promise<RecipeData> {
 cached ??= (async()=>{
  const manifestResponse=await fetch('/data/manifest.json',{cache:'no-cache'});
  if(!manifestResponse.ok) throw new Error('검색 데이터 버전을 가져오지 못했어요.');
  const manifest=await manifestResponse.json() as {version:string;count:number};
  if(typeof manifest.version!=='string' || typeof manifest.count!=='number') throw new Error('검색 데이터 정보가 올바르지 않아요.');
  const response=await fetch('/data/recipe_index.json?v='+encodeURIComponent(manifest.version),{cache:'no-cache'});
  if(!response.ok) throw new Error('검색 데이터를 가져오지 못했어요.');
  const recipes=await response.json() as Recipe[];
  if(!Array.isArray(recipes) || recipes.length!==manifest.count) throw new Error('검색 데이터가 올바르지 않아요. 다시 시도해 주세요.');
  return {recipes,version:manifest.version};
 })().catch(e=>{cached=undefined;throw e;});
 return cached;
}
