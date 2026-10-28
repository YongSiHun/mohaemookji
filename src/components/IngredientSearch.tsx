import type { IngredientSearchProps } from '../types/components';
import { INGREDIENT_INPUT_MAX_LENGTH } from '../constants/search';
import { getActiveKeyword } from '../utils/ingredientKeywords';
import { useIngredientAutocomplete } from '../hooks/useIngredientAutocomplete';
import { Highlight } from './Highlight';

/** 재료 검색 입력 */
export function IngredientSearch(props: IngredientSearchProps) {
  const { value, suggestions } = props;
  const {
    container,
    input,
    expanded,
    activeIndex,
    setActive,
    choose,
    openSuggestions,
    handleBlur,
    handleChange,
    handleKeyDown,
  } = useIngredientAutocomplete(props);
  return (
    <div className="autocomplete" ref={container} onBlur={handleBlur}>
      <div className="input-wrap">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          id="ingredient"
          ref={input}
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? 'ingredient-suggestions' : undefined}
          aria-activedescendant={
            expanded && activeIndex >= 0 ? 'ingredient-option-' + activeIndex : undefined
          }
          aria-describedby="input-help"
          autoComplete="off"
          maxLength={INGREDIENT_INPUT_MAX_LENGTH}
          placeholder="예: 돼지고기, 김치, 고춧가루"
          onFocus={openSuggestions}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            type="button"
            className="input-clear"
            aria-label="입력한 검색어 지우기"
            onClick={() => choose('')}
          >
            ×
          </button>
        )}
      </div>
      {expanded && (
        <div className="suggestion-dropdown">
          <p className="suggestion-heading">연관 검색어</p>
          <div
            id="ingredient-suggestions"
            role="listbox"
            aria-label="연관 검색어"
            className="suggestion-list"
          >
            {suggestions.map((keyword, index) => (
              <button
                type="button"
                role="option"
                id={'ingredient-option-' + index}
                key={keyword}
                aria-selected={index === activeIndex}
                tabIndex={-1}
                className="suggestion-option"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(keyword)}
                onClick={() => choose(keyword)}
              >
                <span className="suggestion-icon" aria-hidden="true">
                  ⌕
                </span>
                <span>
                  <Highlight text={keyword} keyword={getActiveKeyword(value)} />
                </span>
                <span className="suggestion-arrow" aria-hidden="true">
                  ↖
                </span>
              </button>
            ))}
          </div>
          <p className="suggestion-hint">↑ ↓ 이동 · Enter 선택 · Esc 닫기</p>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {expanded
          ? suggestions.length + '개의 연관 검색어. 방향키로 이동하고 Enter로 선택할 수 있어요.'
          : ''}
      </span>
    </div>
  );
}
