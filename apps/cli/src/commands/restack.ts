import yargs from 'yargs';
import { restackBranches } from '../actions/restack';
import { SCOPE, TScopeSpec } from '../lib/engine/scope_spec';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: 'Which branch to run this command from (default: current branch)',
    type: 'string',
  },
  stack: {
    describe: 'Restack entire stack (ancestors and descendants)',
    type: 'boolean',
    alias: 's',
  },
  downstack: {
    describe: 'Restack current branch and ancestors only',
    type: 'boolean',
  },
  upstack: {
    describe: 'Restack current branch and descendants only',
    type: 'boolean',
  },
  only: {
    describe: 'Only restack this branch',
    type: 'boolean',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'restack';
export const canonical = 'restack';
export const aliases = ['r', 'fix', 'f'];
export const description =
  'Ensure branches are based on their parents, rebasing if necessary.';
export const builder = args;

function getScope(argv: argsT): TScopeSpec {
  if (argv.only) {
    return SCOPE.BRANCH;
  }
  if (argv.stack) {
    return SCOPE.STACK;
  }
  if (argv.downstack) {
    return SCOPE.DOWNSTACK;
  }
  if (argv.upstack) {
    return SCOPE.UPSTACK;
  }
  return SCOPE.STACK;
}

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const scope = getScope(argv);
    const targetBranch =
      argv.branch ?? context.engine.currentBranchPrecondition;

    return restackBranches(
      context.engine.getRelativeStack(targetBranch, scope),
      context
    );
  });
