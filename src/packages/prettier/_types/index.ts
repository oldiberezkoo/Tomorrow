export interface PrettierConfig {
  name: string;
  source: 'local' | 'npm';
  path?: string;
  version?: string;
  description?: string;
  content?: Record<string, any>;
  dependencies?: string[];
  plugins?: string[];
}

interface CliOptions {
  scripts?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  debug?: boolean;
  force?: boolean;
}

export interface PackageManager {
  name: 'npm' | 'yarn' | 'pnpm';
  lockFile: string;
  installCmd: string[];
  addCmd: string[];
}

export interface InstallTransaction {
  packages: string[];
  originalPackageJson: any;
  rollback: () => Promise<void>;
}
