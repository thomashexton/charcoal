import { TContext } from '../lib/context';

export function persistContinuation(
  args: {
    branchesToRestack?: string[];
    branchesToSync?: string[];
    rebasedBranchBase: string;
    rebuildAfterContinue?: boolean;
  },
  context: TContext
): void {
  const [branchesToRestack, branchesToSync] = [
    args.branchesToRestack ?? [],
    args.branchesToSync ?? [],
  ];
  context.splog.debug(
    branchesToSync.reduce(
      (acc, curr) => `${acc}\n${curr}`,
      'PERSISTING (sync):'
    )
  );
  context.splog.debug(
    branchesToRestack.reduce(
      (acc, curr) => `${acc}\n${curr}`,
      'PERSISTING (restack):'
    )
  );
  context.continueConfig.update((data) => {
    data.branchesToSync = branchesToSync;
    data.branchesToRestack = branchesToRestack;
    data.currentBranchOverride = context.engine.currentBranch;
    data.rebasedBranchBase = args.rebasedBranchBase;
    data.rebuildAfterContinue = args.rebuildAfterContinue;
  });
}

export function clearContinuation(context: TContext): void {
  context.continueConfig.update((data) => {
    data.branchesToSync = [];
    data.branchesToRestack = [];
    data.currentBranchOverride = undefined;
    data.rebasedBranchBase = undefined;
    data.rebuildAfterContinue = undefined;
  });
}
