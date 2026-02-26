import chalk from 'chalk';
import yargs from 'yargs';
import { graphiteWithoutRepo } from '../../lib/runner';

const args = {
  set: {
    demandOption: false,
    default: '',
    type: 'string',
    describe: 'Set dashboard URL. eg --set https://example.com/dashboard.',
  },
  unset: {
    demandOption: false,
    default: false,
    type: 'boolean',
    describe: 'Unset dashboard URL.',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const command = 'dash-url';
export const description = 'The dashboard URL opened by `gt dash`.';
export const canonical = 'config dash-url';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphiteWithoutRepo(argv, canonical, async (context) => {
    if (argv.set) {
      context.userConfig.update((data) => (data.dashUrl = argv.set));
      context.splog.info(`Dashboard URL set to ${argv.set}`);
    } else if (argv.unset) {
      context.userConfig.update((data) => (data.dashUrl = undefined));
      context.splog.info('Dashboard URL unset.');
    } else {
      context.userConfig.data.dashUrl
        ? context.splog.info(context.userConfig.data.dashUrl)
        : context.splog.info(
            `Dashboard URL is not set. Use ${chalk.cyan(
              'gt config dash-url --set <url>'
            )} to configure it.`
          );
    }
  });
};
