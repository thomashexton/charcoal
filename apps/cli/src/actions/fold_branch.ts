import chalk from 'chalk';
import { TContext } from '../lib/context';
import {
  logOperation,
  captureHeadSha,
  getCurrentBranchName,
} from '../lib/engine/operation_log';
import { SCOPE } from '../lib/engine/scope_spec';
import { restackBranches } from './restack';

export function foldCurrentBranch(keep: boolean, context: TContext): void {
  const currentBranchName = context.engine.currentBranchPrecondition;
  const parentBranchName =
    context.engine.getParentPrecondition(currentBranchName);
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();
  context.engine.foldCurrentBranch(keep);
  if (keep) {
    context.splog.info(
      `Folded ${chalk.green(currentBranchName)} into ${chalk.blueBright(
        parentBranchName
      )}.`
    );
  } else {
    context.splog.info(
      `Folded ${chalk.blueBright(currentBranchName)} into ${chalk.green(
        parentBranchName
      )}.`
    );
    context.splog.tip(
      `To keep the name of the current branch, use the \`--keep\` flag.`
    );
  }
  logOperation({
    type: 'fold',
    branchName: currentBranchName,
    data: { parentBranch: parentBranchName, keep },
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
