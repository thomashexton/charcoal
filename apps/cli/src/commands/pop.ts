import chalk from 'chalk';
import yargs from 'yargs';
import { execSync } from 'child_process';
import { graphite } from '../lib/runner';
import { PreconditionsFailedError } from '../lib/errors';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'pop';
export const canonical = 'pop';
export const description =
  'Delete the current branch but retain the state of files in the working tree.';

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const currentBranch = context.engine.currentBranchPrecondition;
    const parent = context.engine.getParent(currentBranch);

    if (!parent) {
      throw new PreconditionsFailedError('Cannot pop trunk.');
    }

    // Soft reset to preserve working tree state, then switch to parent
    // This keeps all changes from the current branch as uncommitted changes
    context.splog.info(
      `Popping ${chalk.cyan(currentBranch)}, preserving working tree...`
    );

    // Get the merge base to know what changes to preserve
    const currentHead = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
    }).trim();

    // Switch to parent branch
    context.engine.checkoutBranch(parent);

    // Soft reset to bring the changes back as uncommitted
    execSync(`git reset --soft ${currentHead}`, { encoding: 'utf-8' });
    execSync('git reset HEAD', { encoding: 'utf-8' }); // Unstage but keep in working tree

    // Delete the old branch from Charcoal tracking and git
    context.engine.deleteBranch(currentBranch);
    try {
      execSync(`git branch -D ${currentBranch}`, { encoding: 'utf-8' });
    } catch {
      // Branch may already be deleted
    }

    context.splog.info(
      `Deleted ${chalk.cyan(
        currentBranch
      )}. Changes are preserved in your working tree.`
    );
  });
