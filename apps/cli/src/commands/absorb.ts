import yargs from 'yargs';
import { graphite } from '../lib/runner';
import { absorbAction } from '../actions/absorb';

const args = {
  all: {
    describe: 'Stage all unstaged changes before absorbing.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'a',
  },
  'dry-run': {
    describe:
      'Print which commits the hunks would be absorbed into, but do not actually absorb them.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'd',
  },
  force: {
    describe:
      'Do not prompt for confirmation; apply the hunks to the commits immediately.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'f',
  },
  patch: {
    describe: 'Pick hunks to stage before absorbing.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'p',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'absorb';
export const aliases = [];
export const description =
  'Amend staged changes to the relevant commits in the current stack.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, command, async (context) =>
    absorbAction(
      {
        all: argv.all,
        dryRun: argv['dry-run'],
        force: argv.force,
        patch: argv.patch,
      },
      context
    )
  );
};
