import { installDeps } from "./depns.js";
import { getPackageInfo, searchPrettierConfigs } from "./npm_registry.js";
import {
  addPrettierScripts,
  readPackageJson,
  updatePackageJson,
  writePackageJson,
} from "./packageJson.js";
import { confirmAction } from "./User.js";
import { createProgressBar } from "../_helpers/progressBar.js";
import { getConfigs, initializeStore, store } from "../_store/index.js";
import { fileExists, writeFile } from "./filesSystem.js";
import { CliOptions } from "../_types/index.js";

export async function listConfigs(): Promise<void> {
  await initializeStore();
  const configs = getConfigs();
  const npmConfigs = await searchPrettierConfigs();

  console.debug("📋 Available Prettier configurations:\n");

  if (configs.length > 0) {
    console.log("🏠 Local configurations:");
    for (const config of configs.filter((c) => c.source === "local")) {
      console.log(`  • ${config.name}`);
      if (config.content) {
        const preview = JSON.stringify(config.content, null, 2)
          .split("\n")
          .slice(0, 3)
          .join("\n");
        console.log(
          `    ${preview}${
            Object.keys(config.content).length > 3 ? "\n    ..." : ""
          }`
        );
      }
    }
    console.log();
  }

  if (npmConfigs.length > 0) {
    console.log("📦 Popular npm configurations:");
    for (const config of npmConfigs.slice(0, 10)) {
      console.log(`  • ${config.name}@${config.version}`);
      if (config.description) {
        console.log(`    ${config.description}`);
      }
    }
  }
}

export async function initializeBasicConfig(
  options: CliOptions
): Promise<void> {
  const basicConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: "es5",
  };

  if (options.dryRun) {
    console.debug("🔍 Dry run - would create .prettierrc with:");
    console.log(JSON.stringify(basicConfig, null, 2));
    return;
  }

  if (await fileExists(".prettierrc")) {
    const confirmed = await confirmAction(
      "⚠️  .prettierrc already exists. Overwrite?",
      options.yes
    );
    if (!confirmed) {
      console.debug("❌ Operation cancelled");
      return;
    }
  }

  await writeFile(".prettierrc", JSON.stringify(basicConfig, null, 2));
  console.debug("✅ Created basic .prettierrc configuration");

  if (options.scripts) {
    const packageJson = await readPackageJson();
    if (packageJson) {
      const updated = await addPrettierScripts(packageJson);
      await writePackageJson(updated);
      console.debug("✅ Added prettier scripts to package.json");
    }
  }
}

export async function installConfig(
  configName: string,
  options: CliOptions
): Promise<void> {
  await initializeStore();

  // Check if it's a local config
  const localConfig = store.configs.get(`local:${configName}`);
  if (localConfig) {
    console.debug(`📋 Using local configuration: ${configName}`);
    return;
  }

  // Search for npm package
  const npmConfigs = await searchPrettierConfigs(configName);
  const targetConfig = npmConfigs.find(
    (c) => c.name === configName || c.name.includes(configName)
  );

  if (!targetConfig) {
    console.error(`❌ Configuration '${configName}' not found`);
    return;
  }

  // Get package info for dependencies
  const packageInfo = await getPackageInfo(targetConfig.name);
  const dependencies = [targetConfig.name];

  if (packageInfo?.peerDependencies) {
    dependencies.push(...Object.keys(packageInfo.peerDependencies));
  }

  console.debug(`📦 Found: ${targetConfig.name}@${targetConfig.version}`);
  if (targetConfig.description) {
    console.log(`   ${targetConfig.description}`);
  }

  if (options.dryRun) {
    console.debug("🔍 Dry run - would install:");
    dependencies.forEach((dep) => console.log(`  • ${dep}`));
    console.log("\n📝 Would update package.json with:");
    console.log(`  "prettier": "${targetConfig.name}"`);
    return;
  }

  // Confirm installation
  if (dependencies.length > 3) {
    const confirmed = await confirmAction(
      `⚠️  This will install ${dependencies.length} packages. Continue?`,
      options.yes
    );
    if (!confirmed) {
      console.error("❌ Installation cancelled");
      return;
    }
  }

  // Install dependencies
  const progress = createProgressBar();
  progress.start(3, "Installing dependencies...");

  try {
    const transaction = await installDeps(dependencies);
    progress.increment("Updating package.json...");

    // Update package.json with prettier config
    await updatePackageJson({ prettier: targetConfig.name });
    progress.increment("Finalizing...");

    // Add scripts if requested
    if (options.scripts) {
      const packageJson = await readPackageJson();
      const updated = await addPrettierScripts(packageJson);
      await writePackageJson(updated);
    }

    progress.finish("Installation complete!");
    console.debug(`✅ Successfully installed ${targetConfig.name}`);
  } catch (error) {
    progress.finish("Installation failed");
    console.error("❌ Installation failed:", error);
  }
}
