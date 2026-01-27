import chalk from 'chalk';
import { spawnSync } from 'child_process';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { ExitFailedError } from '../lib/errors';
import { restackBranches } from './restack';

export function deleteBranchAction(
  args: {
    branchName?: string;
    force?: boolean;
    close?: boolean;
    downstack?: boolean;
    upstack?: boolean;
  },
  context: TContext
): void {
  const branchName =
    args.branchName ?? context.engine.currentBranchPrecondition;
  if (context.engine.isTrunk(branchName)) {
    throw new ExitFailedError('Cannot delete trunk!');
  }

  const branchesToDelete = collectBranchesToDelete(
    {
      branchName,
      downstack: args.downstack ?? false,
      upstack: args.upstack ?? false,
    },
    context
  );

  for (const branch of branchesToDelete) {
    if (!args.force && !isSafeToDelete(branch, context).result) {
      throw new ExitFailedError(
        [
          `The branch ${branch} is neither merged nor closed.  Use the \`--force\` option to delete it.`,
          `Note that its changes will be lost, as its children will be restacked onto its parent.`,
        ].join('\n')
      );
    }
  }

  const lastBranch = branchesToDelete[branchesToDelete.length - 1];
  const branchesToRestack = context.engine.getRelativeStack(
    lastBranch,
    SCOPE.UPSTACK_EXCLUSIVE
  );

  for (const branch of branchesToDelete) {
    if (args.close) {
      closePrForBranch(branch, context);
    }
    context.engine.deleteBranch(branch);
    context.splog.info(`Deleted branch ${chalk.red(branch)}`);
  }

  restackBranches(branchesToRestack, context);
}

function collectBranchesToDelete(
  opts: { branchName: string; downstack: boolean; upstack: boolean },
  context: TContext
): string[] {
  const { branchName, downstack, upstack } = opts;
  const branches: string[] = [];

  if (downstack) {
    const ancestors = context.engine.getRelativeStack(branchName, {
      recursiveParents: true,
      currentBranch: false,
      recursiveChildren: false,
    });
    branches.push(...ancestors.filter((b) => !context.engine.isTrunk(b)));
  }

  branches.push(branchName);

  if (upstack) {
    const descendants = context.engine.getRelativeStack(branchName, {
      recursiveParents: false,
      currentBranch: false,
      recursiveChildren: true,
    });
    branches.push(...descendants.reverse());
  }

  return branches;
}

function closePrForBranch(branchName: string, context: TContext): void {
  const prInfo = context.engine.getPrInfo(branchName);
  if (
    prInfo?.number &&
    prInfo.state !== 'CLOSED' &&
    prInfo.state !== 'MERGED'
  ) {
    const result = spawnSync('gh', ['pr', 'close', String(prInfo.number)], {
      stdio: 'inherit',
    });
    if (result.status === 0) {
      context.splog.info(
        `Closed PR #${prInfo.number} for ${chalk.cyan(branchName)}`
      );
    }
  }
}

// Where did we merge this? If it was merged on GitHub, we see where it was
// merged into. If we don't detect that it was merged in GitHub but we do
// see the code in trunk, we fallback to say that it was merged into trunk.
// This extra check (rather than just saying trunk) is used to catch the
// case where one feature branch is merged into another on GitHub.
export function isSafeToDelete(
  branchName: string,
  context: TContext
): { result: true; reason: string } | { result: false } {
  const prInfo = context.engine.getPrInfo(branchName);

  const reason =
    prInfo?.state === 'CLOSED'
      ? `${chalk.redBright(branchName)} is closed on GitHub`
      : prInfo?.state === 'MERGED'
      ? `${chalk.green(branchName)} is merged into ${chalk.cyan(
          prInfo?.base ?? context.engine.trunk
        )}`
      : context.engine.isMergedIntoTrunk(branchName)
      ? `${chalk.green(branchName)} is merged into ${chalk.cyan(
          context.engine.trunk
        )}`
      : context.engine.isBranchEmpty(branchName)
      ? `${chalk.yellow(branchName)} is empty`
      : undefined;

  return reason ? { result: true, reason } : { result: false };
}
