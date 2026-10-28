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
test('실제 2,000개 데이터 버전·권역·동일 메뉴 중복 검증',async()=>{
 const content=await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8');
 const data=JSON.parse(content) as Recipe[];
 const manifest=JSON.parse(await readFile(new URL('../public/data/manifest.json',import.meta.url),'utf8'));
 assert.equal(data.length,2000);assert.equal(manifest.count,2000);
 assert.equal(manifest.version,createHash('sha256').update(content).digest('hex'));
 assert.equal(new Set(data.map(r=>r.id)).size,2000);
 assert.equal(new Set(data.map(r=>r.name.split('(')[0].replace(/[\s·ㆍ_-]/g,'').toLowerCase())).size,2000);
 const counts:Record<string,number>={};for(const recipe of data)counts[recipe.cuisine]=(counts[recipe.cuisine]??0)+1;
 assert.deepEqual(counts,{chinese:220,indian:130,japanese:250,korean:500,other:161,southeast_asian:140,western:599});
});
test('실제 2,000개 검색 결과 Cursor 전체 순회',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8')) as Recipe[];
 for(const query of [q,{...q,ingredient:'간장'},{...q,ingredient:'두부,고추가루'},{flavors:['spicy','savory'],ingredient:'마늘,간장'}]) {
  const sorted=searchRecipes(data,query);let cursor:string|null=null;const ids:string[]=[];let pages=0;
  do {const page=paginateRecipes(sorted,query,'v1',cursor);assert.ok(page.items.length<=30);ids.push(...page.items.map(r=>r.id));cursor=page.nextCursor;assert.ok(++pages<80);}while(cursor);
  assert.deepEqual(ids,sorted.map(r=>r.recipe.id));assert.equal(new Set(ids).size,ids.length);
 }
});

test('생소한 요리의 한글 설명과 다양한 식재료 검색',async()=>{
 const data=JSON.parse(await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8')) as Recipe[];
 assert.ok(data.some(r=>r.name==='가보차니모노(단호박 조림)'));
 assert.ok(searchRecipes(data,{...q,ingredient:'단호박 조림'}).some(r=>r.recipe.name.startsWith('가보차니모노')));
 for(const ingredient of ['타마린드','커리잎','화자오','타히니','들깻가루','그뤼에르치즈'])assert.ok(searchRecipes(data,{...q,ingredient}).length>0,ingredient);
 assert.ok(new Set(data.flatMap(r=>r.ingredients)).size>200);
 assert.ok(new Set(data.flatMap(r=>r.seasonings)).size>100);
});
