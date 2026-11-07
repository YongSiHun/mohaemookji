/** 서비스는 저장 방식 대신 이 계약에 의존한다. */
export interface RecipeRepository {
  readManifest(signal: AbortSignal, fresh: boolean): Promise<unknown>;
  readIndex(version: string, signal: AbortSignal, fresh: boolean): Promise<unknown>;
}
