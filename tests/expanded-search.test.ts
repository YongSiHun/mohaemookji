import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseIngredientKeywords, getActiveKeyword, completeIngredientKeyword, appendIngredientKeyword } from '../src/utils/ingredientKeywords.ts';
import { searchRecipes, queryKey } from '../src/services/recipeSearch.ts';
import { paginateRecipes } from '../src/services/pagination.ts';
import { getYouTubeRecipeUrl } from '../src/services/youtube.ts';
import { buildSuggestionIndex, suggestSearchTerms } from '../src/services/searchSuggestions.ts';
import { buildRecommendationPool, pickRecommendedKeywords } from '../src/services/recommendedKeywords.ts';
import type { Recipe } from '../src/types/recipe.ts';
const q={flavors:[],ingredient:''};
const recipes:Recipe[]=[
 {id:'a',name:'김치찌개',cuisine:'korean',flavors:['spicy'],ingredients:['김치','두부'],seasonings:['고춧가루','다진 마늘']},
 {id:'b',name:'두부부침',cuisine:'korean',flavors:['savory'],ingredients:['두부'],seasonings:['소금','식용유']},
 {id:'c',name:'김치볶음밥',cuisine:'korean',flavors:['spicy'],ingredients:['김치','밥'],seasonings:['간장','참기름']},
];
test('쉼표 입력 정규화·중복·빈 구간',()=>{
 assert.deepEqual(parseIngredientKeywords(' 두부, ,김치,두부, '),['두부','김치']);
 assert.deepEqual(parseIngredientKeywords('TOFU, tofu, 김치'.normalize('NFD')),['TOFU','김치']);
 assert.deepEqual(parseIngredientKeywords('두부，김치'),['두부','김치']);
});
test('여러 재료 AND 검색',()=>{
 assert.deepEqual(searchRecipes(recipes,{...q,ingredient:'김치,두부'}).map(r=>r.recipe.id),['a']);
 assert.equal(searchRecipes(recipes,{...q,ingredient:'김치,새우'}).length,0);
 assert.deepEqual(searchRecipes(recipes,{...q,ingredient:'김치,고추가루,다진마늘'}).map(r=>r.recipe.id),['a']);
 assert.equal(searchRecipes(recipes,{flavors:['savory'],ingredient:'김치,두부'}).length,0);
 assert.equal(searchRecipes(recipes,{...q,ingredient:', ,'}).length,3);
});
test('재료 순서·중복에 독립적인 Cursor 키',()=>{
 assert.equal(queryKey({...q,ingredient:'김치, 두부,김치'}),queryKey({...q,ingredient:'두부, 김치'}));
});
test('마지막 재료 자동완성·기존 입력 보존',()=>{
 const index=buildSuggestionIndex(recipes);
 assert.equal(getActiveKeyword('김치, 고추'),'고추');
 assert.deepEqual(suggestSearchTerms(index,'김치,고추가루'),['고춧가루']);
 assert.ok(!suggestSearchTerms(index,'김치,김').includes('김치'));
 assert.equal(completeIngredientKeyword('김치, 고추','고춧가루'),'김치, 고춧가루');
 assert.equal(completeIngredientKeyword('김치, ','두부'),'김치, 두부');
 assert.equal(completeIngredientKeyword('김치, 김','김치'),'김치');
 assert.equal(completeIngredientKeyword('김치, 두부',''),'');
 assert.equal(appendIngredientKeyword('김치','두부'),'김치, 두부');
 assert.equal(appendIngredientKeyword('김치','김치'),'김치');
});
test('유튜브 쿼리에 여러 재료 반영 및 중복 제거',()=>{
 const url=new URL(getYouTubeRecipeUrl('김치찌개','김치, 두부,고추장,두부'));
 assert.equal(url.searchParams.get('search_query'),'김치찌개 두부 고추장 레시피');
 assert.equal(new URL(getYouTubeRecipeUrl('계란볶음밥','달걀, 굴소스')).searchParams.get('search_query'),'계란볶음밥 굴소스 레시피');
});
test('추천은 실제 재료와 양념으로 구성',()=>{
 const pool=buildRecommendationPool(recipes);
 const ingredients=new Set(recipes.flatMap(r=>[...r.ingredients,...r.seasonings]));
 assert.ok(pool.every(keyword=>ingredients.has(keyword)));
 assert.ok(!pool.includes('김치찌개'));assert.ok(!pool.includes('소금'));
});
test('추천 개수 제한·중복 방지·기존 제안 교체',()=>{
 const pool=Array.from({length:20},(_,i)=>'재료'+i);
 const before=[...pool];
 const first=pickRecommendedKeywords(pool,6,[],()=>0.3);
 const next=pickRecommendedKeywords(pool,6,first,()=>0.3);
 assert.equal(first.length,6);assert.equal(new Set(first).size,6);
 assert.ok(next.every(keyword=>!first.includes(keyword)));
 assert.deepEqual(pool,before);
 assert.deepEqual(pickRecommendedKeywords([],6),[]);
 assert.equal(pickRecommendedKeywords(['두부','두부'],6).length,1);
});
test('실제 1,000개 데이터 버전·권역·동일 메뉴 중복 검증',async()=>{
 const content=await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8');
 const data=JSON.parse(content) as Recipe[];
 const manifest=JSON.parse(await readFile(new URL('../public/data/manifest.json',import.meta.url),'utf8'));
 assert.equal(data.length,1000);assert.equal(manifest.count,1000);
 assert.equal(manifest.version,createHash('sha256').update(content).digest('hex'));
 assert.equal(new Set(data.map(r=>r.id)).size,1000);
 assert.equal(new Set(data.map(r=>r.name.replace(/\s/g,''))).size,1000);
 const counts:Record<string,number>={};for(const recipe of data)counts[recipe.cuisine]=(counts[recipe.cuisine]??0)+1;
 assert.deepEqual(counts,{chinese:120,indian:50,japanese:150,korean:350,other:60,southeast_asian:70,western:200});
});
test('실제 1,000개 검색 결과 Cursor 전체 순회',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8')) as Recipe[];
 for(const query of [q,{...q,ingredient:'간장'},{...q,ingredient:'두부,고추가루'},{flavors:['spicy','savory'],ingredient:'마늘,간장'}]) {
  const sorted=searchRecipes(data,query);let cursor:string|null=null;const ids:string[]=[];let pages=0;
  do {const page=paginateRecipes(sorted,query,'v1',cursor);assert.ok(page.items.length<=30);ids.push(...page.items.map(r=>r.id));cursor=page.nextCursor;assert.ok(++pages<40);}while(cursor);
  assert.deepEqual(ids,sorted.map(r=>r.recipe.id));assert.equal(new Set(ids).size,ids.length);
 }
});
