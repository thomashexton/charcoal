import yargs from 'yargs';
import { showBranchInfo } from '../actions/show_branch';
import { ExitFailedError } from '../lib/errors';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: 'Branch to show info for (defaults to current branch)',
    demandOption: false,
    type: 'string',
    positional: true,
    hidden: true,
  },
  patch: {
    describe: `Show the changes made by each commit.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'p',
  },
  diff: {
    describe: `Show the diff between this branch and its parent. Takes precedence over patch`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'd',
  },
  body: {
    describe: `Show the PR body, if it exists.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'b',
  },
  stat: {
    describe: `Show a diffstat instead of a full diff. Modifies either --patch or --diff. If neither is passed, implies --diff.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 's',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'info [branch]';
export const canonical = 'info';
export const aliases = ['i'];
export const description =
  'Display information about a branch (defaults to current branch).';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    let branchName: string;
    if (argv.branch) {
      if (!context.engine.branchExists(argv.branch)) {
        throw new ExitFailedError(`Branch '${argv.branch}' does not exist.`);
      }
      branchName = argv.branch;
    } else {
      branchName = context.engine.currentBranchPrecondition;
    }

    const diff = argv.diff || (argv.stat && !argv.patch);
    await showBranchInfo(
      branchName,
      { patch: argv.patch, diff, body: argv.body, stat: argv.stat },
      context
    );
  });
};
