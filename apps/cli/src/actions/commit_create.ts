import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import {
  logOperation,
  captureHeadSha,
  getCurrentBranchName,
} from '../lib/engine/operation_log';
import { ensureSomeStagedChangesPrecondition } from '../lib/preconditions';
import { BlockedDuringRebaseError } from '../lib/errors';
import { restackBranches } from './restack';

export function commitCreateAction(
  opts: {
    addAll: boolean;
    update: boolean;
    patch: boolean;
    message?: string;
    verbose?: number;
  },
  context: TContext
): void {
  if (context.engine.rebaseInProgress()) {
    throw new BlockedDuringRebaseError();
  }

  if (opts.addAll) {
    context.engine.addAll();
  } else if (opts.update) {
    context.engine.addAllTracked();
  }

  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();

  ensureSomeStagedChangesPrecondition(context);
  context.engine.commit({
    message: opts.message,
    patch: !opts.addAll && !opts.update && opts.patch,
    verbose: opts.verbose,
  });

  logOperation({
    type: 'modify',
    branchName: context.engine.currentBranchPrecondition,
    data: { action: 'commit' },
    headBefore,
    headAfter: captureHeadSha(),
    branchBefore,
  });

  restackBranches(
    context.engine.getRelativeStack(
      context.engine.currentBranchPrecondition,
      SCOPE.UPSTACK_EXCLUSIVE
    ),
    context
  );
}
