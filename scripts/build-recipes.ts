import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateSources } from './validate-recipes.ts';
export async function buildRecipes(): Promise<void> {
const dir = new URL('../src/data/recipes/', import.meta.url);
const files = (await readdir(dir)).filter(f=>f.endsWith('.json')).sort();
const sources = await Promise.all(files.map(async f=>{try{return JSON.parse(await readFile(new URL(f,dir),'utf8'));}catch(e){throw new Error(f+': JSON 읽기 오류', {cause:e});}}));
const flavors = JSON.parse(await readFile(new URL('../src/data/flavors.json',import.meta.url),'utf8')) as {id:string}[];
const recipes = validateSources(sources,flavors.map(f=>f.id)).sort((a,b)=>a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const content = JSON.stringify(recipes);
const version = createHash('sha256').update(content).digest('hex');
const out = new URL('../public/data/',import.meta.url);
await mkdir(out,{recursive:true});
await writeFile(new URL('recipe_index.json',out),content);
await writeFile(new URL('manifest.json',out),JSON.stringify({version,count:recipes.length}));
console.log('검색 인덱스: '+recipes.length+'개 / '+version.slice(0,12));

}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildRecipes();
}
