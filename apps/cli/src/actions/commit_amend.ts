import chalk from 'chalk';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { logOperation, captureHeadSha, getCurrentBranchName } from '../lib/engine/operation_log';
import {
  PreconditionsFailedError,
  BlockedDuringRebaseError,
} from '../lib/errors';
import { restackBranches } from './restack';

export async function commitAmendAction(
  opts: {
    addAll: boolean;
    update: boolean;
    message?: string;
    noEdit: boolean;
    patch: boolean;
    resetAuthor: boolean;
    into?: string;
    verbose?: number;
  },
  context: TContext
): Promise<void> {
  if (context.engine.rebaseInProgress()) {
    throw new BlockedDuringRebaseError();
  }

  const currentBranch = context.engine.currentBranchPrecondition;
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();

  if (opts.into !== undefined) {
    await commitAmendInto(opts, context);
    return;
  }

  if (context.engine.isBranchEmpty(currentBranch)) {
    throw new PreconditionsFailedError('No commits in this branch to amend');
  }

  if (opts.addAll) {
    context.engine.addAll();
  } else if (opts.update) {
    context.engine.addAllTracked();
  }

  context.engine.commit({
    amend: true,
    noEdit: opts.noEdit,
    message: opts.message,
    patch: !opts.addAll && !opts.update && opts.patch,
    resetAuthor: opts.resetAuthor,
    verbose: opts.verbose,
  });

  logOperation({
    type: 'modify',
    branchName: currentBranch,
    data: { action: 'amend' },
    headBefore,
    headAfter: captureHeadSha(),
    branchBefore,
  });

  if (!opts.noEdit) {
    context.splog.tip(
      'In the future, you can skip editing the commit message with the `--no-edit` flag.'
    );
  }

  restackBranches(
    context.engine.getRelativeStack(currentBranch, SCOPE.UPSTACK_EXCLUSIVE),
    context
  );
}

async function commitAmendInto(
  opts: {
    addAll: boolean;
    update: boolean;
    message?: string;
    noEdit: boolean;
    patch: boolean;
    resetAuthor: boolean;
    into?: string;
    verbose?: number;
  },
  context: TContext
): Promise<void> {
  const currentBranch = context.engine.currentBranchPrecondition;

  const downstackBranches = context.engine
    .getRelativeStack(currentBranch, SCOPE.DOWNSTACK)
    .filter((b) => b !== currentBranch && !context.engine.isTrunk(b));

  if (downstackBranches.length === 0) {
    throw new PreconditionsFailedError(
      'No downstack branches to amend into. The current branch has no ancestors (other than trunk).'
    );
  }

  let targetBranch = opts.into;

  if (!targetBranch) {
    const response = await context.prompts({
      type: 'autocomplete',
      name: 'branch',
      message:
        'Select a downstack branch to amend into (autocomplete or arrow keys)',
      choices: downstackBranches.map((b) => ({ title: b, value: b })),
      initial: 0,
    });
    targetBranch = response.branch;
  }

  if (!targetBranch) {
    throw new PreconditionsFailedError('No branch selected.');
  }

  if (!downstackBranches.includes(targetBranch)) {
    throw new PreconditionsFailedError(
      `Branch ${chalk.cyan(
        targetBranch
      )} is not a downstack branch of ${chalk.cyan(currentBranch)}.`
    );
  }

  if (context.engine.isBranchEmpty(targetBranch)) {
    throw new PreconditionsFailedError(
      `No commits in branch ${chalk.cyan(targetBranch)} to amend.`
    );
  }

  if (opts.addAll) {
    context.engine.addAll();
  } else if (opts.update) {
    context.engine.addAllTracked();
  }

  context.engine.checkoutBranch(targetBranch);

  context.engine.commit({
    amend: true,
    noEdit: opts.noEdit,
    message: opts.message,
    patch: !opts.addAll && !opts.update && opts.patch,
    resetAuthor: opts.resetAuthor,
    verbose: opts.verbose,
  });

  context.splog.info(`Amended changes into ${chalk.cyan(targetBranch)}.`);

  context.engine.checkoutBranch(currentBranch);

  restackBranches(
    context.engine.getRelativeStack(targetBranch, SCOPE.UPSTACK_EXCLUSIVE),
    context
  );
}
