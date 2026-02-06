import yargs from 'yargs';
import { deleteBranchAction } from '../actions/delete_branch';
import { graphite } from '../lib/runner';

const args = {
  name: {
    type: 'string',
    positional: true,
    demandOption: false,
    optional: true,
    describe:
      'The name of the branch to delete. If no branch is provided, opens an interactive selector.',
    hidden: true,
  },
  force: {
    describe: `Delete the branch even if it is not merged or closed.`,
    demandOption: false,
    type: 'boolean',
    alias: 'f',
    default: false,
  },
  close: {
    describe: `Close associated pull requests on GitHub.`,
    demandOption: false,
    type: 'boolean',
    alias: 'c',
    default: false,
  },
  downstack: {
    describe: `Also delete any ancestors of the specified branch.`,
    demandOption: false,
    type: 'boolean',
    default: false,
  },
  upstack: {
    describe: `Also delete any children of the specified branch.`,
    demandOption: false,
    type: 'boolean',
    default: false,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const aliases = ['dl'];
export const command = 'delete [name]';
export const canonical = 'delete';
export const description =
  'Delete a branch and its corresponding Charcoal metadata.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) =>
    deleteBranchAction(
      {
        branchName: argv.name,
        force: argv.force,
        close: argv.close,
        downstack: argv.downstack,
        upstack: argv.upstack,
      },
      context
    )
  );
