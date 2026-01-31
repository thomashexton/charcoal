import chalk from 'chalk';
import yargs from 'yargs';
import { graphite } from '../lib/runner';

const args = {
  legacy: {
    describe:
      'Append legacy aliases to your configuration. See https://graphite.com/docs/legacy-alias-preset for more details.',
    type: 'boolean',
    default: false,
  },
  reset: {
    describe: 'Reset your alias configuration.',
    type: 'boolean',
    default: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'aliases';
export const canonical = 'aliases';
export const description = 'Show available command aliases.';
export const builder = args;

const ALIASES: Record<string, string[]> = {
  bottom: ['bo'],
  checkout: ['co'],
  continue: ['cont'],
  create: ['c'],
  delete: ['dl'],
  down: ['d'],
  fold: ['fo'],
  info: ['i'],
  log: ['l'],
  'log short': ['ls', 's'],
  modify: ['m'],
  move: ['mv'],
  rename: ['rn'],
  restack: ['r', 'fix', 'f'],
  split: ['sp'],
  squash: ['sq'],
  submit: ['ss (with --stack)'],
  top: ['t'],
  track: ['tr'],
  untrack: ['ut'],
  up: ['u'],
  get: ['g'],
};

const LEGACY_ALIASES: Record<string, string[]> = {
  'branch create': ['bc'],
  'branch delete': ['bd'],
  'branch info': ['bi'],
  'branch rename': ['br'],
  'downstack submit': ['dss'],
  'stack submit': ['ss'],
};

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    if (argv.reset) {
      context.splog.info(
        chalk.yellow('Alias configuration reset is not yet implemented.')
      );
      context.splog.info(
        chalk.gray('Charcoal uses built-in aliases that cannot be modified.')
      );
      return;
    }

    if (argv.legacy) {
      context.splog.info(chalk.bold('Legacy aliases (deprecated):'));
      context.splog.info('');
      for (const [command, aliases] of Object.entries(LEGACY_ALIASES)) {
        context.splog.info(
          `  ${chalk.cyan(command.padEnd(20))} → ${aliases.join(', ')}`
        );
      }
      context.splog.info('');
      context.splog.info(
        chalk.yellow(
          'Note: Legacy aliases are supported for compatibility but deprecated.'
        )
      );
      return;
    }

    context.splog.info(chalk.bold('Available aliases:'));
    context.splog.info('');

    for (const [command, aliases] of Object.entries(ALIASES)) {
      context.splog.info(
        `  ${chalk.cyan(command.padEnd(15))} → ${aliases.join(', ')}`
      );
    }

    context.splog.info('');
    context.splog.info(
      chalk.gray('Tip: You can also use shell aliases in your .bashrc/.zshrc')
    );
  });
