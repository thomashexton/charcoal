import { TContext } from '../lib/context';

const DEFAULT_FOOTER_TITLE = 'PR Dependency Tree';

export function createPrBodyFooter(context: TContext, branch: string): string {
  const title =
    context.userConfig.data.submitFooterTitle ?? DEFAULT_FOOTER_TITLE;
  const terminalParent = findTerminalParent(context, branch);

  const tree = buildBranchTree({
    context,
    currentBranches: [terminalParent],
    prBranch: branch,
  });

  return `\n\n\n#### ${title}\n\n${tree}`;
}

export function countPrsInStack(context: TContext, branch: string): number {
  const terminalParent = findTerminalParent(context, branch);
  return countPrsFromNode(context, [terminalParent], branch);
}

function countPrsFromNode(
  context: TContext,
  branches: string[],
  prBranch: string
): number {
  let count = 0;
  for (const b of branches) {
    if (
      b !== prBranch &&
      !(
        isParentOfBranch(context, b, prBranch) ||
        isParentOfBranch(context, prBranch, b)
      )
    ) {
      continue;
    }
    if (context.engine.getPrInfo(b)?.number) {
      count++;
    }
    count += countPrsFromNode(context, context.engine.getChildren(b), prBranch);
  }
  return count;
}

function buildBranchTree({
  context,
  currentBranches,
  prBranch,
}: {
  context: TContext;
  currentBranches: string[];
  prBranch: string;
}): string {
  let tree = '';

  for (const branch of currentBranches) {
    if (
      branch !== prBranch &&
      !(
        isParentOfBranch(context, branch, prBranch) ||
        isParentOfBranch(context, prBranch, branch)
      )
    ) {
      continue;
    }

    const prInfo = context.engine.getPrInfo(branch);
    const number = prInfo?.number;
    if (number) {
      tree += `\n* **PR #${number}**${branch === prBranch ? ' 👈' : ''}`;
    }

    const children = context.engine.getChildren(branch);

    if (children.length) {
      tree += buildBranchTree({
        context,
        currentBranches: children,
        prBranch,
      });
    }
  }

  return tree;
}

function findTerminalParent(context: TContext, currentBranch: string): string {
  const parent = context.engine.getParent(currentBranch);
  if (!parent) {
    throw new Error('Parent branch is undefined');
  }

  if (context.engine.isTrunk(parent)) {
    return currentBranch;
  }

  return findTerminalParent(context, parent);
}

function isParentOfBranch(
  context: TContext,
  parent: string,
  branch: string
): boolean {
  const children = context.engine.getChildren(parent);

  if (children.includes(branch)) {
    return true;
  }

  for (const child of children) {
    if (isParentOfBranch(context, child, branch)) {
      return true;
    }
  }

  return false;
}
