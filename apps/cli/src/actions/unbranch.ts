import chalk from 'chalk';
import { TContext } from '../lib/context';
import {
  logOperation,
  captureHeadSha,
  getCurrentBranchName,
} from '../lib/engine/operation_log';
import { ExitFailedError } from '../lib/errors';

export function unbranch(context: TContext): void {
  const currentBranchName = context.engine.currentBranchPrecondition;
  const parentBranchName =
    context.engine.getParentPrecondition(currentBranchName);
  if (context.engine.getChildren(currentBranchName).length > 0) {
    throw new ExitFailedError(`Can't unbranch a branch with children!`);
  }
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();
  context.engine.unbranch();
  logOperation({
    type: 'delete',
    branchName: currentBranchName,
    data: { parentBranch: parentBranchName, unbranch: true },
    headBefore,
    headAfter: captureHeadSha(),
    branchBefore,
  });
  context.splog.info(
    `Unbranched ${chalk.red(currentBranchName)}. Now on ${chalk.blueBright(
      parentBranchName
    )}.`
  );
}
