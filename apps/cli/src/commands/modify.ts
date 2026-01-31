import yargs from 'yargs';
import { commitAmendAction } from '../actions/commit_amend';
import { commitCreateAction } from '../actions/commit_create';
import { graphite } from '../lib/runner';

const args = {
  all: {
    describe: 'Stage all changes before committing.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'a',
  },
  message: {
    type: 'string',
    alias: 'm',
    describe: 'The message for the commit.',
    demandOption: false,
  },
  commit: {
    type: 'boolean',
    alias: 'c',
    describe: 'Create a new commit instead of amending.',
    demandOption: false,
    default: false,
  },
  amend: {
    type: 'boolean',
    describe: 'Amend the most recent commit (default behavior).',
    demandOption: false,
    default: false,
  },
  edit: {
    type: 'boolean',
    describe: 'Modify the existing commit message.',
    demandOption: false,
    default: true,
  },
  'no-edit': {
    type: 'boolean',
    describe:
      "Don't modify the existing commit message. Takes precedence over --edit.",
    demandOption: false,
    default: false,
    alias: 'n',
  },
  patch: {
    describe: 'Pick hunks to stage before committing.',
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'p',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'modify';
export const canonical = 'modify';
export const aliases = ['m'];
export const description =
  'Amend the current commit or create a new one, then restack upstack branches.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, canonical, async (context) => {
    if (argv.commit) {
      return commitCreateAction(
        {
          message: argv.message,
          addAll: argv.all,
          patch: argv.patch,
        },
        context
      );
    }

    return commitAmendAction(
      {
        message: argv.message,
        noEdit: argv['no-edit'] || !argv.edit,
        addAll: argv.all,
        patch: argv.patch,
      },
      context
    );
  });
};
