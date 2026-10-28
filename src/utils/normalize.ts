export const normalize = (text: string): string => text.trim().normalize('NFC').toLowerCase();
export const compareText = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
