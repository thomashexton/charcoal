import chalk from 'chalk';
import yargs from 'yargs';
import { graphite } from '../lib/runner';

// Map internal config keys to CLI command names
const USER_CONFIG_MAP: Record<string, string> = {
  branchPrefix: 'branch-prefix',
  branchDate: 'branch-date',
  branchReplacement: 'branch-replacement',
  branchLowercase: 'branch-lowercase',
  branchReplaceSlashes: 'branch-replace-slashes',
  tips: 'tips',
  editor: 'editor',
  pager: 'pager',
  restackCommitterDateIsAuthorDate: 'restack-date',
  submitIncludeCommitMessages: 'submit-body',
};

const args = {
  list: {
    describe: 'List all configuration values.',
    type: 'boolean',
    alias: 'l',
    default: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'config';
export const canonical = 'config';
export const description =
  'View or modify Charcoal configuration. Use subcommands for repo settings.';

export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs
    .commandDir('config-commands', {
      extensions: ['js'],
    })
    .options(args)
    .example('$0 config', 'Show all configuration')
    .example('$0 config branch-prefix --set "user/"', 'Set branch prefix')
    .example('$0 config repo-remote --set upstream', 'Set git remote');
};

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    // Show user configuration
    context.splog.info(chalk.bold('User configuration:'));
    context.splog.info('');

    let hasAnySet = false;
    for (const [internalKey, cliName] of Object.entries(USER_CONFIG_MAP)) {
      const value = (context.userConfig.data as Record<string, unknown>)[
        internalKey
      ];
      if (value !== undefined) {
        hasAnySet = true;
        context.splog.info(`  ${chalk.cyan(cliName)}: ${String(value)}`);
      }
    }

    if (!hasAnySet) {
      context.splog.info(chalk.gray('  (no user settings configured)'));
    }

    context.splog.info('');
    context.splog.info(chalk.bold('Repository configuration:'));
    context.splog.info('');
    context.splog.info(
      `  ${chalk.cyan('remote')}: ${context.repoConfig.getRemote()}`
    );
    context.splog.info(`  ${chalk.cyan('trunk')}: ${context.engine.trunk}`);
    context.splog.info(
      `  ${chalk.cyan('owner')}: ${context.repoConfig.getRepoOwner()}`
    );
    context.splog.info(
      `  ${chalk.cyan('name')}: ${context.repoConfig.getRepoName()}`
    );

    context.splog.info('');
    context.splog.info(
      chalk.gray('Tip: Use `gt config <setting> --set <value>` to modify')
    );
  });
