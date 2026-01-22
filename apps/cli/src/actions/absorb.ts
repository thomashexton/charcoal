import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { ExitFailedError } from '../lib/errors';
import { restackBranches } from './restack';

export function absorbAction(
  opts: {
    all: boolean;
    dryRun: boolean;
    force: boolean;
    patch: boolean;
  },
  context: TContext
): void {
  // Check if git-absorb is installed
  const checkAbsorb = spawnSync('git', ['absorb', '--version'], {
    stdio: 'pipe',
  });
  if (checkAbsorb.status !== 0) {
    throw new ExitFailedError(
      [
        `${chalk.yellow('git-absorb')} is not installed.`,
        `Please install it to use this command: ${chalk.cyan(
          'https://github.com/tummychow/git-absorb#installation'
        )}`,
      ].join('\n')
    );
  }

  // Handle -a/--all
  if (opts.all) {
    // Stage all unstaged changes to tracked files.
    // Equivalent to git add -u
    spawnSync('git', ['add', '-u'], { stdio: 'inherit' });
  }

  // Handle -p/--patch
  if (opts.patch) {
    // Interactive staging.
    spawnSync('git', ['add', '-p'], { stdio: 'inherit' });
  }

  // Construct git absorb command
  const absorbArgs = ['absorb'];
  if (opts.dryRun) absorbArgs.push('--dry-run');
  if (opts.force) absorbArgs.push('--force');

  // Run git absorb
  const result = spawnSync('git', absorbArgs, { stdio: 'inherit' });

  if (result.status !== 0) {
    return;
  }

  // If dry-run, we don't restack.
  if (opts.dryRun) {
    return;
  }

  // After git absorb, history has changed, so we must rebuild the engine cache.
  context.engine.rebuild();

  // Restack upstack branches
  restackBranches(
    context.engine.getRelativeStack(
      context.engine.currentBranchPrecondition,
      SCOPE.UPSTACK_EXCLUSIVE
    ),
    context
  );
}
