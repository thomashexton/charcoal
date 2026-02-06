import { spawnSync } from 'child_process';
import { existsSync } from 'fs-extra';
import yargs from 'yargs';
import { graphiteWithoutRepo } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'upgrade';
export const canonical = 'upgrade';
export const description = 'Upgrade Charcoal to the latest version.';

export const handler = async (argv: argsT): Promise<void> =>
  graphiteWithoutRepo(argv, canonical, async (context) => {
    const execPath = process.execPath;
    const scriptPath = process.argv[1];

    if (existsSync('/opt/homebrew/bin/charcoal')) {
      context.splog.info(
        'Detected Homebrew installation. Running brew upgrade...'
      );
      const result = spawnSync('brew', ['upgrade', 'charcoal'], {
        stdio: 'inherit',
      });
      process.exitCode = result.status ?? 0;
      return;
    }

    if (existsSync('/usr/local/bin/charcoal')) {
      context.splog.info(
        'Detected Homebrew installation. Running brew upgrade...'
      );
      const result = spawnSync('brew', ['upgrade', 'charcoal'], {
        stdio: 'inherit',
      });
      process.exitCode = result.status ?? 0;
      return;
    }

    if (scriptPath.includes('node_modules') || execPath.includes('node')) {
      context.splog.info('Detected npm installation. Running npm update...');
      const result = spawnSync(
        'npm',
        ['update', '-g', '@danerwilliams/charcoal'],
        { stdio: 'inherit' }
      );
      process.exitCode = result.status ?? 0;
      return;
    }

    context.splog.info(
      'Could not detect installation method. Please update manually:'
    );
    context.splog.info('  npm: npm update -g @danerwilliams/charcoal');
    context.splog.info('  brew: brew upgrade charcoal');
  });
