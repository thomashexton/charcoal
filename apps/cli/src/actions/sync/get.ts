import chalk from 'chalk';
import { execFileSync } from 'child_process';
import { TContext } from '../../lib/context';
import {
  KilledError,
  PreconditionsFailedError,
  RebaseConflictError,
} from '../../lib/errors';
import { uncommittedTrackedChangesPrecondition } from '../../lib/preconditions';
import { assertUnreachable } from '../../lib/utils/assert_unreachable';
import { persistContinuation } from '../persist_continuation';
import { printConflictStatus } from '../print_conflict_status';
import { restackBranches } from '../restack';
import { syncPrInfo } from '../sync_pr_info';

type PRInfo = {
  number: number;
  headRefName: string;
  baseRefName: string;
  state: string;
};

/**
 * Fetches PR info from GitHub using `gh` CLI.
 * @param branchOrPrNumber - Branch name or PR number
 * @returns PR info or undefined if not found
 */
function fetchPRInfo(branchOrPrNumber: string): PRInfo | undefined {
  try {
    const result = execFileSync('gh', [
      'pr',
      'view',
      branchOrPrNumber,
      '--json',
      'number,headRefName,baseRefName,state',
    ]).toString();
    return JSON.parse(result) as PRInfo;
  } catch {
    return undefined;
  }
}

/**
 * Builds the downstack (from trunk to target branch) by following PR base refs.
 * Returns branches in order from trunk-child to target branch.
 */
function buildDownstackFromRemote(
  targetBranch: string,
  trunk: string,
  context: TContext
): string[] {
  const stack: string[] = [];
  let currentBranch = targetBranch;

  // Walk up the stack by following baseRefName until we hit trunk
  while (currentBranch !== trunk) {
    stack.unshift(currentBranch);
    const prInfo = fetchPRInfo(currentBranch);
    if (!prInfo) {
      // No PR found - check if we can find parent from local metadata
      if (context.engine.isBranchTracked(currentBranch)) {
        const parent = context.engine.getParent(currentBranch);
        if (parent && parent !== trunk) {
          currentBranch = parent;
          continue;
        }
      }
      // If no PR and not tracked locally, assume direct trunk child
      break;
    }
    currentBranch = prInfo.baseRefName;
  }

  return stack;
}

/**
 * Builds the upstack (from target branch to leaf branches) by querying PRs.
 * Returns branches in order from target's children to leaves.
 */
function buildUpstackFromRemote(targetBranch: string): string[] {
  const upstack: string[] = [];
  const toProcess = [targetBranch];
  const visited = new Set<string>();

  while (toProcess.length > 0) {
    const branch = toProcess.shift()!;
    if (visited.has(branch)) continue;
    visited.add(branch);

    // Find PRs that have this branch as their base
    try {
      const result = execFileSync('gh', [
        'pr',
        'list',
        '--base',
        branch,
        '--json',
        'headRefName',
        '--state',
        'open',
      ]).toString();
      const prs = JSON.parse(result) as { headRefName: string }[];
      for (const pr of prs) {
        if (!visited.has(pr.headRefName)) {
          upstack.push(pr.headRefName);
          toProcess.push(pr.headRefName);
        }
      }
    } catch {
      // Ignore errors - just means no upstack PRs found
    }
  }

  return upstack;
}

function resolveTargetBranch(
  branchName: string | undefined,
  context: TContext
): string {
  if (branchName) {
    if (/^\d+$/.test(branchName)) {
      const prInfo = fetchPRInfo(branchName);
      if (!prInfo) {
        throw new PreconditionsFailedError(`Could not find PR #${branchName}`);
      }
      context.splog.info(
        `Resolved PR #${branchName} to branch ${chalk.cyan(prInfo.headRefName)}`
      );
      return prInfo.headRefName;
    }
    return branchName;
  }
  const current = context.engine.currentBranch;
  if (!current) {
    throw new PreconditionsFailedError(
      'No branch specified and not currently on a branch.'
    );
  }
  if (context.engine.isTrunk(current)) {
    throw new PreconditionsFailedError(
      'Cannot get trunk branch. Use `gt sync` instead.'
    );
  }
  return current;
}

function logBranchCount(count: number, label: string): string {
  return `${count} ${label} branch${count === 1 ? '' : 'es'}`;
}

