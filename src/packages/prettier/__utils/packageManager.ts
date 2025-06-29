import { PackageManager } from "../_types/index.js";
import { fileExists } from "./filesSystem.js";

async function detectPackageManager(): Promise<PackageManager> {
  const managers: PackageManager[] = [
    {
      name: "pnpm",
      lockFile: "pnpm-lock.yaml",
      installCmd: ["pnpm", "install"],
      addCmd: ["pnpm", "add"],
    },
    {
      name: "yarn",
      lockFile: "yarn.lock",
      installCmd: ["yarn"],
      addCmd: ["yarn", "add"],
    },
    {
      name: "npm",
      lockFile: "package-lock.json",
      installCmd: ["npm", "install"],
      addCmd: ["npm", "install"],
    },
  ];

  for (const manager of managers) {
    if (await fileExists(manager.lockFile)) {
      return manager;
    }
  }

  // Fallback to npm
  return managers[2];
}

async function runCommand(
  cmd: string[]
): Promise<{ stdout: string; stderr: string }> {
  const { spawn } = await import("child_process");
  const { promisify } = await import("util");

  return new Promise((resolve, reject) => {
    const child = spawn(cmd[0], cmd.slice(1), { stdio: "pipe" });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

export { detectPackageManager, runCommand };
