import yargs from 'yargs';
import { checkoutBranch } from '../actions/checkout_branch';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: `Optional branch to checkout`,
    demandOption: false,
    type: 'string',
    positional: true,
    hidden: true,
  },
  'show-untracked': {
    describe: `Include untracked branches in interactive selection.`,
    demandOption: false,
    type: 'boolean',
    positional: false,
    alias: 'u',
  },
  all: {
    describe: `Show branches across all configured trunks in interactive selection.`,
    demandOption: false,
    type: 'boolean',
    alias: 'a',
    default: false,
  },
  stack: {
    describe: `Only show ancestors and descendants of the current branch in interactive selection.`,
    demandOption: false,
    type: 'boolean',
    alias: 's',
    default: false,
  },
  trunk: {
    describe: `Checkout the current trunk.`,
    demandOption: false,
    type: 'boolean',
    alias: 't',
    default: false,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'checkout [branch]';
export const canonical = 'checkout';
export const description =
  'Switch to a branch. If no branch is provided, opens an interactive selector.';
export const aliases = ['co'];
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    // Handle --trunk flag
    if (argv.trunk) {
      context.engine.checkoutBranch(context.engine.trunk);
      return;
    }

    return checkoutBranch(
      {
        branchName: argv.branch,
        showUntracked: argv['show-untracked'],
        showAll: argv.all,
        stackOnly: argv.stack,
      },
      context
    );
  });
