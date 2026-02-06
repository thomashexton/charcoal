import yargs from 'yargs';
import { ExitFailedError } from '../lib/errors';
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
  remove: {
    describe: 'Remove an additional trunk.',
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
      // Validate branch exists
      if (!context.engine.branchExists(argv.add)) {
        throw new ExitFailedError(`Branch '${argv.add}' does not exist.`);
      }
      // Don't allow adding the primary trunk
      if (argv.add === context.engine.trunk) {
        context.splog.info(`'${argv.add}' is already the primary trunk.`);
        return;
      }
      context.repoConfig.addTrunk(argv.add);
      context.splog.info(`Added '${argv.add}' as an additional trunk.`);
      return;
    }

    if (argv.remove) {
      context.repoConfig.removeTrunk(argv.remove);
      context.splog.info(`Removed '${argv.remove}' from additional trunks.`);
      return;
    }

    if (argv.all) {
      const allTrunks = context.repoConfig.getAllTrunks();
      allTrunks.forEach((trunk) => context.splog.info(trunk));
      return;
    }

    context.splog.info(context.engine.trunk);
  });
