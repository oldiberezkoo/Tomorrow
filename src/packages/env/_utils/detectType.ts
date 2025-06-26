import { BOOL_PATTERN, NUM_PATTERN } from "./variables.js";

const typeCache = new Map<string, string>();

export default function detectType(key: string): string {
  if (typeCache.has(key)) {
    return typeCache.get(key)!;
  }

  let result: string;
  if (BOOL_PATTERN.test(key)) {
    result = "BOOL";
  } else if (NUM_PATTERN.test(key)) {
    result = "NUM";
  } else {
    result = "STR";
  }

  typeCache.set(key, result);
  return result;
}
