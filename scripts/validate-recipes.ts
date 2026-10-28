import type { Recipe } from '../src/types/recipe.ts';
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function validateSources(sources: unknown[], flavors: string[]): Recipe[] {
 const ids = new Set<string>(); const names = new Set<string>(); const result: Recipe[] = [];
 const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
 for (const [index, source] of sources.entries()) {
  const fail = (message: string): never => { throw new Error('원본 '+index+': '+message); };
  if (!object(source) || !text(source.cuisine) || !object(source.categories) || !Object.keys(source.categories).length) fail('cuisine/categories 구조 오류');
  const s = source as { cuisine: string; categories: Record<string, unknown> };
  for (const [category, value] of Object.entries(s.categories)) {
   if (!object(value) || !text(value.name) || !Array.isArray(value.recipes) || !value.recipes.length) fail(category+' 카테고리 구조 오류');
   for (const raw of (value as { recipes: unknown[] }).recipes) {
    if (!object(raw)) fail(category+' 요리 객체 오류');
    const r = raw as Record<string, unknown>;
    if (!text(r.id) || !text(r.name)) fail(category+' 필수 id/name 누락 또는 빈 요리명');
    const id = (r.id as string).trim(); const name = (r.name as string).trim().normalize('NFC');
    if (ids.has(id)) fail('중복 ID: '+id);
    if (names.has(name)) fail('중복 요리명: '+name);
    for (const key of ['flavors','ingredients','seasonings']) {
     if (!Array.isArray(r[key]) || !(r[key] as unknown[]).length || !(r[key] as unknown[]).every(text)) fail(id+' 필수 배열 오류: '+key);
    }
    if ((r.flavors as string[]).some(f => !flavors.includes(f))) fail(id+' 잘못된 맛 태그');
    ids.add(id); names.add(name);
    result.push({id,name,cuisine:s.cuisine,flavors:r.flavors as string[],ingredients:(r.ingredients as string[]).map(v=>v.trim().normalize('NFC')),seasonings:(r.seasonings as string[]).map(v=>v.trim().normalize('NFC'))});
   }
  }
 }
 return result;
}
