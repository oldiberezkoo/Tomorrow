import { PrettierConfig } from "../_types/index.js";

async function searchPrettierConfigs(query = ""): Promise<PrettierConfig[]> {
  try {
    const searchUrl = `https://registry.npmjs.org/-/v1/search?text=prettier-config ${query}&size=20`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    return data.objects.map((pkg: any) => ({
      name: pkg.package.name,
      source: "npm" as const,
      version: pkg.package.version,
      description: pkg.package.description,
      dependencies: [],
    }));
  } catch (error) {
    console.error("Failed to search npm registry:", error);
    return [];
  }
}

async function getPackageInfo(name: string): Promise<any> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${name}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to get package info for ${name}:`, error);
    return null;
  }
}
async function searchNpmConfigs(): Promise<PrettierConfig[]> {
  try {
    console.debug("🔍 Searching npm registry...");

    const response = await fetch(
      "https://registry.npmjs.org/-/v1/search?text=prettier-config&size=10"
    );
    const data = await response.json();

    const configs: PrettierConfig[] = data.objects.map((pkg: any) => ({
      name: pkg.package.name,
      source: "npm" as const,
      version: pkg.package.version,
      description: pkg.package.description || "No description",
    }));

    console.debug(`Found ${configs.length} npm configs`);
    return configs;
  } catch (error) {
    console.error("Failed to search npm registry", error);
    return [];
  }
}
export { searchPrettierConfigs, getPackageInfo, searchNpmConfigs };
