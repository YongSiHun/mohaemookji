import type { HighlightSpan } from '../types/search.ts';
import { normalize } from './normalize.ts';
import { parseIngredientKeywords } from './ingredientKeywords.ts';
import { queryTerms } from '../services/recipeSearch.ts';

/** 단일 검색어 위치 */
function findTermSpans(text: string, term: string): HighlightSpan[] {
  const spans: HighlightSpan[] = [];
  let from = 0;
  while (from < text.length) {
    const at = text.indexOf(term, from);
    const hasNoMatch = at < 0;
    if (hasNoMatch) break;
    spans.push([at, at + term.length]);
    from = at + term.length;
  }
  return spans;
}

/** 겹친 강조 범위 병합 */
function mergeSpans(spans: HighlightSpan[]): HighlightSpan[] {
  const merged: HighlightSpan[] = [];
  for (const span of spans.sort((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    const isOverlapping = last !== undefined && span[0] <= last[1];
    if (isOverlapping) {
      last[1] = Math.max(last[1], span[1]);
      continue;
    }
    merged.push([...span]);
  }
  return merged;
}

/** 검색어 강조 범위 */
export function getHighlightSpans(text: string, keyword: string): HighlightSpan[] {
  const terms = parseIngredientKeywords(keyword).flatMap(queryTerms);
  const normalizedText = normalize(text);
  const spans = terms.flatMap((term) => findTermSpans(normalizedText, term));
  return mergeSpans(spans);
}
