import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'parent';
export const canonical = 'parent';
export const description = 'Show the parent branch of the current branch.';

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const currentBranch = context.engine.currentBranchPrecondition;
    const parent = context.engine.getParent(currentBranch);

    if (parent) {
      context.splog.info(parent);
    } else {
      context.splog.info('No parent branch (on trunk).');
    }
  });
