import type { RecipeCursor, RecipePage, SearchQuery, RankedRecipe } from '../types/recipe.ts';
import { isRecipeCursor } from './recipeValidation.ts';
import { queryKey } from './recipeSearch.ts';
import { PAGE_SIZE, MAX_CURSOR_LENGTH } from '../constants/recipes.ts';

/** 커서 인코딩 */
export function encodeCursor(cursor: RecipeCursor): string {
  const bytes = new TextEncoder().encode(JSON.stringify(cursor));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

/** 커서 디코딩 */
export function decodeCursor(value: string): RecipeCursor | null {
  try {
    const hasInvalidEncoding = value.length > MAX_CURSOR_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value);
    if (hasInvalidEncoding) return null;
    const raw = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
    const decoded: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(raw, (x) => x.charCodeAt(0)),
      ),
    );
    const isInvalidCursor = !isRecipeCursor(decoded);
    if (isInvalidCursor) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** 메뉴 페이지 분할 */
export function paginateRecipes(
  sorted: RankedRecipe[],
  query: SearchQuery,
  version: string,
  cursor?: string | null,
): RecipePage {
  const c = cursor ? decodeCursor(cursor) : null;
  const cursorIndex =
    c && c.version === version && c.queryKey === queryKey(query)
      ? sorted.findIndex(
          (r) => r.rank === c.rank && r.recipe.name === c.name && r.recipe.id === c.id,
        )
      : -1;
  const remaining = sorted.slice(cursorIndex + 1);
  const page = remaining.slice(0, PAGE_SIZE + 1);
  const hasNext = page.length > PAGE_SIZE;
  const items = page.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items: items.map((r) => r.recipe),
    hasNext,
    nextCursor:
      hasNext && last
        ? encodeCursor({
            version,
            queryKey: queryKey(query),
            rank: last.rank,
            name: last.recipe.name,
            id: last.recipe.id,
          })
        : null,
  };
}
