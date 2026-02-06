import yargs from 'yargs';
import { syncAction } from '../actions/sync/sync';
import { graphite } from '../lib/runner';

const args = {
  all: {
    describe: `Sync branches across all configured trunks.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'a',
  },
  force: {
    describe: `Don't prompt for confirmation before overwriting or deleting a branch in any place where confirmation is requested.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'f',
  },
  restack: {
    describe: `Restack any branches that can be restacked without conflicts (true by default; skip with --no-restack).`,
    demandOption: false,
    default: true,
    type: 'boolean',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'sync';
export const canonical = 'sync';
export const description =
  'Pull the trunk branch from remote and delete any branches that have been merged. If trunk cannot be fast-forwarded to match remote, overwrites trunk with the remote version.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    await syncAction(
      {
        pull: true,
        force: argv.force,
        delete: true,
        showDeleteProgress: false,
        restack: argv.restack,
        all: argv.all,
      },
      context
    );
  });
};
