import { normalize } from "path";
import { PATH_TRAVERSAL, UNSAFE_CHARS } from "./variables.js";

const pathCache = new Map<string, boolean>();

export default function isValidPath(inputPath: string): string | null {
  if (pathCache.has(inputPath)) {
    return pathCache.get(inputPath) ? inputPath : null;
  }

  // Быстрые проверки сначала
  if (inputPath.length > 255 || PATH_TRAVERSAL.test(inputPath)) {
    pathCache.set(inputPath, false);
    return null;
  }

  const cleaned = inputPath.replace(UNSAFE_CHARS, "");
  const normalized = normalize(cleaned);

  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    pathCache.set(inputPath, false);
    return null;
  }

  pathCache.set(inputPath, true);
  return normalized;
}
