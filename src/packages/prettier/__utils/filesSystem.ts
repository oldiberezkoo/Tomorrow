import * as fs from "fs/promises";

async function fileExists(path: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readFile(path: string): Promise<string> {
  const fs = await import("fs/promises");
  return await fs.readFile(path, "utf-8");
}

async function writeFile(path: string, content: string): Promise<void> {
  const fs = await import("fs/promises");
  await fs.writeFile(path, content, "utf-8");
}

export { fileExists, readFile, writeFile };
