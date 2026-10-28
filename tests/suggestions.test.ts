import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestionIndex, suggestSearchTerms } from '../src/services/searchSuggestions.ts';
import type { Recipe } from '../src/types/recipe.ts';
const recipes: Recipe[] = [
 {id:'stew',name:'김치찌개',cuisine:'korean',flavors:['spicy'],ingredients:['김치','두부'],seasonings:['고춧가루','다진 마늘']},
 {id:'rice',name:'김치볶음밥',cuisine:'korean',flavors:['spicy'],ingredients:['김치','밥'],seasonings:['간장']},
];
test('요리명·주재료·양념으로만 제안 인덱스 생성',()=>{
 const index=buildSuggestionIndex(recipes);
 assert.ok(index.includes('김치찌개'));assert.ok(index.includes('두부'));assert.ok(index.includes('고춧가루'));
 assert.equal(index.filter(value=>value==='김치').length,1);
 assert.ok(!index.includes('korean'));
});
test('입력한 검색어 제외 및 연관 검색어 개수 제한',()=>{
 const index=buildSuggestionIndex(recipes);
 assert.deepEqual(suggestSearchTerms(index,'김치'),['김치찌개','김치볶음밥']);
 assert.equal(suggestSearchTerms(index,'김',1).length,1);
 assert.deepEqual(suggestSearchTerms(index,'김',0),[]);
});
test('공백·NFC·대소문자 정규화',()=>{
 const index=buildSuggestionIndex(recipes);
 assert.deepEqual(suggestSearchTerms(index,' 김치 '.normalize('NFD')),suggestSearchTerms(index,'김치'));
 assert.deepEqual(suggestSearchTerms(['TOFU bowl'],' tofu '),['TOFU bowl']);
});
test('양방향 별칭 제안',()=>{
 const index=buildSuggestionIndex(recipes);
 assert.deepEqual(suggestSearchTerms(index,'고추가루'),['고춧가루']);
 assert.deepEqual(suggestSearchTerms(['고추가루'],'고춧가루'),['고추가루']);
 assert.deepEqual(suggestSearchTerms(index,'다진마늘'),['다진 마늘']);
});
test('빈 입력·일치 없음·결정적 접두어 우선 정렬',()=>{
 assert.deepEqual(suggestSearchTerms(['김치'],'   '),[]);
 assert.deepEqual(suggestSearchTerms(['김치'],'망고'),[]);
 assert.deepEqual(suggestSearchTerms(['참치 김치찌개','김치찌개'],'김치'),['김치찌개','참치 김치찌개']);
});
