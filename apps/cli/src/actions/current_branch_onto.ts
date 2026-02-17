import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import {
  logOperation,
  captureHeadSha,
  getCurrentBranchName,
} from '../lib/engine/operation_log';
import { uncommittedTrackedChangesPrecondition } from '../lib/preconditions';
import { restackBranches } from './restack';

export function currentBranchOnto(
  ontoBranchName: string,
  context: TContext
): void {
  uncommittedTrackedChangesPrecondition();

  const currentBranch = context.engine.currentBranchPrecondition;
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();

  context.engine.setParent(currentBranch, ontoBranchName);

  logOperation({
    type: 'move',
    branchName: currentBranch,
    data: { onto: ontoBranchName },
    headBefore,
    headAfter: captureHeadSha(),
    branchBefore,
  });

  restackBranches(
    context.engine.getRelativeStack(currentBranch, SCOPE.UPSTACK),
    context
  );
}
