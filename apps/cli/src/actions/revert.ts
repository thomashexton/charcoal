import chalk from 'chalk';
import { TContext } from '../lib/context';
import { ExitFailedError } from '../lib/errors';
import { runGitCommand } from '../lib/git/runner';
import { replaceUnsupportedCharacters } from '../lib/utils/branch_name';

export async function revertAction(
  opts: {
    sha: string;
    edit?: boolean;
  },
  context: TContext
): Promise<void> {
  const { sha, edit } = opts;

  const fullSha = runGitCommand({
    args: ['rev-parse', '--verify', sha],
    onError: 'ignore',
    resource: 'revertValidateSha',
  });

  if (!fullSha) {
    throw new ExitFailedError(`Commit ${chalk.yellow(sha)} does not exist.`);
  }

  const shortSha = fullSha.slice(0, 7);

  const commitSubject = runGitCommand({
    args: ['log', '--format=%s', '-n', '1', fullSha],
    onError: 'ignore',
    resource: 'revertGetCommitSubject',
  });

  const branchName = replaceUnsupportedCharacters(
    `revert-${shortSha}-${commitSubject}`.slice(0, 50),
    context
  );

  const trunkName = context.engine.trunk;

  context.engine.checkoutBranch(trunkName);
  context.engine.checkoutNewBranch(branchName);

  const revertArgs = ['revert', fullSha];
  if (!edit) {
    revertArgs.push('--no-edit');
  }

  try {
    runGitCommand({
      args: revertArgs,
      options: { stdio: edit ? 'inherit' : 'pipe' },
      onError: 'throw',
      resource: 'revertCommit',
    });
  } catch (e) {
    try {
      context.engine.deleteBranch(branchName);
    } catch {
      // pass
    }
    context.engine.checkoutBranch(trunkName);
    throw new ExitFailedError(
      `Failed to revert commit ${chalk.yellow(shortSha)}. ${e.message}`
    );
  }

  context.engine.trackBranch(branchName, trunkName);

  context.splog.info(
    `Created branch ${chalk.green(branchName)} with revert of ${chalk.cyan(
      shortSha
    )}.`
  );
}
