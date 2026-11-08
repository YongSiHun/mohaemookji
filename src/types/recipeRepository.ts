/** 서비스 의존 계약 · 저장 방식 추상화 */
export interface RecipeRepository {
  readManifest(signal: AbortSignal, fresh: boolean): Promise<unknown>;
  readIndex(version: string, signal: AbortSignal, fresh: boolean): Promise<unknown>;
}
