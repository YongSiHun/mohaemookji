import { catalogRepository } from '../repositories/catalogRepository.ts';
import { normalize } from '../utils/normalize.ts';
const ALIAS_GROUPS = Object.entries(catalogRepository.ingredientAliases).map(
  ([canonical, variants]) => [canonical, ...variants].map(normalize),
);

/** 별칭 그룹 확장 */
function expandAliasGroup(keyword: string, group: readonly string[]): string[] {
  return group.flatMap((alias) => {
    const isAbsent = !keyword.includes(alias);
    if (isAbsent) return [];
    return group.map((replacement) => keyword.replaceAll(alias, replacement));
  });
}

/** 검색어 확장 */
export function queryTerms(keyword: string): string[] {
  const query = normalize(keyword);
  const isEmpty = query.length === 0;
  if (isEmpty) return [];
  const aliases = ALIAS_GROUPS.flatMap((group) => expandAliasGroup(query, group));
  return [...new Set([query, ...aliases])];
}
