import type { FlavorLevel } from '../types/recipe.ts';
import { isRecord } from '../utils/validation.ts';

/** 등록된 맛마다 1~5 정수만 허용한다. 기존 데이터의 미등록 값은 유지한다. */
export function isFlavorLevels(
  value: unknown,
  flavors: readonly string[],
): value is Record<string, FlavorLevel> | undefined {
  const absent = value === undefined;
  if (absent) return true;
  const invalid = !isRecord(value);
  if (invalid) return false;
  const keys = Object.keys(value);
  return (
    keys.length === new Set(flavors).size &&
    keys.every((key) => flavors.includes(key)) &&
    flavors.every(
      (id) => Number.isInteger(value[id]) && Number(value[id]) >= 1 && Number(value[id]) <= 5,
    )
  );
}
