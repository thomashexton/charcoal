import chalk from 'chalk';
import yargs from 'yargs';
import { execSync, spawnSync } from 'child_process';
import { graphite } from '../lib/runner';
import {
  getRecentOperations,
  popLastOperation,
} from '../lib/engine/operation_log';

const args = {
  force: {
    describe:
      'Do not prompt for confirmation; undo the most recent command immediately.',
    type: 'boolean',
    alias: 'f',
    default: false,
  },
  list: {
    describe: 'List recent Charcoal operations without undoing.',
    type: 'boolean',
    alias: 'l',
    default: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'undo';
export const canonical = 'undo';
export const description =
  'Undo recent Charcoal operations or list operation history.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    // Show recent Charcoal operations
    const recentOps = getRecentOperations(10);

    if (argv.list) {
      if (recentOps.length === 0) {
        context.splog.info('No recent Charcoal operations.');
        return;
      }
      context.splog.info(chalk.bold('Recent Charcoal operations:'));
      recentOps.forEach((op, i) => {
        const date = new Date(op.timestamp).toLocaleString();
        const dataStr =
          Object.keys(op.data).length > 0
            ? chalk.gray(` (${JSON.stringify(op.data)})`)
            : '';
        context.splog.info(
          `  ${i + 1}. [${chalk.cyan(op.type)}] ${
            op.branchName
          }${dataStr} - ${chalk.dim(date)}`
        );
      });
      return;
    }

    if (recentOps.length > 0) {
      context.splog.info(chalk.bold('Recent Charcoal operations:'));
      recentOps.forEach((op, i) => {
        const date = new Date(op.timestamp).toLocaleString();
        context.splog.info(
          `  ${i + 1}. [${op.type}] ${op.branchName} - ${date}`
        );
      });
      context.splog.info('');
    }

    const result = spawnSync('git', ['reflog', '--oneline', '-n', '20'], {
      encoding: 'utf-8',
    });

    if (result.status !== 0) {
      context.splog.error('Failed to read git reflog.');
      return;
    }

    const lines = result.stdout.trim().split('\n');
    if (lines.length < 2) {
      context.splog.info('No operations to undo.');
      return;
    }

    // Find the most recent HEAD@{N} to undo to
    context.splog.info(chalk.bold('Recent reflog entries:'));
    context.splog.info(result.stdout);

    if (argv.force) {
      // Undo to HEAD@{1} immediately
      context.splog.info(chalk.yellow('Undoing to HEAD@{1}...'));
      try {
        execSync('git reset --hard HEAD@{1}', { stdio: 'inherit' });
        popLastOperation();
        context.splog.info(chalk.green('Undo complete.'));
        context.splog.info(
          chalk.gray(
            'Note: Charcoal metadata may need to be rebuilt with `gt init`.'
          )
        );
      } catch {
        context.splog.error('Failed to undo.');
      }
      return;
    }

    // Interactive mode: prompt for confirmation
    if (context.interactive) {
      const confirm = await context.prompts({
        type: 'confirm',
        name: 'value',
        message: 'Undo the most recent operation (reset to HEAD@{1})?',
        initial: false,
      });

      if (confirm.value) {
        try {
          execSync('git reset --hard HEAD@{1}', { stdio: 'inherit' });
          popLastOperation();
          context.splog.info(chalk.green('Undo complete.'));
          context.splog.info(
            chalk.gray(
              'Note: Charcoal metadata may need to be rebuilt with `gt init`.'
            )
          );
        } catch {
          context.splog.error('Failed to undo.');
        }
        return;
      }
    }

    context.splog.info('');
    context.splog.info(chalk.gray('To undo to a specific state, run:'));
    context.splog.info(chalk.cyan('  git reset --hard HEAD@{N}'));
    context.splog.info('');
    context.splog.info(
      chalk.gray(
        'Where N is the number of the reflog entry you want to restore.'
      )
    );
  });
