import yargs from 'yargs';
import { graphiteWithoutRepo } from '../../lib/runner';

const args = {
  set: {
    demandOption: false,
    type: 'string',
    describe: 'Set a custom title for the PR dependency tree footer.',
  },
  unset: {
    demandOption: false,
    default: false,
    type: 'boolean',
    describe: 'Reset to the default title ("PR Dependency Tree").',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'submit-footer-title';
export const description =
  'Customize the title of the PR dependency tree footer.';
export const canonical = 'config submit-footer-title';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphiteWithoutRepo(argv, canonical, async (context) => {
    if (argv.set) {
      context.userConfig.update((data) => (data.submitFooterTitle = argv.set));
      context.splog.info(`PR footer title set to: ${argv.set}`);
    } else if (argv.unset) {
      context.userConfig.update((data) => (data.submitFooterTitle = undefined));
      context.splog.info(`PR footer title reset to default.`);
    } else {
      const title =
        context.userConfig.data.submitFooterTitle ?? 'PR Dependency Tree';
      context.splog.info(`PR footer title: ${title}`);
    }
  });
};
