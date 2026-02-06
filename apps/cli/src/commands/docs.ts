import open from 'open';
import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'docs';
export const canonical = 'docs';
export const description = 'Open the Charcoal documentation in your browser.';

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const docsUrl = 'https://github.com/danerwilliams/charcoal#readme';
    context.splog.info(`Opening ${docsUrl}`);
    await open(docsUrl);
  });
