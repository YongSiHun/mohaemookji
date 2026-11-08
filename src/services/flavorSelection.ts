import type { FlavorLevel, SearchQuery } from '../types/recipe.ts';

/** 맛 해제 → 강도 제거 */
export function removeFlavor(query: SearchQuery, id: string): SearchQuery {
  const flavors = query.flavors.filter((flavor) => flavor !== id);
  const flavorLevels = Object.fromEntries(
    Object.entries(query.flavorLevels ?? {}).filter(([flavor]) => flavors.includes(flavor)),
  );
  return { ...query, flavors, flavorLevels };
}

export function toggleFlavor(query: SearchQuery, id: string): SearchQuery {
  const active = query.flavors.includes(id);
  return active ? removeFlavor(query, id) : { ...query, flavors: [...query.flavors, id] };
}

/** 별 선택 → 맛 포함 · undefined: 강도 무관 */
export function selectFlavorLevel(
  query: SearchQuery,
  id: string,
  level?: FlavorLevel,
): SearchQuery {
  const flavorLevels = { ...query.flavorLevels };
  const unrestricted = level === undefined;
  if (unrestricted) delete flavorLevels[id];
  else flavorLevels[id] = level;
  const flavors = query.flavors.includes(id) ? query.flavors : [...query.flavors, id];
  return { ...query, flavors, flavorLevels };
}

/** 카드: 미선택·강도 지정 → 강도 무관 포함 · 이미 포함 → 해제 */
export function toggleFlavorInclusion(query: SearchQuery, id: string): SearchQuery {
  const included = query.flavors.includes(id) && query.flavorLevels?.[id] === undefined;
  return included ? removeFlavor(query, id) : selectFlavorLevel(query, id);
}
