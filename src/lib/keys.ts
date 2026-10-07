/** Slippery-Hill lists several keys as "G & E Minor"; modes stay part of the key. */
export function splitKeys(key: string | null): string[] {
  return key ? key.split(" & ").map((k) => k.trim()) : [];
}
