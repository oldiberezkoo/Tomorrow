import { loadLocalConfigs } from './__utils/ConfigParser.js';
import { fileExists, readFile, writeFile } from './__utils/filesSystem.js';
import { searchNpmConfigs } from './__utils/npm_registry.js';
import { store } from './_store/index.js';
import { CliOptions } from './_types/index.js';

async function listConfigs(): Promise<void> {
  console.log('🎨 Prettier Config Manager\n');

  // Load local configs
  await loadLocalConfigs();

  // Get npm configs
  const npmConfigs = await searchNpmConfigs();

  // Display local configs
  const localConfigs = Array.from(store.configs.values());
  if (localConfigs.length > 0) {
    console.log('🏠 Local configurations:');
    for (const config of localConfigs) {
      console.log(`  • ${config.name}`);
      if (config.content) {
        const keys = Object.keys(config.content);
        console.log(`    Settings: ${keys.join(', ')}`);
      }
    }
    console.log();
  } else {
    console.log('🏠 No local configurations found\n');
  }

  // Display npm configs
  if (npmConfigs.length > 0) {
    console.log('📦 Popular npm configurations:');
    for (const config of npmConfigs) {
      console.log(`  • ${config.name}@${config.version}`);
      console.log(`    ${config.description}`);
    }
  }

  console.log('\n💡 Usage:');
  console.log('  tsx index.ts .                    # Create basic config');
  console.log('  tsx index.ts <config-name>        # Install from npm');
  console.log('  tsx index.ts . --scripts          # Add npm scripts');
}

async function initBasicConfig(options: CliOptions): Promise<void> {
  const configPath = '.prettierrc';
  const backupPath = '.prettierrc.tomorrow';

  const basicConfig = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5' as const,
  };

  if (options.dryRun) {
    logInfo('🔍 Dry run - would create .prettierrc:');
    console.log(JSON.stringify(basicConfig, null, 2));
    return;
  }

  if (await fileExists(configPath)) {
    if (!options.force) {
      logError('.prettierrc already exists! Use --force to overwrite');
      return;
    }

    // move .prettierrc → .prettierrc.tomorrow
    await fs.rename(configPath, backupPath);
    logInfo(`💾 Existing .prettierrc backed up to ${backupPath}`);
  }

  await writeFile(configPath, JSON.stringify(basicConfig, null, 2));
  logSuccess('Created .prettierrc');

  if (options.scripts) {
    await addScripts();
  }
}

async function addScripts(): Promise<void> {
  try {
    const packageJsonPath = 'package.json';
    if (!(await fileExists(packageJsonPath))) {
      console.log('package.json not found');
      return;
    }

    const content = await readFile(packageJsonPath);
    const packageJson = JSON.parse(content);

    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['prettier:check'] = 'prettier --check .';
    packageJson.scripts['prettier:write'] = 'prettier --write .';

    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Added prettier scripts to package.json');
  } catch (error) {
    console.log('Failed to update package.json', error);
  }
}

async function installConfig(
  configName: string,
  options: CliOptions
): Promise<void> {
  console.log(`🔍 Installing config: ${configName}`);

  if (options.dryRun) {
    console.log(`🔍 Dry run - would install: ${configName}`);
    return;
  }

  // This is a simplified version - would need full npm installation logic
  console.log('Config installation not fully implemented yet');
  console.log(
    '💡 For now, install manually: npm install --save-dev ' + configName
  );
}

// ==================== CLI PARSER ====================
function parseArgs(argv: string[]): {
  commands: string[];
  options: CliOptions;
} {
  const args = argv.slice(2);
  const options: CliOptions = {};
  const commands: string[] = [];

  console.log('🔍 Debug - Raw args:', args); // Debug

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const flag = arg.slice(2);
      switch (flag) {
        case 'scripts':
          options.scripts = true;
          break;
        case 'dry-run':
          options.dryRun = true;
          break;
        case 'yes':
          options.yes = true;
          break;
        case 'debug':
          options.debug = true;
          break;
        case 'force':
          options.force = true;
          break;
      }
    } else {
      commands.push(arg);
    }
  }

  console.log('🔍 Debug - Parsed commands:', commands); // Debug
  console.log('🔍 Debug - Parsed options:', options); // Debug

  return { commands, options };
}

// ==================== MAIN ====================
async function main(): Promise<void> {
  try {
    const { commands, options } = parseArgs(process.argv);

    console.log('🚀 Starting Prettier Config Manager...\n');

    // No commands = list configs
    if (commands.length === 0) {
      await listConfigs();
      return;
    }

    // Check if "." is in commands = init basic config
    if (commands.includes('.')) {
      await initBasicConfig(options);
      return;
    }

    // First command = install config (skip "prettier-config" if it's there)
    const configName =
      commands.find((cmd) => cmd !== 'prettier-config') || commands[0];
    await installConfig(configName, options);
  } catch (error) {
    console.log('Unexpected error', error);
  }
}

// ==================== RUN ====================
main().catch(console.error);
