import chalk from 'chalk';
import yargs from 'yargs';
import { graphite } from '../lib/runner';
import { SCOPE } from '../lib/engine/scope_spec';

const args = {
  branch: {
    describe: 'The branch to freeze. Defaults to the current branch.',
    type: 'string',
    demandOption: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'freeze [branch]';
export const canonical = 'freeze';
export const description =
  'Freeze the current branch to prevent it from being submitted.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const targetBranch =
      argv.branch ?? context.engine.currentBranchPrecondition;

    // Per reference: freeze specified branch and branches downstack of it
    const branches = context.engine.getRelativeStack(
      targetBranch,
      SCOPE.DOWNSTACK
    );

    for (const branch of branches) {
      context.engine.setFrozen(branch, true);
    }

    if (branches.length === 1) {
      context.splog.info(`Froze ${chalk.cyan(targetBranch)}.`);
    } else {
      context.splog.info(
        `Froze ${chalk.cyan(targetBranch)} and ${chalk.cyan(
          branches.length - 1
        )} branches downstack.`
      );
    }

    context.splog.info(
      chalk.gray(
        'Frozen branches prevent local modifications including restacks.'
      )
    );
  });
