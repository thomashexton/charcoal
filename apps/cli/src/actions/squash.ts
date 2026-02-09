import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { logOperation, captureHeadSha, getCurrentBranchName } from '../lib/engine/operation_log';
import { TCommitOpts } from '../lib/git/commit';
import { restackBranches } from './restack';

export function squashCurrentBranch(
  opts: Pick<TCommitOpts, 'message' | 'noEdit'>,
  context: TContext
): void {
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();

  context.engine.squashCurrentBranch({
    noEdit: opts.noEdit,
    message: opts.message,
  });

  logOperation({
    type: 'modify',
    branchName: context.engine.currentBranchPrecondition,
    data: { action: 'squash' },
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
