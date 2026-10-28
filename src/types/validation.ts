export interface SourceValidationContext {
  sourceIndex: number;
  flavors: readonly string[];
  ids: Set<string>;
  names: Set<string>;
}
