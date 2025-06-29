import { getPackageManager } from "../_store/index.js";
import { InstallTransaction } from "../_types/index.js";
import { readPackageJson, writePackageJson } from "./packageJson.js";
import { runCommand } from "./packageManager.js";

async function installDeps(packages: string[]): Promise<InstallTransaction> {
  const originalPackageJson = await readPackageJson();
  const packageManager = getPackageManager();

  try {
    const cmd = [...packageManager.addCmd, ...packages, "--save-dev"];
    await runCommand(cmd);

    return {
      packages,
      originalPackageJson,
      rollback: async () => {
        await writePackageJson(originalPackageJson);
        const uninstallCmd =
          packageManager.name === "npm"
            ? ["npm", "uninstall", ...packages]
            : ["yarn", "remove", ...packages];
        await runCommand(uninstallCmd);
      },
    };
  } catch (error) {
    console.error("Failed to install dependencies:", error);
    throw error;
  }
}

export { installDeps };
