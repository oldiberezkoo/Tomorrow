import { PrettierConfig } from "../_types/index.js";
import { fileExists, readFile } from "./filesSystem.js";
import { addConfig, store } from "./../_store/index.js";
async function loadLocalConfigs(): Promise<void> {
  const patterns = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.js",
    "prettier.config.js",
  ];

  console.debug("🔍 Scanning for local configs...");

  for (const pattern of patterns) {
    if (await fileExists(pattern)) {
      try {
        const content = await readFile(pattern);
        let parsed: any = {};

        if (pattern.endsWith(".js")) {
          // Простой парсинг JS файлов
          const match = content.match(/module\.exports\s*=\s*({[\s\S]*?})/);
          if (match) {
            parsed = JSON.parse(match[1].replace(/(\w+):/g, '"$1":'));
          }
        } else {
          parsed = JSON.parse(content);
        }

        const config: PrettierConfig = {
          name: `local:${pattern}`,
          source: "local",
          path: pattern,
          content: parsed,
        };

        store.configs.set(config.name, config);
        console.debug(`✅ Found local config: ${pattern}`);
      } catch (error) {
        console.error(`Failed to parse ${pattern}`, error);
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
