import open from 'open';
import yargs from 'yargs';
import { graphite } from '../lib/runner';
import { PreconditionsFailedError } from '../lib/errors';
import { SCOPE } from '../lib/engine/scope_spec';

const args = {
  branch: {
    describe: 'A branch name or PR number to open.',
    type: 'string',
    demandOption: false,
  },
  stack: {
    describe: 'Open all PRs in the stack.',
    type: 'boolean',
    default: false,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'pr [branch]';
export const canonical = 'pr';
export const description =
  'Open the pull request for the current branch in your browser.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const owner = context.repoConfig.getRepoOwner();
    const repo = context.repoConfig.getRepoName();

    // If a PR number is passed directly
    if (argv.branch && /^\d+$/.test(argv.branch)) {
      const prUrl = `https://github.com/${owner}/${repo}/pull/${argv.branch}`;
      context.splog.info(`Opening ${prUrl}`);
      await open(prUrl);
      return;
    }

    const targetBranch =
      argv.branch ?? context.engine.currentBranchPrecondition;

    if (argv.stack) {
      const stackBranches = context.engine.getRelativeStack(
        targetBranch,
        SCOPE.STACK
      );
      const prUrls: string[] = [];

      for (const branch of stackBranches) {
        const prInfo = context.engine.getPrInfo(branch);
        if (prInfo?.number) {
          prUrls.push(
            `https://github.com/${owner}/${repo}/pull/${prInfo.number}`
          );
        }
      }

      if (prUrls.length === 0) {
        throw new PreconditionsFailedError(
          `No pull requests found in the stack. Run \`gt submit\` first.`
        );
      }

      context.splog.info(`Opening ${prUrls.length} PRs in the stack...`);
      for (const url of prUrls) {
        context.splog.info(`  ${url}`);
        await open(url);
      }
      return;
    }

    const prInfo = context.engine.getPrInfo(targetBranch);

    if (!prInfo?.number) {
      throw new PreconditionsFailedError(
        `No pull request found for branch "${targetBranch}". Run \`gt submit\` first.`
      );
    }

    const prUrl = `https://github.com/${owner}/${repo}/pull/${prInfo.number}`;

    context.splog.info(`Opening ${prUrl}`);
    await open(prUrl);
  });
