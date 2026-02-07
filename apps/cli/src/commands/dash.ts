import chalk from 'chalk';
import open from 'open';
import yargs from 'yargs';
import { graphiteWithoutRepo } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'dash';
export const canonical = 'dash';
export const description = 'Open your dashboard in the browser.';

export const handler = async (argv: argsT): Promise<void> =>
  graphiteWithoutRepo(argv, canonical, async (context) => {
    const dashUrl = context.userConfig.data.dashUrl;
    if (!dashUrl) {
      context.splog.info(
        `No dashboard URL configured.\n\nSet one with:\n  ${chalk.cyan(
          'gt config dash-url --set <url>'
        )}`
      );
      return;
    }
    context.splog.info(dashUrl);
    if (!process.env.GT_DISABLE_OPEN) {
      await open(dashUrl);
    }
  });
