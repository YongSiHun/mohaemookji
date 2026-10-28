import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import type { IngredientAutocompleteOptions } from '../types/hooks';
import { getAutocompleteAction } from '../services/autocompleteKeyboard';
import { completeIngredientKeyword } from '../utils/ingredientKeywords';

/** 재료 자동완성 상태 */
export function useIngredientAutocomplete({
  value,
  suggestions,
  onChange,
}: IngredientAutocompleteOptions) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const expanded = open && suggestions.length > 0;
  const activeIndex = active === null ? -1 : suggestions.indexOf(active);

  useEffect(() => {
    /** 외부 클릭 닫기 */
    function closeOutside(event: PointerEvent) {
      const isOutside = event.target instanceof Node && !container.current?.contains(event.target);
      if (isOutside) {
        setOpen(false);
        setActive(null);
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  /** 자동완성 열기 */
  function openSuggestions() {
    setOpen(true);
    setActive(null);
  }

  /** 자동완성 닫기 */
  function closeSuggestions() {
    setOpen(false);
    setActive(null);
  }

  /** 검색어 선택 */
  function choose(keyword: string) {
    onChange(completeIngredientKeyword(value, keyword));
    input.current?.focus();
    closeSuggestions();
  }

  /** 입력 변경 반영 */
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    openSuggestions();
  }

  /** 포커스 이탈 처리 */
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const staysInside = event.currentTarget.contains(event.relatedTarget);
    if (staysInside) return;
    closeSuggestions();
  }

  /** 키보드 선택 적용 */
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const action = getAutocompleteAction({
      key: event.key,
      isComposing: event.nativeEvent.isComposing || event.keyCode === 229,
      expanded,
      activeIndex,
      count: suggestions.length,
    });
    const shouldPreventDefault = action.preventDefault;
    if (shouldPreventDefault) event.preventDefault();
    const isIgnored = action.kind === 'ignore';
    if (isIgnored) return;
    const shouldClose = action.kind === 'close';
    if (shouldClose) {
      closeSuggestions();
      return;
    }
    const shouldMove = action.kind === 'move';
    if (shouldMove) {
      setOpen(true);
      setActive(suggestions[action.index]);
      return;
    }
    choose(suggestions[action.index]);
  }

  return {
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
  };
}
