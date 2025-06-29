import { readFile, writeFile } from "./filesSystem.js";

async function readPackageJson(): Promise<any> {
  try {
    const content = await readFile("package.json");
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to read package.json:", error);
    return null;
  }
}

async function writePackageJson(packageJson: any): Promise<void> {
  const content = JSON.stringify(packageJson, null, 2);
  await writeFile("package.json", content);
}

async function updatePackageJson(updates: Record<string, any>): Promise<any> {
  const packageJson = await readPackageJson();
  if (!packageJson) throw new Error("package.json not found");

  const updated = { ...packageJson, ...updates };
  await writePackageJson(updated);
  return updated;
}

async function addPrettierScripts(packageJson: any): Promise<any> {
  const scripts = packageJson.scripts || {};

  return {
    ...packageJson,
    scripts: {
      ...scripts,
      "prettier:check": "prettier --check .",
      "prettier:write": "prettier --write .",
    },
  };
}

export {
  readPackageJson,
  writePackageJson,
  updatePackageJson,
  addPrettierScripts,
};
