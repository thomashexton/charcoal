import yargs from 'yargs';
import { revertAction } from '../actions/revert';
import { graphite } from '../lib/runner';

const args = {
  sha: {
    type: 'string',
    positional: true,
    demandOption: true,
    describe: 'The commit SHA to revert.',
    hidden: true,
  },
  edit: {
    describe: `Edit the commit message.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'e',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'revert <sha>';
export const canonical = 'revert';
export const description =
  'Create a branch that reverts a commit on the trunk branch. Currently experimental.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    await revertAction(
      {
        sha: argv.sha,
        edit: argv.edit,
      },
      context
    );
  });
};
