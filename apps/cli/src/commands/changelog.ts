import open from 'open';
import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'changelog';
export const canonical = 'changelog';
export const description = 'Open the Charcoal changelog in your browser.';

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const changelogUrl = 'https://github.com/danerwilliams/charcoal/releases';
    context.splog.info(`Opening ${changelogUrl}`);
    await open(changelogUrl);
  });
