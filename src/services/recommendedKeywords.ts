import type { Recipe } from '../types/recipe.ts';
import { compareText, normalize } from '../utils/normalize.ts';

export function buildRecommendationPool(recipes: readonly Recipe[]): string[] {
  const excluded = new Set(['소금','굵은소금','후추','백후추','설탕','식용유','물','전분','올리브유','버터','기버터','라드']);
  const counts = new Map<string, {label:string;count:number}>();
  for (const recipe of recipes) {
    const unique = new Map<string,string>();
    for (const label of [...recipe.ingredients,...recipe.seasonings]) {
      const key=normalize(label);
      if (key && !excluded.has(key)) unique.set(key,label.trim().normalize('NFC'));
    }
    for (const [key,label] of unique) {
      const current=counts.get(key);
      counts.set(key,{label,count:(current?.count ?? 0)+1});
    }
  }
  const ordered=[...counts.values()].sort((a,b)=>b.count-a.count || compareText(a.label,b.label));
  const frequent=ordered.filter(item=>item.count>=3);
  return (frequent.length>=6 ? frequent : ordered).slice(0,80).map(item=>item.label);
}

export function pickRecommendedKeywords(pool: readonly string[], count=6, previous: readonly string[]=[], random:()=>number=Math.random): string[] {
  const unique=[...new Set(pool)];
  const fresh=unique.filter(keyword=>!previous.includes(keyword));
  const candidates=[...(fresh.length>=count ? fresh : unique)];
  for(let i=candidates.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    [candidates[i],candidates[j]]=[candidates[j],candidates[i]];
  }
  return candidates.slice(0,Math.max(0,Math.floor(count)));
}
