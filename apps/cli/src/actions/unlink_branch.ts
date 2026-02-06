import chalk from 'chalk';
import { TContext } from '../lib/context';

export function unlinkBranch(
  opts: {
    branchName: string;
  },
  context: TContext
): void {
  const { branchName } = opts;

  const prInfo = context.engine.getPrInfo(branchName);
  if (!prInfo?.number) {
    context.splog.info(
      `Branch ${chalk.cyan(branchName)} is not linked to a pull request.`
    );
    return;
  }

  const prNumber = prInfo.number;
  context.engine.clearPrInfo(branchName);
  context.splog.info(
    `Unlinked PR #${prNumber} from branch ${chalk.cyan(branchName)}.`
  );
}
