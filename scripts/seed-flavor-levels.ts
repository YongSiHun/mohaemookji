/** 초기 편집용 추정치. 이미 입력한 강도는 덮어쓰지 않는다. 실측·시식 점수가 아니다. */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { RECIPE_SOURCE_DIRECTORY } from './constants.ts';
import type { RecipeSource, FlavorLevel } from '../src/types/recipe.ts';

type Rule = { name?: RegExp; items?: RegExp; level: FlavorLevel };
const rules: Record<string, Rule[]> = {
  sweet: [
    { name: /사탕|캐러멜|캬라멜|정과|양갱/, level: 5 },
    { name: /케이크|쿠키|푸딩|아이스크림|타르트|잼|약과|디저트/, level: 4 },
    { items: /설탕|꿀|물엿|시럽|연유/, level: 3 },
  ],
  sour: [
    { name: /피클|초절임/, level: 5 },
    { items: /식초|타마린드|레몬즙|라임즙/, level: 4 },
    { items: /김치|토마토|요거트|공구라/, level: 3 },
  ],
  salty: [
    { name: /젓갈|장아찌|염장|소금절임/, level: 5 },
    { name: /조림|장조림|간장|절임/, level: 4 },
  ],
  savory: [
    { name: /잣죽|깨죽|땅콩버터|참깨소스/, level: 5 },
    { items: /참기름|들기름|깨|땅콩|잣|호두|아몬드|버터|치즈|타히니/, level: 4 },
  ],
  rich: [
    { name: /농축|데미글라스|라구/, level: 5 },
    { items: /생크림|크림|버터|치즈|코코넛밀크|사골|판체타|라드/, level: 4 },
  ],
  umami: [
    { name: /된장찌개|미소시루|장국|해물탕/, level: 5 },
    { items: /된장|미소|굴소스|피시소스|가쓰오|다시마|멸치|표고|새우페이스트/, level: 4 },
  ],
  bitter: [
    { items: /여주|고야|씀바귀/, level: 4 },
    { items: /쑥|도라지|더덕|녹차/, level: 3 },
  ],
  greasy: [{ name: /튀김|카츠|프라이|가라아게|치킨난반/, level: 4 }],
  refreshing: [{ items: /레몬|라임|유자|민트|오이/, level: 4 }],
  light: [
    { name: /흰죽|미음/, level: 5 },
    { name: /맑은|찜|나물|숙회|샐러드|국|수프/, level: 4 },
  ],
  cool: [{ name: /냉국|냉면|냉채|물회|동치미/, level: 4 }],
};
rules.sweet_sour = rules.sour;
rules.clean = rules.light;

function moderateSpicyLevel(items: string): FlavorLevel {
  return /생크림|우유|치즈|코코넛밀크/.test(items) ? 2 : 3;
}
function mildSpicyLevel(items: string): FlavorLevel {
  return /후추|겨자|와사비|생강/.test(items) ? 2 : 1;
}
function estimateSpicy(recipe: RecipeSource, items: string): FlavorLevel {
  const intense = /불닭|불곱창|불막창|매운|마라|사천|쓰촨|핫윙|빈달루/.test(recipe.name);
  if (intense) return 5;
  const peppers = recipe.seasonings.filter((item) =>
    /고추|두반장|칠리|하리사|스리라차|락사|레드커리|그린커리/.test(item),
  ).length;
  const strong = peppers >= 2 || /청양고추|태국고추|프릭키누/.test(items);
  if (strong) return 4;
  const moderate = peppers > 0 || /고추|할라페뇨|페페론치노/.test(items);
  if (moderate) return moderateSpicyLevel(items);
  return mildSpicyLevel(items);
}

function estimate(recipe: RecipeSource, flavor: string): FlavorLevel {
  const items = [...recipe.ingredients, ...recipe.seasonings].join(' ');
  const spicy = flavor === 'spicy';
  if (spicy) return estimateSpicy(recipe, items);
  const match = rules[flavor]?.find(
    (rule) => (rule.name?.test(recipe.name) ?? true) && (rule.items?.test(items) ?? true),
  );
  const mildDefault = ['sweet', 'sour', 'sweet_sour', 'bitter'].includes(flavor);
  return match?.level ?? (mildDefault ? 2 : 3);
}

function seedRecipe(recipe: RecipeSource): boolean {
  const exists = recipe.flavorLevels !== undefined;
  if (exists) return false;
  recipe.flavorLevels = Object.fromEntries(recipe.flavors.map((id) => [id, estimate(recipe, id)]));
  return true;
}

function seedRecipes(recipes: readonly RecipeSource[]): number {
  let count = 0;
  for (const recipe of recipes) count += Number(seedRecipe(recipe));
  return count;
}
async function seedFile(file: string): Promise<number> {
  const url = new URL(file, RECIPE_SOURCE_DIRECTORY);
  const source = JSON.parse(await readFile(url, 'utf8')) as {
    categories: Record<string, { recipes: RecipeSource[] }>;
  };
  const recipes = Object.values(source.categories).flatMap((category) => category.recipes);
  const count = seedRecipes(recipes);
  const changed = count > 0;
  if (changed) await writeFile(url, JSON.stringify(source, null, 2) + '\n');
  return count;
}
let count = 0;
const files = (await readdir(RECIPE_SOURCE_DIRECTORY)).filter((name) => name.endsWith('.json'));
for (const file of files) count += await seedFile(file);
console.log('맛 강도 초기값 추가: ' + count + '개');
