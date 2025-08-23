export function compact<T>(arr: ReadonlyArray<T | null | undefined>): T[] {
  return arr.filter((v): v is T => v != null);
}
