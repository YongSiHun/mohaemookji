import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  parseIngredientKeywords,
  getActiveKeyword,
  completeIngredientKeyword,
  appendIngredientKeyword,
} from '../src/utils/ingredientKeywords.ts';
import { searchRecipes, queryKey } from '../src/services/recipeSearch.ts';
import { paginateRecipes } from '../src/services/pagination.ts';
import { getYouTubeRecipeUrl } from '../src/services/youtube.ts';
import { buildSuggestionIndex, suggestSearchTerms } from '../src/services/searchSuggestions.ts';
import {
  buildRecommendationPool,
  pickRecommendedKeywords,
} from '../src/services/recommendedKeywords.ts';
import type { Recipe } from '../src/types/recipe.ts';
const q = { flavors: [], ingredient: '' };
const recipes: Recipe[] = [
  {
    id: 'a',
    name: '김치찌개',
    cuisine: 'korean',
    flavors: ['spicy'],
    ingredients: ['김치', '두부'],
    seasonings: ['고춧가루', '다진 마늘'],
  },
  {
    id: 'b',
    name: '두부부침',
    cuisine: 'korean',
    flavors: ['savory'],
    ingredients: ['두부'],
    seasonings: ['소금', '식용유'],
  },
  {
    id: 'c',
    name: '김치볶음밥',
    cuisine: 'korean',
    flavors: ['spicy'],
    ingredients: ['김치', '밥'],
    seasonings: ['간장', '참기름'],
  },
];
test('쉼표 입력 정규화·중복·빈 구간', () => {
  assert.deepEqual(parseIngredientKeywords(' 두부, ,김치,두부, '), ['두부', '김치']);
  assert.deepEqual(parseIngredientKeywords('TOFU, tofu, 김치'.normalize('NFD')), ['TOFU', '김치']);
  assert.deepEqual(parseIngredientKeywords('두부，김치'), ['두부', '김치']);
});
test('여러 재료·소스 검색어가 모두 일치해야 검색한다', () => {
  const ids = (ingredient: string) =>
    searchRecipes(recipes, { ...q, ingredient })
      .map((item) => item.recipe.id)
      .sort();
  assert.deepEqual(ids('김치,두부'), ['a']);
  assert.deepEqual(ids('김치,새우'), []);
  assert.deepEqual(ids('김치,고추가루,다진마늘'), ['a']);
  assert.deepEqual(ids('소금,고추가루'), []);
  assert.deepEqual(ids('두부,간장'), []);
  assert.deepEqual(ids('새우,굴소스'), []);
  assert.deepEqual(ids(', ,'), ['a', 'b', 'c']);
  assert.deepEqual(
    searchRecipes(recipes, { flavors: ['savory'], ingredient: '김치,두부' }).map(
      (item) => item.recipe.id,
    ),
    [],
  );
  assert.deepEqual(ids('두부,소금'), ['b']);
});
test('검색은 주재료·소스의 첫 항목뿐 아니라 전체 목록을 검사한다', () => {
  const rows = [
    {
      ...recipes[0],
      name: '테스트 메뉴',
      ingredients: ['밥', '두부'],
      seasonings: ['후추', '굴소스'],
    },
  ];
  for (const ingredient of ['두부', '굴소스', '두부,굴소스']) {
    assert.equal(searchRecipes(rows, { ...q, ingredient }).length, 1);
  }
  assert.equal(searchRecipes(rows, { ...q, ingredient: '새우,설탕' }).length, 0);
  assert.equal(searchRecipes(rows, { ...q, ingredient: '없는재료,굴소스' }).length, 0);
});
test('재료 순서·중복에 독립적인 Cursor 키', () => {
  assert.equal(
    queryKey({ ...q, ingredient: '김치, 두부,김치' }),
    queryKey({ ...q, ingredient: '두부, 김치' }),
  );
});
test('마지막 재료 자동완성·기존 입력 보존', () => {
  const index = buildSuggestionIndex(recipes);
  assert.equal(getActiveKeyword('김치, 고추'), '고추');
  assert.deepEqual(suggestSearchTerms(index, '김치,고추가루'), ['고춧가루']);
  assert.ok(!suggestSearchTerms(index, '김치,김').includes('김치'));
  assert.equal(completeIngredientKeyword('김치, 고추', '고춧가루'), '김치, 고춧가루');
  assert.equal(completeIngredientKeyword('김치, ', '두부'), '김치, 두부');
  assert.equal(completeIngredientKeyword('김치, 김', '김치'), '김치');
  assert.equal(completeIngredientKeyword('김치, 두부', ''), '');
  assert.equal(appendIngredientKeyword('김치', '두부'), '김치, 두부');
  assert.equal(appendIngredientKeyword('김치', '김치'), '김치');
});
test('유튜브 쿼리에 여러 재료 반영 및 중복 제거', () => {
  const url = new URL(getYouTubeRecipeUrl('김치찌개', '김치, 두부,고추장,두부'));
  assert.equal(url.searchParams.get('search_query'), '김치찌개 두부 고추장 레시피');
  assert.equal(
    new URL(getYouTubeRecipeUrl('계란볶음밥', '달걀, 굴소스')).searchParams.get('search_query'),
    '계란볶음밥 굴소스 레시피',
  );
});
test('추천은 실제 재료와 양념으로 구성', () => {
  const pool = buildRecommendationPool(recipes);
  const ingredients = new Set(recipes.flatMap((r) => [...r.ingredients, ...r.seasonings]));
  assert.ok(pool.every((keyword) => ingredients.has(keyword)));
  assert.ok(!pool.includes('김치찌개'));
  assert.ok(!pool.includes('소금'));
});
test('추천 개수 제한·중복 방지·기존 제안 교체', () => {
  const pool = Array.from({ length: 20 }, (_, i) => '재료' + i);
  const before = [...pool];
  const first = pickRecommendedKeywords(pool, 6, [], () => 0.3);
  const next = pickRecommendedKeywords(pool, 6, first, () => 0.3);
  assert.equal(first.length, 6);
  assert.equal(new Set(first).size, 6);
  assert.ok(next.every((keyword) => !first.includes(keyword)));
  assert.deepEqual(pool, before);
  assert.deepEqual(pickRecommendedKeywords([], 6), []);
  assert.equal(pickRecommendedKeywords(['두부', '두부'], 6).length, 1);
});
test('실제 2,450개 데이터 버전·권역·동일 메뉴 중복 검증', async () => {
  const content = await readFile(
    new URL('../public/data/recipe_index.json', import.meta.url),
    'utf8',
  );
  const data = JSON.parse(content) as Recipe[];
  const manifest = JSON.parse(
    await readFile(new URL('../public/data/manifest.json', import.meta.url), 'utf8'),
  );
  assert.equal(data.length, 2450);
  assert.equal(manifest.count, 2450);
  assert.equal(manifest.version, createHash('sha256').update(content).digest('hex'));
  assert.equal(new Set(data.map((r) => r.id)).size, 2450);
  assert.equal(
    new Set(
      data.map((r) =>
        r.name
          .split('(')[0]
          .replace(/[\s·ㆍ_-]/g, '')
          .toLowerCase(),
      ),
    ).size,
    2450,
  );
  const counts: Record<string, number> = {};
  for (const recipe of data) counts[recipe.cuisine] = (counts[recipe.cuisine] ?? 0) + 1;
  assert.deepEqual(counts, {
    chinese: 220,
    indian: 130,
    japanese: 250,
    korean: 712,
    other: 310,
    southeast_asian: 140,
    western: 688,
  });
});
test('실제 2,450개 검색 결과 Cursor 전체 순회', async () => {
  const data = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  for (const query of [
    q,
    { ...q, ingredient: '간장' },
    { ...q, ingredient: '두부,고추가루' },
    { flavors: ['spicy', 'savory'], ingredient: '마늘,간장' },
  ]) {
    const sorted = searchRecipes(data, query);
    let cursor: string | null = null;
    const ids: string[] = [];
    let pages = 0;
    do {
      const page = paginateRecipes(sorted, query, 'v1', cursor);
      assert.ok(page.items.length <= 30);
      ids.push(...page.items.map((r) => r.id));
      cursor = page.nextCursor;
      assert.ok(++pages <= Math.max(1, Math.ceil(sorted.length / 30)));
    } while (cursor);
    assert.deepEqual(
      ids,
      sorted.map((r) => r.recipe.id),
    );
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('생소한 요리의 한글 설명과 다양한 식재료 검색', async () => {
  const data = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  assert.ok(data.some((r) => r.name === '가보차니모노(단호박 조림)'));
  assert.ok(
    searchRecipes(data, { ...q, ingredient: '단호박 조림' }).some((r) =>
      r.recipe.name.startsWith('가보차니모노'),
    ),
  );
  for (const ingredient of ['타마린드', '커리잎', '화자오', '타히니', '들깻가루', '그뤼에르치즈'])
    assert.ok(searchRecipes(data, { ...q, ingredient }).length > 0, ingredient);
  assert.ok(new Set(data.flatMap((r) => r.ingredients)).size > 200);
  assert.ok(new Set(data.flatMap((r) => r.seasonings)).size > 100);
});

test('퓨전·이색 메뉴를 재료와 소스 조합으로 찾고 초장 별칭을 지원한다', async () => {
  const data = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  for (const [ingredient, name] of [
    ['소고기,참소스', '참소스 소고기 샐러드'],
    ['고수,옥수수', '고수 옥수수전'],
    ['당근,하리사소스', '하리사 당근 병아리콩구이'],
    ['소면,된장,타히니', '된장 타히니 비빔면'],
    ['문어,폰즈소스', '폰즈 문어 오이샐러드'],
    ['두부,스위트칠리소스,식용유', '바삭한 두부 칠리바이트'],
    ['닭고기,데리야키소스', '데리야키 단호박 치킨'],
    ['밥,케찹마니스', '케찹마니스 돼지고기덮밥'],
    ['김,스파게티,참기름', '김파스타'],
    ['돼지껍데기,토르티야', '돼지껍데기 퀘사디아'],
    ['피자 도우,명란', '명란 감자 피자'],
    ['오리고기,쌀,김치', '오리고기 김치 리소토'],
    ['양고기,김치,토르티야', '양고기 김치 타코'],
    ['새우,초장', '초장 새우 냉파스타'],
    ['새우,초고추장', '초장 새우 냉파스타'],
    ['고수,멸치액젓', '고수김치'],
    ['수박껍질,고춧가루', '수박껍질김치'],
    ['아보카도,간장', '아보카도장'],
    ['김치,땅콩버터', '김치 땅콩버터 비빔면'],
    ['딸기,바질,초고추장', '딸기 바질 비빔국수'],
  ]) {
    const found = searchRecipes(data, { ...q, ingredient });
    assert.ok(
      found.some(({ recipe }) => recipe.name === name && recipe.cuisine === 'other'),
      ingredient,
    );
  }
  const ids = (ingredient: string) =>
    searchRecipes(data, { ...q, ingredient })
      .map(({ recipe }) => recipe.id)
      .sort();
  assert.deepEqual(ids('초장'), ids('초고추장'));
  assert.ok(ids('초장').length > 0);
  assert.ok(
    searchRecipes(data, {
      flavors: ['spicy', 'sweet_sour'],
      flavorLevels: { spicy: 3, sweet_sour: 4 },
      ingredient: '새우,초고추장',
    }).some(({ recipe }) => recipe.name === '초장 새우 냉파스타'),
  );
  const suggestions = buildSuggestionIndex(data);
  assert.ok(suggestSearchTerms(suggestions, '참소').includes('참소스'));
  assert.ok(suggestSearchTerms(suggestions, '초고추장').includes('초장'));
  assert.ok(suggestSearchTerms(suggestions, '고수김').includes('고수김치'));
});

test('한식의 다양한 주재료·양념 조합과 맛 강도로 새 메뉴를 찾는다', async () => {
  const data = JSON.parse(
    await readFile(new URL('../public/data/recipe_index.json', import.meta.url), 'utf8'),
  ) as Recipe[];
  for (const [ingredient, name] of [
    ['톳,쌀', '톳밥'],
    ['감자,새우,쪽파', '감자 새우전'],
    ['고구마,간장,호두', '고구마 간장조림'],
    ['대파,두부', '대파 두부조림'],
    ['양파,된장', '양파 된장무침'],
    ['쌀,마늘,표고버섯', '마늘 버섯솥밥'],
    ['고추장,메추리알', '고추장 메추리알 감자조림'],
    ['단호박,된장', '된장 단호박조림'],
    ['오이,쌈장', '쌈장 오이비빔밥'],
    ['막장,두부', '막장 두부찌개'],
    ['새송이버섯,막장,들기름', '막장 새송이구이'],
    ['바지락,참기름', '참기름 바지락찜'],
    ['무,들기름', '들기름 무찜'],
    ['연근,식용유', '연근칩'],
    ['느타리버섯,고추가루', '고춧가루 버섯볶음'],
    ['돼지머리고기,새우젓', '돼지머리수육'],
    ['돼지껍데기,콩가루', '돼지껍데기구이'],
    ['라면,바지락', '바지락 라면'],
    ['소면,골뱅이', '골뱅이 비빔국수'],
    ['밥,소고기,우엉', '소고기 우엉 볶음밥'],
    ['쌀,깐녹두', '녹두죽'],
    ['밀가루,양배추,이스트', '채소찐빵'],
    ['돼지고기,연근', '돼지고기 연근조림'],
    ['닭고기,미나리', '닭고기 미나리찜'],
    ['양고기,배즙', '양고기 불고기'],
    ['오리고기,단호박', '오리고기 단호박찜'],
    ['전복,표고버섯', '전복 버섯찜'],
    ['우엉,표고버섯', '우엉솥밥'],
    ['팥,칼국수면', '팥칼국수'],
    ['토란,들깻가루', '들깨토란탕'],
    ['감태,계란', '감태계란국'],
    ['오징어,찹쌀', '오징어순대'],
    ['고등어,시래기', '시래기고등어조림'],
    ['오크라,된장', '오크라된장무침'],
    ['콜라비,식초', '콜라비생채'],
    ['순무,새우젓', '순무김치'],
    ['새송이버섯,식초', '새송이버섯장아찌'],
    ['연근,찹쌀가루', '연근부각'],
    ['보리가루,막걸리', '보리술빵'],
  ]) {
    assert.ok(
      searchRecipes(data, { ...q, ingredient }).some(
        ({ recipe }) => recipe.name === name && recipe.cuisine === 'korean',
      ),
      ingredient,
    );
  }
  assert.ok(
    searchRecipes(data, {
      flavors: ['savory', 'rich'],
      flavorLevels: { savory: 5, rich: 4 },
      ingredient: '토란,들깻가루',
    }).some(({ recipe }) => recipe.name === '들깨토란탕'),
  );
  assert.ok(suggestSearchTerms(buildSuggestionIndex(data), '콜라비생').includes('콜라비생채'));
});
