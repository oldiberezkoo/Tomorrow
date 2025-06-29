import { loadLocalConfigs } from "../__utils/ConfigParser.js";
import { detectPackageManager } from "../__utils/packageManager.js";
import { PackageManager, PrettierConfig } from "../_types/index.js";

export var store = {
  configs: new Map<string, PrettierConfig>(),
  packageManager: null as PackageManager | null,
};

export async function initializeStore(): Promise<void> {
  store.packageManager = await detectPackageManager();
  await loadLocalConfigs();
}

export function getConfigs(): PrettierConfig[] {
  return Array.from(store.configs.values());
}

export function getPackageManager(): PackageManager {
  return store.packageManager!;
}

export function addConfig(config: PrettierConfig): void {
  store.configs.set(config.name, config);
}

