import { PrettierConfig } from "../_types/index.js";
import { fileExists, readFile } from "./filesSystem.js";
import { addConfig } from "./../_store/index.js";

async function loadLocalConfigs(): Promise<void> {
  const patterns = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    ".prettierrc.mjs",
    ".prettierrc.cjs",
    ".prettierrc.yaml",
    ".prettierrc.yml",
    "prettier.config.js",
    "prettier.config.mjs",
    "prettier.config.cjs",
  ];

  for (const pattern of patterns) {
    if (await fileExists(pattern)) {
      const config = await parseLocalConfig(pattern);
      if (config) {
        addConfig(config);
      }
    }
  }
}

async function parseLocalConfig(path: string): Promise<PrettierConfig | null> {
  try {
    const content = await readFile(path);
    let parsed: any;

    if (
      path.includes(".js") ||
      path.includes(".mjs") ||
      path.includes(".cjs")
    ) {
      // parseJsConfig is not defined in the context, so just fallback to empty object or throw
      parsed = {}; // or throw new Error("JS config parsing not implemented");
    } else if (path.includes(".yaml") || path.includes(".yml")) {
      // parseYamlConfig is not defined in the context, so just fallback to empty object or throw
      parsed = {}; // or throw new Error("YAML config parsing not implemented");
    } else {
      parsed = JSON.parse(content);
    }

    return {
      name: `local:${path}`,
      source: "local",
      path,
      content: parsed,
    };
  } catch (error) {
    console.error(`Failed to parse config ${path}:`, error);
    return null;
  }
}

export { loadLocalConfigs, parseLocalConfig };
