import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { searchRecipes, rankRecipe, queryTerms, compareRanked, queryKey } from '../src/services/recipeSearch.ts';
import { paginateRecipes, encodeCursor, decodeCursor } from '../src/services/pagination.ts';
import { getYouTubeRecipeUrl } from '../src/services/youtube.ts';
import { validateSources } from '../scripts/validate-recipes.ts';
import type { Recipe, SearchQuery } from '../src/types/recipe.ts';
const q:SearchQuery={flavors:[],ingredient:''};
const make=(id:string,name=id,ingredients=['두부'],seasonings=['고춧가루','다진 마늘']):Recipe=>({id,name,ingredients,seasonings,cuisine:'korean',flavors:['spicy','umami']});
const rows=[make('a','김치찌개',['김치','두부']),make('b','제육볶음',['돼지고기'],['고추장']),{...make('c','계란말이',['계란'],['소금']),flavors:['light']}];
test('맛 선택 및 여러 태그',()=>{assert.equal(searchRecipes(rows,{...q,flavors:['spicy']}).length,2);assert.equal(searchRecipes(rows,{...q,flavors:['umami']}).length,2);});
test('무조건 전체 조회',()=>assert.equal(searchRecipes(rows,q).length,3));
test('맛과 재료 AND',()=>{assert.deepEqual(searchRecipes(rows,{flavors:['spicy'],ingredient:'고추장'}).map(r=>r.recipe.id),['b']);assert.equal(searchRecipes(rows,{flavors:['light'],ingredient:'고추장'}).length,0);});
for(const [name,term,expected] of [['요리명 정확','김치찌개',0],['요리명 부분','찌개',1],['주재료 정확','두부',2],['양념 정확','고춧가루',3],['주재료 부분','부',4],['양념 부분','춧가',5]] as const)test(name,()=>assert.equal(rankRecipe(rows[0],queryTerms(term)),expected));
test('NFC 및 공백',()=>assert.equal(searchRecipes(rows,{...q,ingredient:'  '+ '김치'.normalize('NFD')+'  '}).length,1));
test('대소문자',()=>assert.equal(searchRecipes([make('english','TOFU')],{...q,ingredient:'tofu'}).length,1));
for(const [a,b] of [['고추가루','고춧가루'],['고춧가루','고추가루'],['다진마늘','다진 마늘'],['다진 마늘','다진마늘']])test('양방향 별칭 '+a,()=>assert.equal(searchRecipes([make('alias','테스트',[],[b])],{...q,ingredient:a}).length,1));
test('부분 검색 보존 및 비동의어 구분',()=>{assert.equal(searchRecipes([make('a','요리',[],['진간장'])],{...q,ingredient:'간장'}).length,1);assert.equal(rankRecipe(make('a','요리',[],['진간장']),queryTerms('간장')),5);assert.deepEqual(queryTerms('파'),['파']);});
test('6단계 관련도 및 이름·ID 정렬',()=>{const data=[make('f','요리',['알두부'],[]),make('e','요리',[],['두부소스']),make('d','요리',[],['두부']),make('c','요리',['두부'],[]),make('b','두부요리'),make('a','두부')];assert.deepEqual(searchRecipes(data,{...q,ingredient:'두부'}).map(r=>r.recipe.id),['a','b','c','d','f','e']);const same=searchRecipes([make('z','가'),make('a','가'),make('b','나')],q);assert.deepEqual(same.map(r=>r.recipe.id),['a','z','b']);assert.equal(compareRanked(same[0],same[1]),-1);});
for(const size of [0,1,29,30,31,60,61,109])test('Cursor 전체 순회 '+size,()=>{const data=searchRecipes(Array.from({length:size},(_,i)=>make('id'+String(i).padStart(3,'0'),'메뉴'+String(i).padStart(3,'0'))),q);const seen:string[]=[];let cursor:string|null=null;let pages=0;do{const page=paginateRecipes(data,q,'v1',cursor);assert.ok(page.items.length<=30);assert.equal(page.hasNext,!!page.nextCursor);seen.push(...page.items.map(r=>r.id));cursor=page.nextCursor;pages++;assert.ok(pages<=5);}while(cursor);assert.deepEqual(seen,data.map(r=>r.recipe.id));assert.equal(new Set(seen).size,size);});
test('Cursor 한국어 Base64URL',()=>{const c={version:'v1',queryKey:'매운',rank:2,name:'김치찌개',id:'a'};const encoded=encodeCursor(c);assert.match(encoded,/^[A-Za-z0-9_-]+$/);assert.deepEqual(decodeCursor(encoded),c);});
for(const cursor of ['!','abc','',encodeCursor({version:'v',queryKey:'',rank:-1,name:'',id:''})])test('잘못된 Cursor '+cursor,()=>assert.equal(decodeCursor(cursor),null));
test('검색 조건/버전 변경 시 첫 페이지',()=>{const data=searchRecipes(Array.from({length:61},(_,i)=>make(String(i))),q);const first=paginateRecipes(data,q,'v1');for(const [query,version,cursor] of [[{...q,flavors:['spicy']},'v1',first.nextCursor],[q,'v2',first.nextCursor],[q,'v1','!']] as const){assert.deepEqual(paginateRecipes(data,query,version,cursor).items,first.items);}});
for(const [name,ingredient,expected] of [['김치찌개','','김치찌개 레시피'],['제육볶음','고추장','제육볶음 고추장 레시피'],['볶음밥','굴소스','볶음밥 굴소스 레시피'],['된장찌개','두부','된장찌개 두부 레시피'],['계란볶음밥','계란','계란볶음밥 레시피']])test('YouTube '+expected,()=>{const url=new URL(getYouTubeRecipeUrl(name,ingredient));assert.equal(url.origin,'https://www.youtube.com');assert.equal(url.searchParams.get('search_query'),expected);assert.ok(!url.href.includes(' '));});
const source=()=>({cuisine:'korean',categories:{tofu:{name:'두부',recipes:[make('a')]}}});
test('데이터 검증 성공 및 이름 정규화',()=>{const s=source();s.categories.tofu.recipes[0].name=' 두부 '.normalize('NFD');assert.equal(validateSources([s],['spicy','umami'])[0].name,'두부');});
const invalidRecipeSources: [string, unknown][] = [
 ['중복 ID', {cuisine:'korean',categories:{tofu:{name:'두부',recipes:[make('a'),make('a','다른 이름')]}}}],
 ['필수 필드', {cuisine:'korean',categories:{tofu:{name:'두부',recipes:[{id:'a',name:'두부',flavors:['spicy'],seasonings:['소금']}]}}}],
 ['잘못된 맛', {cuisine:'korean',categories:{tofu:{name:'두부',recipes:[{...make('a'),flavors:['unknown']}]}}}],
 ['빈 이름', {cuisine:'korean',categories:{tofu:{name:'두부',recipes:[make('a','  ')]}}}],
 ['구조 오류', {cuisine:'korean',categories:[]}],
];
for(const [label, invalidSource] of invalidRecipeSources) test('검증 실패 '+label,()=>assert.throws(()=>validateSources([invalidSource],['spicy','umami'])));
test('잘못된 JSON 파싱 실패',()=>assert.throws(()=>JSON.parse('{broken')));
test('실제 인덱스 및 30개 초과 검색',async()=>{const data=JSON.parse(await readFile(new URL('../public/data/recipe_index.json',import.meta.url),'utf8')) as Recipe[];assert.equal(data.length,1000);assert.equal(new Set(data.map(r=>r.id)).size,1000);assert.ok(searchRecipes(data,{...q,ingredient:'간장'}).length>30);assert.equal(new Set(data.map(r=>r.cuisine)).size,7);});
test('새 탭 보안 속성',async()=>{const card=await readFile(new URL('../src/components/RecipeCard.tsx',import.meta.url),'utf8');assert.ok(card.includes('target="_blank"'));assert.ok(card.includes('rel="noopener noreferrer"'));});

