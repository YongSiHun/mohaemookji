import { useEffect, useRef, useState } from 'react';
import { Highlight } from './RecipeCard';
import { completeIngredientKeyword, getActiveKeyword } from '../utils/ingredientKeywords';

interface IngredientSearchProps {
  value: string;
  suggestions: readonly string[];
  onChange: (value: string) => void;
}

export function IngredientSearch({ value, suggestions, onChange }: IngredientSearchProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const expanded = open && suggestions.length > 0;
  const activeIndex = active === null ? -1 : suggestions.indexOf(active);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) {
        setOpen(false);
        setActive(null);
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  function choose(keyword: string) {
    onChange(completeIngredientKeyword(value, keyword));
    input.current?.focus();
    setOpen(false);
    setActive(null);
  }

  return (
    <div className="autocomplete" ref={container} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
        setActive(null);
      }
    }}>
      <div className="input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
        <input
          id="ingredient"
          ref={input}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? 'ingredient-suggestions' : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? 'ingredient-option-' + activeIndex : undefined}
          aria-describedby="input-help"
          autoComplete="off"
          maxLength={100}
          placeholder="여러 재료는 쉼표로 · 두부, 김치"
          onFocus={() => { setOpen(true); setActive(null); }}
          onChange={event => { onChange(event.target.value); setOpen(true); setActive(null); }}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            if (event.key === 'Escape') {
              event.preventDefault(); setOpen(false); setActive(null);
            } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
              event.preventDefault();
              const current = expanded ? activeIndex : -1;
              const next = event.key === 'ArrowDown'
                ? (current + 1) % suggestions.length
                : (current <= 0 ? suggestions.length - 1 : current - 1);
              setOpen(true); setActive(suggestions[next]);
            } else if (event.key === 'Enter') {
              if (expanded && activeIndex >= 0) {
                event.preventDefault(); choose(suggestions[activeIndex]);
              } else {
                setOpen(false);
              }
            }
          }}
        />
        {value && <button type="button" className="input-clear" aria-label="입력한 검색어 지우기" onClick={() => choose('')}>×</button>}
      </div>
      {expanded && (
        <div className="suggestion-dropdown">
          <p className="suggestion-heading">연관 검색어</p>
          <div id="ingredient-suggestions" role="listbox" aria-label="연관 검색어" className="suggestion-list">
            {suggestions.map((keyword, index) => (
              <button
                type="button"
                role="option"
                id={'ingredient-option-' + index}
                key={keyword}
                aria-selected={index === activeIndex}
                tabIndex={-1}
                className="suggestion-option"
                onMouseDown={event => event.preventDefault()}
                onMouseEnter={() => setActive(keyword)}
                onClick={() => choose(keyword)}
              >
                <span className="suggestion-icon" aria-hidden="true">⌕</span>
                <span><Highlight text={keyword} keyword={getActiveKeyword(value)}/></span>
                <span className="suggestion-arrow" aria-hidden="true">↖</span>
              </button>
            ))}
          </div>
          <p className="suggestion-hint">↑ ↓ 이동 · Enter 선택 · Esc 닫기</p>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">{expanded ? suggestions.length + '개의 연관 검색어. 방향키로 이동하고 Enter로 선택할 수 있어요.' : ''}</span>
    </div>
  );
}