async function syncUpstackBranches(
  targetBranch: string,
  args: { force: boolean; unfrozen?: boolean },
  context: TContext
): Promise<string[]> {
  const upstack = buildUpstackFromRemote(targetBranch);
  if (upstack.length === 0) return [];

  context.splog.info(
    `Found ${logBranchCount(upstack.length, 'upstack')}: ${upstack
      .map((b) => chalk.cyan(b))
      .join(' → ')}`
  );
  for (const branchName of upstack) {
    const prInfo = fetchPRInfo(branchName);
    if (prInfo) {
      context.engine.fetchBranch(branchName, prInfo.baseRefName);
      if (args.force || !context.engine.branchExists(branchName)) {
        context.engine.checkoutBranchFromFetched(
          branchName,
          prInfo.baseRefName
        );
        // Freeze new branches by default (per Graphite 1.7.0+) unless --unfrozen
        context.engine.setFrozen(branchName, !args.unfrozen);
        context.splog.info(`Synced ${chalk.cyan(branchName)} from remote.`);
      }
    }
  }
  await syncPrInfo(upstack, context);
  return upstack;
}

export async function getAction(
  args: {
    branchName: string | undefined;
    force: boolean;
    downstackOnly?: boolean;
    restack?: boolean;
    unfrozen?: boolean;
    remoteUpstack?: boolean;
  },
  context: TContext
): Promise<void> {
  uncommittedTrackedChangesPrecondition();
  const targetBranch = resolveTargetBranch(args.branchName, context);
  const trunk = context.engine.trunk;

  context.splog.info(
    `📥 Fetching stack for ${chalk.cyan(targetBranch)} from remote...`
  );
  const downstack = buildDownstackFromRemote(targetBranch, trunk, context);
  if (downstack.length === 0) {
    context.splog.info(`No branches to sync.`);
    return;
  }

  context.splog.info(
    `Found ${logBranchCount(downstack.length, '')}to sync: ${downstack
      .map((b) => chalk.cyan(b))
      .join(' → ')}`
  );

  await getBranchesFromRemote(
    { downstack, base: trunk, force: args.force, unfrozen: args.unfrozen },
    context
  );
  await syncPrInfo(downstack, context);

  let upstack: string[] = [];
  if (args.remoteUpstack && !args.downstackOnly) {
    upstack = await syncUpstackBranches(
      targetBranch,
      { force: args.force, unfrozen: args.unfrozen },
      context
    );
  }

  if (args.restack !== false) {
    const branchesToRestack = [...downstack, ...upstack].filter((b) =>
      context.engine.isBranchTracked(b)
    );
    if (branchesToRestack.length > 0) {
      context.splog.info(`\n🔄 Restacking branches...`);
      restackBranches(branchesToRestack, context);
    }
  }

  if (context.engine.branchExists(targetBranch)) {
    context.engine.checkoutBranch(targetBranch);
    context.splog.info(`\n✅ Checked out ${chalk.green(targetBranch)}`);
  }
}

export async function getBranchesFromRemote(
  args: {
    downstack: string[];
    base: string;
    force: boolean;
    unfrozen?: boolean;
  },
  context: TContext
): Promise<void> {
  let parentBranchName = args.base;
  for (const [index, branchName] of args.downstack.entries()) {
    context.engine.fetchBranch(branchName, parentBranchName);
    const isNewBranch = !context.engine.branchExists(branchName);
    if (args.force || isNewBranch) {
      context.engine.checkoutBranchFromFetched(branchName, parentBranchName);
      // Freeze new branches by default (per Graphite 1.7.0+) unless --unfrozen
      if (isNewBranch) {
        context.engine.setFrozen(branchName, !args.unfrozen);
      }
      context.splog.info(`Synced ${chalk.cyan(branchName)} from remote.`);
    } else if (!context.engine.isBranchTracked(branchName)) {
      await handleUntrackedLocally(branchName, parentBranchName, context);
    } else if (
      context.engine.getParentPrecondition(branchName) !== parentBranchName
    ) {
      await handleDifferentParents(branchName, parentBranchName, context);
    } else if (context.engine.branchMatchesFetched(branchName)) {
      context.splog.info(`${chalk.cyan(branchName)} is up to date.`);
    } else {
      const remainingBranchesToSync = args.downstack.slice(index + 1);
      await handleSameParent(
        { branchName, parentBranchName, remainingBranchesToSync },
        context
      );
    }
    parentBranchName = branchName;
  }
}

