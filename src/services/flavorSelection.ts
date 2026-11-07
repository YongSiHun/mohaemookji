import type { FlavorLevel, SearchQuery } from '../types/recipe.ts';

/** 맛을 해제하면 해당 강도도 함께 제거한다. */
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

/** 별을 누르면 맛도 선택한다. undefined는 강도를 제한하지 않는다. */
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
