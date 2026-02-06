import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'children';
export const canonical = 'children';
export const description = 'Show the child branches of the current branch.';

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const currentBranch = context.engine.currentBranchPrecondition;
    const children = context.engine.getChildren(currentBranch);

    if (children.length > 0) {
      children.forEach((child) => context.splog.info(child));
    } else {
      context.splog.info('No child branches.');
    }
  });
