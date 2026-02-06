import yargs from 'yargs';
import { graphite } from '../lib/runner';
import { PreconditionsFailedError } from '../lib/errors';

const args = {
  force: {
    describe: 'Do not prompt for confirmation; abort immediately.',
    type: 'boolean',
    alias: 'f',
    default: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'abort';
export const canonical = 'abort';
export const description = 'Abort the current rebase operation.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    if (!context.engine.rebaseInProgress()) {
      throw new PreconditionsFailedError('No rebase in progress to abort.');
    }

    if (!argv.force && context.interactive) {
      const confirm = await context.prompts({
        type: 'confirm',
        name: 'value',
        message: 'Abort the current rebase operation?',
        initial: false,
      });

      if (!confirm.value) {
        context.splog.info('Abort cancelled.');
        return;
      }
    }

    context.engine.abortRebase();
    context.splog.info('Rebase aborted.');
  });
