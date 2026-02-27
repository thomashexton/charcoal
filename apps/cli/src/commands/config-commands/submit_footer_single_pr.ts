import yargs from 'yargs';
import { graphiteWithoutRepo } from '../../lib/runner';

const args = {
  enable: {
    demandOption: false,
    default: false,
    type: 'boolean',
    describe:
      'Enable the PR dependency tree footer on single (non-stacked) PRs.',
  },
  disable: {
    demandOption: false,
    default: false,
    type: 'boolean',
    describe:
      'Disable the PR dependency tree footer on single (non-stacked) PRs.',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'submit-footer-single-pr';
export const description =
  'Show the PR dependency tree footer on single (non-stacked) PRs.';
export const canonical = 'config submit-footer-single-pr';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphiteWithoutRepo(argv, canonical, async (context) => {
    if (argv.enable) {
      context.userConfig.update((data) => (data.submitFooterOnSinglePr = true));
      context.splog.info(`PR dependency tree footer on single PRs: enabled`);
    } else if (argv.disable) {
      context.userConfig.update(
        (data) => (data.submitFooterOnSinglePr = false)
      );
      context.splog.info(`PR dependency tree footer on single PRs: disabled`);
    } else {
      const enabled = context.userConfig.data.submitFooterOnSinglePr ?? false;
      context.splog.info(
        `PR dependency tree footer on single PRs: ${
          enabled ? 'enabled' : 'disabled (default)'
        }`
      );
    }
  });
};
