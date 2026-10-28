import type { RefreshButtonProps } from '../types/components';

/** 새로고침 버튼 */
export function RefreshButton({ onClick, disabled, label }: RefreshButtonProps) {
  return (
    <button
      type="button"
      className="refresh-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 7v5h-5" />
        <path d="M19.3 12a7.5 7.5 0 1 0-1.8 5" />
      </svg>
    </button>
  );
}
