import chalk from 'chalk';
import yargs from 'yargs';
import { graphite } from '../lib/runner';
import { SCOPE } from '../lib/engine/scope_spec';

const args = {
  branch: {
    describe: 'The branch to unfreeze. Defaults to the current branch.',
    type: 'string',
    demandOption: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'unfreeze [branch]';
export const canonical = 'unfreeze';
export const description = 'Unfreeze the current branch to allow submission.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const targetBranch =
      argv.branch ?? context.engine.currentBranchPrecondition;

    // Per reference: unfreeze specified branch and branches upstack of it
    const branches = context.engine.getRelativeStack(
      targetBranch,
      SCOPE.UPSTACK
    );

    for (const branch of branches) {
      context.engine.setFrozen(branch, false);
    }

    if (branches.length === 1) {
      context.splog.info(`Unfroze ${chalk.cyan(targetBranch)}.`);
    } else {
      context.splog.info(
        `Unfroze ${chalk.cyan(targetBranch)} and ${chalk.cyan(
          branches.length - 1
        )} branches upstack.`
      );
    }
  });
