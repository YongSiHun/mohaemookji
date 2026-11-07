import flavors from '../../data/flavors.json' with { type: 'json' };
import flavorGroups from '../../data/flavor_groups.json' with { type: 'json' };
import ingredientAliases from '../../data/ingredient_aliases.json' with { type: 'json' };
/** 정적 기준 데이터의 단일 접근점. */
export const catalogRepository = { flavors, flavorGroups, ingredientAliases };
