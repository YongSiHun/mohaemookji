/** 텍스트 정규화 */
export const normalize = (text: string): string => text.trim().normalize('NFC').toLowerCase();

/** 텍스트 비교 */
export const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
