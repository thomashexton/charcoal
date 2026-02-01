import yargs from 'yargs';
import { unlinkBranch } from '../actions/unlink_branch';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: `The branch to unlink from its associated pull request.`,
    demandOption: false,
    positional: true,
    type: 'string',
    hidden: true,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'unlink [branch]';
export const canonical = 'unlink';
export const description =
  'Unlink the PR currently associated with the branch.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) =>
    unlinkBranch(
      {
        branchName: argv.branch ?? context.engine.currentBranchPrecondition,
      },
      context
    )
  );