test('복수 맛 OR 검색 및 중복 메뉴 방지',()=>{
 const found=searchRecipes(rows,{...q,flavors:['spicy','light']});
 assert.equal(found.length,3);
 assert.equal(new Set(found.map(r=>r.recipe.id)).size,3);
 assert.equal(searchRecipes(rows,{...q,flavors:['spicy','umami']}).length,2);
});
test('복수 맛과 재료 AND',()=>{
 assert.deepEqual(searchRecipes(rows,{flavors:['spicy','light'],ingredient:'고추장'}).map(r=>r.recipe.id),['b']);
 assert.equal(searchRecipes(rows,{flavors:['sweet','sour'],ingredient:'고추장'}).length,0);
});
test('맛 순서와 중복에 독립적인 검색 키',()=>{
 assert.equal(queryKey({ ...q,flavors:['spicy','light','spicy']}),queryKey({...q,flavors:['light','spicy']}));
 assert.notEqual(queryKey({...q,flavors:['spicy']}),queryKey({...q,flavors:['spicy','light']}));
});
test('복수 맛 Cursor 순회 및 조건 변경 초기화',()=>{
 const data=Array.from({length:61},(_,i)=>({...make(String(i).padStart(3,'0')),flavors:[i%2?'spicy':'light']}));
 const query={...q,flavors:['spicy','light']};
 const sorted=searchRecipes(data,query);
 const first=paginateRecipes(sorted,query,'v1');
 const second=paginateRecipes(sorted,{...q,flavors:['light','spicy']},'v1',first.nextCursor);
 assert.equal(first.items.length,30);assert.equal(second.items.length,30);
 assert.equal(new Set([...first.items,...second.items].map(r=>r.id)).size,60);
 const changed={...q,flavors:['spicy']};
 const filtered=searchRecipes(data,changed);
 assert.deepEqual(paginateRecipes(filtered,changed,'v1',first.nextCursor).items,paginateRecipes(filtered,changed,'v1').items);
 const third=paginateRecipes(sorted,query,'v1',second.nextCursor);
 assert.equal(third.items.length,1);assert.equal(third.nextCursor,null);
});
