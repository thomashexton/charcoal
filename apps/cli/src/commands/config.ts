import chalk from 'chalk';
import yargs from 'yargs';
import { graphite } from '../lib/runner';

const CONFIG_KEYS = [
  'branchPrefix',
  'branchDate',
  'branchReplacement',
  'tips',
  'editor',
  'pager',
  'restackCommitterDateIsAuthorDate',
  'submitIncludeCommitMessages',
] as const;

type ConfigKey = (typeof CONFIG_KEYS)[number];

const keyValueArgs = {
  key: {
    describe: 'Configuration key to get or set.',
    type: 'string',
    demandOption: false,
  },
  value: {
    describe: 'Value to set for the configuration key.',
    type: 'string',
    demandOption: false,
  },
  list: {
    describe: 'List all configuration values.',
    type: 'boolean',
    alias: 'l',
    default: false,
  },
} as const;

type KeyValueArgsT = yargs.Arguments<
  yargs.InferredOptionTypes<typeof keyValueArgs>
>;

export const command = 'config [key] [value]';
export const canonical = 'config';
export const description = 'Get or set Charcoal configuration values.';

export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs
    .commandDir('config-commands', {
      extensions: ['js'],
    })
    .options(keyValueArgs)
    .check((argv) => {
      if (argv._.length === 1 || argv.list || argv.key) {
        return true;
      }
      return true;
    });
};

export const handler = async (argv: KeyValueArgsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    if (argv.list || (!argv.key && !argv.value)) {
      context.splog.info(chalk.bold('User configuration:'));
      for (const key of CONFIG_KEYS) {
        const value = context.userConfig.data[key];
        const displayValue =
          value === undefined ? chalk.gray('(not set)') : String(value);
        context.splog.info(`  ${key}: ${displayValue}`);
      }
      return;
    }

    const key = argv.key as ConfigKey;
    if (!CONFIG_KEYS.includes(key)) {
      context.splog.error(
        `Unknown configuration key: ${key}. Valid keys: ${CONFIG_KEYS.join(
          ', '
        )}`
      );
      return;
    }

    if (argv.value === undefined) {
      const value = context.userConfig.data[key];
      if (value === undefined) {
        context.splog.info(chalk.gray('(not set)'));
      } else {
        context.splog.info(String(value));
      }
      return;
    }

    let parsedValue: string | boolean = argv.value;
    if (argv.value === 'true') {
      parsedValue = true;
    } else if (argv.value === 'false') {
      parsedValue = false;
    }

    context.userConfig.update(
      (data) => ((data as Record<string, unknown>)[key] = parsedValue)
    );
    context.splog.info(`Set ${key} to ${chalk.cyan(String(parsedValue))}`);
  });
