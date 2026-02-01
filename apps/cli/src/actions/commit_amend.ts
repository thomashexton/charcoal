import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import {
  PreconditionsFailedError,
  BlockedDuringRebaseError,
} from '../lib/errors';
import { restackBranches } from './restack';

export function commitAmendAction(
  opts: {
    addAll: boolean;
    update: boolean;
    message?: string;
    noEdit: boolean;
    patch: boolean;
    resetAuthor: boolean;
  },
  context: TContext
): void {
  if (context.engine.isBranchEmpty(context.engine.currentBranchPrecondition)) {
    throw new PreconditionsFailedError('No commits in this branch to amend');
  }
  if (context.engine.rebaseInProgress()) {
    throw new BlockedDuringRebaseError();
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
  });

  if (!opts.noEdit) {
    context.splog.tip(
      'In the future, you can skip editing the commit message with the `--no-edit` flag.'
    );
  }

  restackBranches(
    context.engine.getRelativeStack(
      context.engine.currentBranchPrecondition,
      SCOPE.UPSTACK_EXCLUSIVE
    ),
    context
  );
}
