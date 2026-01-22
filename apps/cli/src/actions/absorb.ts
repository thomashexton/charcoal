import { spawnSync } from 'child_process';
import chalk from 'chalk';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { ExitFailedError } from '../lib/errors';
import { restackBranches } from './restack';

function checkGitAbsorbInstalled(): void {
  const checkAbsorb = spawnSync('git', ['absorb', '--version'], {
    stdio: 'pipe',
  });
  if (checkAbsorb.status !== 0) {
    throw new ExitFailedError(
      [
        `${chalk.yellow('git-absorb')} is not installed.`,
        `Please install it to use this command: ${chalk.cyan(
          'https://github.com/tummychow/git-absorb#installation'
        )}`,
      ].join('\n')
    );
  }
}

function stageChanges(opts: { all: boolean; patch: boolean }): void {
  if (opts.all) {
    spawnSync('git', ['add', '-u'], { stdio: 'inherit' });
  }
  if (opts.patch) {
    spawnSync('git', ['add', '-p'], { stdio: 'inherit' });
  }
}

function hasStagedChanges(): boolean {
  const result = spawnSync('git', ['diff', '--cached', '--quiet'], {
    stdio: 'pipe',
  });
  return result.status !== 0;
}

interface DryRunResult {
  wouldCommitLines: string[];
  hasWarnings: boolean;
  rawOutput: string;
}

function runDryRun(): DryRunResult {
  const result = spawnSync('git', ['absorb', '--dry-run'], {
    stdio: 'pipe',
    encoding: 'utf-8',
  });

  const rawOutput = (result.stderr || '').trim();
  const lines = rawOutput.split('\n');

  return {
    wouldCommitLines: lines.filter((line) =>
      line.includes('would have committed')
    ),
    hasWarnings: lines.some((line) => line.includes('WARN')),
    rawOutput,
  };
}

function displayAbsorbPlan(dryRun: DryRunResult, context: TContext): void {
  context.splog.info(
    `Found ${chalk.cyan(dryRun.wouldCommitLines.length)} hunk(s) to absorb:`
  );
  context.splog.newline();

  for (const line of dryRun.wouldCommitLines) {
    const match = line.match(/fixup:\s*(.+)$/);
    if (match) {
      context.splog.info(`  ${chalk.green('→')} ${match[1]}`);
    }
  }

  context.splog.newline();

  if (dryRun.hasWarnings) {
    context.splog.warn(
      'Some hunks could not be matched and will remain staged.'
    );
  }
}

function executeAbsorb(): void {
  const result = spawnSync('git', ['absorb', '--and-rebase'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      GIT_SEQUENCE_EDITOR: ':',
    },
  });

  if (result.status !== 0) {
    throw new ExitFailedError('git absorb failed');
  }
}

export async function absorbAction(
  opts: {
    all: boolean;
    dryRun: boolean;
    force: boolean;
    patch: boolean;
  },
  context: TContext
): Promise<void> {
  checkGitAbsorbInstalled();
  stageChanges(opts);

  if (!hasStagedChanges()) {
    context.splog.info('No staged changes to absorb.');
    return;
  }

  const dryRun = runDryRun();

  if (dryRun.wouldCommitLines.length === 0) {
    context.splog.info(
      'No hunks could be matched to commits. Changes remain staged.'
    );
    if (dryRun.rawOutput) {
      context.splog.info(chalk.dim(dryRun.rawOutput));
    }
    return;
  }

  displayAbsorbPlan(dryRun, context);

  if (opts.dryRun) {
    return;
  }

  if (!opts.force && context.interactive) {
    const response = await context.prompts({
      type: 'confirm',
      name: 'value',
      message: 'Absorb these changes?',
      initial: true,
    });

    if (response.value !== true) {
      context.splog.info('Aborted.');
      return;
    }
  }

  executeAbsorb();

  context.engine.rebuild();

  const upstackBranches = context.engine.getRelativeStack(
    context.engine.currentBranchPrecondition,
    SCOPE.UPSTACK_EXCLUSIVE
  );

  if (upstackBranches.length > 0) {
    context.splog.info(
      `Restacking ${upstackBranches.length} upstack branch(es)...`
    );
    restackBranches(upstackBranches, context);
  }

  context.splog.info(
    `Absorbed ${chalk.cyan(dryRun.wouldCommitLines.length)} hunk(s).`
  );
}
