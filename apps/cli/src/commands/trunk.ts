import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {
  all: {
    describe: 'Show all configured trunks.',
    type: 'boolean',
    alias: 'a',
    default: false,
  },
  add: {
    describe: 'Add an additional trunk.',
    type: 'string',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'trunk';
export const canonical = 'trunk';
export const description = 'Show the name of the trunk branch.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    if (argv.add) {
      context.splog.info(
        `Adding additional trunks is not yet supported. Current trunk: ${context.engine.trunk}`
      );
      return;
    }

    if (argv.all) {
      // For now, we only support a single trunk
      context.splog.info(context.engine.trunk);
      return;
    }

    context.splog.info(context.engine.trunk);
  });
