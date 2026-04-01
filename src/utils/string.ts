export function separate(str: string): string[] {
  return str
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}
