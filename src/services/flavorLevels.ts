import type { FlavorLevel } from '../types/recipe.ts';
import { isRecord } from '../utils/validation.ts';

/** 등록 맛별 1~5 정수 검증 · 기존 데이터의 undefined 허용 */
export function isFlavorLevels(
  value: unknown,
  flavors: readonly string[],
): value is Record<string, FlavorLevel> | undefined {
  const absent = value === undefined;
  if (absent) return true;
  const invalid = !isRecord(value);
  if (invalid) return false;
  const keys = Object.keys(value);
  const registered = new Set(flavors);
  return (
    keys.length === registered.size &&
    keys.every((key) => registered.has(key)) &&
    flavors.every(
      (id) => Number.isInteger(value[id]) && Number(value[id]) >= 1 && Number(value[id]) <= 5,
    )
  );
}
