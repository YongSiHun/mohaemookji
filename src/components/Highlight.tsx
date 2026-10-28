import { Fragment } from 'react';
import type { HighlightProps } from '../types/components';
import { getHighlightSpans } from '../utils/highlight';

/** 검색어 강조 */
export function Highlight({ text, keyword }: HighlightProps) {
  const merged = getHighlightSpans(text, keyword);
  const content = [];
  let start = 0;
  for (const [a, b] of merged) {
    content.push(
      <Fragment key={a}>
        {text.slice(start, a)}
        <mark>{text.slice(a, b)}</mark>
      </Fragment>,
    );
    start = b;
  }
  return (
    <>
      {content}
      {text.slice(start)}
    </>
  );
}
