import yargs from 'yargs';
import { getAction } from '../actions/sync/get';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: 'Branch or PR number to get from remote.',
    demandOption: false,
    type: 'string',
    positional: true,
    hidden: true,
  },
  force: {
    describe: 'Overwrite all fetched branches with remote source of truth.',
    demandOption: false,
    type: 'boolean',
    default: false,
    alias: 'f',
  },
  downstack: {
    describe:
      "When syncing a branch that already exists locally, don't sync upstack branches.",
    demandOption: false,
    type: 'boolean',
    default: false,
    alias: 'd',
  },
  restack: {
    describe:
      'Restack any branches in the stack that can be restacked without conflicts (true by default; skip with --no-restack).',
    demandOption: false,
    type: 'boolean',
    default: true,
  },
  unfrozen: {
    describe: 'Checkout new branches as unfrozen (allow local edits).',
    demandOption: false,
    type: 'boolean',
    default: false,
    alias: 'U',
  },
  'remote-upstack': {
    describe: 'Include upstack PRs when fetching PR information from remote.',
    demandOption: false,
    type: 'boolean',
    default: false,
    alias: 'u',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'get [branch]';
export const canonical = 'get';
export const aliases = ['g'];
export const description =
  'Get branches from trunk to the specified branch from remote, prompting to resolve conflicts. If no branch is provided, get downstack from the current branch.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(
    argv,
    canonical,
    async (context) =>
      await getAction(
        {
          branchName: argv.branch,
          force: argv.force,
          downstackOnly: argv.downstack,
          restack: argv.restack,
          unfrozen: argv.unfrozen,
          remoteUpstack: argv['remote-upstack'],
        },
        context
      )
  );