async function handleUntrackedLocally(
  branchName: string,
  parentBranchName: string,
  context: TContext
): Promise<void> {
  context.splog.info(
    [
      `${chalk.yellow(
        branchName
      )} shares a name with a local branch that not tracked by Graphite.`,
      `In order to sync it, you must overwrite your local copy of the branch.`,
      `If you do not wish to overwrite your copy, the command will be aborted.`,
    ].join('\n')
  );
  await maybeOverwriteBranch(branchName, parentBranchName, context);
}

async function handleDifferentParents(
  branchName: string,
  parentBranchName: string,
  context: TContext
): Promise<void> {
  context.splog.info(
    [
      `${chalk.yellow(
        branchName
      )} shares a name with a local branch, but they have different parents.`,
      `In order to sync it, you must overwrite your local copy of the branch.`,
      `If you do not wish to overwrite your copy, the command will be aborted.`,
    ].join('\n')
  );
  await maybeOverwriteBranch(branchName, parentBranchName, context);
}

// Helper function for cases where we can either overwrite local or abort
async function maybeOverwriteBranch(
  branchName: string,
  parentBranchName: string,
  context: TContext
) {
  if (
    !context.interactive ||
    !(
      await context.prompts({
        type: 'confirm',
        name: 'value',
        message: `Overwrite ${chalk.yellow(
          branchName
        )} with the version from remote?`,
        initial: false,
      })
    ).value
  ) {
    throw new KilledError();
  }

  context.engine.checkoutBranchFromFetched(branchName, parentBranchName);
  context.splog.info(`Synced ${chalk.cyan(branchName)} from remote.`);
}

// This is the most complex case - if the branch's parent matches meta,
// we need to not only allow for overwrite and abort, but also rebasing
// local changes onto the changes from remote.
async function handleSameParent(
  args: {
    branchName: string;
    parentBranchName: string;
    remainingBranchesToSync: string[];
  },
  context: TContext
): Promise<void> {
  context.splog.info(
    [
      `${chalk.yellow(
        args.branchName
      )} shares a name with a local branch, and they have the same parent.`,
      `You can either overwrite your copy of the branch, or rebase your local changes onto the remote version.`,
      `You can also abort the command entirely and keep your local state as is.`,
    ].join('\n')
  );

  const fetchChoice: 'REBASE' | 'OVERWRITE' | 'ABORT' = !context.interactive
    ? 'ABORT'
    : (
        await context.prompts({
          type: 'select',
          name: 'value',
          message: `How would you like to handle ${chalk.yellow(
            args.branchName
          )}?`,
          choices: [
            {
              title: 'Rebase your changes on top of the remote version',
              value: 'REBASE',
            },
            {
              title: 'Overwrite the local copy with the remote version',
              value: 'OVERWRITE',
            },
            { title: 'Abort this command', value: 'ABORT' },
          ],
        })
      ).value;

  switch (fetchChoice) {
    case 'REBASE': {
      const result = context.engine.rebaseBranchOntoFetched(args.branchName);
      if (result.result === 'REBASE_CONFLICT') {
        persistContinuation(
          {
            branchesToSync: args.remainingBranchesToSync,
            rebasedBranchBase: result.rebasedBranchBase,
          },
          context
        );
        printConflictStatus(
          `Hit conflict rebasing ${chalk.yellow(
            args.branchName
          )} onto remote source of truth.`,
          context
        );
        throw new RebaseConflictError();
      }
      context.splog.info(
        `Rebased local changes to ${chalk.cyan(
          args.branchName
        )} onto remote source of truth.`
      );
      context.splog.tip(
        `If this branch has local children, they likely need to be restacked.`
      );
      break;
    }
    case 'OVERWRITE':
      context.engine.checkoutBranchFromFetched(
        args.branchName,
        args.parentBranchName
      );
      context.splog.info(`Synced ${chalk.cyan(args.branchName)} from remote.`);
      break;
    case 'ABORT':
      throw new KilledError();
    default:
      assertUnreachable(fetchChoice);
  }
}
