import { promises as fs } from "fs";
import { CONTROL_CHARS, VALID_KEY } from "./variables.js";
import isValidPath from "./isValidPath.js";
import { join, resolve } from "path";
import detectType from "./detectType.js";

export default function processLine(line: string): {
  isComment: boolean;
  key?: string;
  isValid: boolean;
} {
  const trimmed = line.trim();

  if (!trimmed) return { isComment: false, isValid: false };
  if (trimmed[0] === "#") return { isComment: true, isValid: true };

  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return { isComment: false, isValid: false };

  const key = trimmed.slice(0, eqIdx).trim();
  if (!key || key.length > 128 || !VALID_KEY.test(key)) {
    return { isComment: false, isValid: false };
  }

  return { isComment: false, key, isValid: true };
}
