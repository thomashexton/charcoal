import chalk from 'chalk';
import yargs from 'yargs';
import { execSync, spawnSync } from 'child_process';
import { graphite } from '../lib/runner';
import {
  getRecentOperations,
  logOperation,
  captureHeadSha,
  getCurrentBranchName,
  Operation,
} from '../lib/engine/operation_log';

const args = {
  force: {
    describe:
      'Do not prompt for confirmation; undo the most recent command immediately.',
    type: 'boolean',
    alias: 'f',
    default: false,
  },
  list: {
    describe: 'List recent Charcoal operations without undoing.',
    type: 'boolean',
    alias: 'l',
    default: false,
  },
  number: {
    describe: 'Number of operations to show (reflog expands to cover them).',
    type: 'number',
    alias: 'n',
    default: 5,
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'undo';
export const canonical = 'undo';
export const description =
  'Undo recent Charcoal operations or list operation history. Currently experimental.';
export const builder = args;

interface ReflogEntry {
  sha: string;
  index: number;
  description: string;
}

function parseReflog(stdout: string): ReflogEntry[] {
  const entries: ReflogEntry[] = [];
  for (const line of stdout.trim().split('\n')) {
    if (!line) continue;
    const match = line.match(/^([0-9a-f]+)\s+HEAD@\{(\d+)\}:\s*(.*)$/);
    if (match) {
      entries.push({
        sha: match[1],
        index: parseInt(match[2], 10),
        description: match[3],
      });
    }
  }
  return entries;
}

function shortSha(sha: string | undefined): string {
  return sha ? sha.substring(0, 7) : '???????';
}

function formatOp(op: Operation): string {
  const date = new Date(op.timestamp).toLocaleString();
  const dataEntries = Object.entries(op.data).filter(([k]) => k !== 'action');
  const extras: string[] = [];
  if (op.data.action) extras.push(String(op.data.action));
  if (dataEntries.length > 0) {
    extras.push(dataEntries.map(([k, v]) => `${k}=${v}`).join(', '));
  }
  const extraStr =
    extras.length > 0 ? chalk.gray(` (${extras.join(', ')})`) : '';
  return `[${chalk.cyan(op.type)}] ${chalk.bold(
    op.branchName
  )}${extraStr} ${chalk.dim(date)}`;
}

function fetchReflogUntilCovered(
  opShas: Set<string>,
  minEntries: number
): ReflogEntry[] {
  const maxEntries = 500;
  const batchSize = Math.max(minEntries * 10, 50);
  const limit = Math.min(batchSize, maxEntries);

  const result = spawnSync(
    'git',
    ['reflog', '--oneline', '-n', String(limit)],
    {
      encoding: 'utf-8',
    }
  );
  if (result.status !== 0) return [];

  const entries = parseReflog(result.stdout);
  if (opShas.size === 0) return entries.slice(0, Math.max(minEntries, 10));

  let lastOpIdx = 0;
  for (let i = 0; i < entries.length; i++) {
    if (opShas.has(entries[i].sha)) {
      lastOpIdx = i;
    }
  }

  const padding = 3;
  return entries.slice(0, Math.max(lastOpIdx + padding + 1, minEntries));
}

function findReflogIndexForSha(
  entries: ReflogEntry[],
  sha: string | undefined
): number | undefined {
  if (!sha) return undefined;
  const shortTarget = sha.substring(0, 7);
  for (const entry of entries) {
    if (entry.sha.startsWith(shortTarget) || sha.startsWith(entry.sha)) {
      return entry.index;
    }
  }
  return undefined;
}

export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const count = argv.number;
    const recentOps = getRecentOperations(count);

    if (argv.list) {
      if (recentOps.length === 0) {
        context.splog.info('No recent Charcoal operations.');
        return;
      }
      context.splog.info(chalk.bold('Recent Charcoal operations:'));
      recentOps.forEach((op, i) => {
        const shaInfo = op.headBefore
          ? chalk.gray(
              ` ${shortSha(op.headBefore)} → ${shortSha(op.headAfter)}`
            )
          : '';
        const branchInfo = op.branchBefore
          ? chalk.gray(` on ${op.branchBefore}`)
          : '';
        context.splog.info(
          `  ${i + 1}. ${formatOp(op)}${shaInfo}${branchInfo}`
        );
      });
      return;
    }

    const opShas = new Set<string>();
    for (const op of recentOps) {
      if (op.headBefore) opShas.add(op.headBefore.substring(0, 7));
      if (op.headAfter) opShas.add(op.headAfter.substring(0, 7));
    }

    const reflogEntries = fetchReflogUntilCovered(opShas, count);

    if (reflogEntries.length < 2) {
      context.splog.info('No operations to undo.');
      return;
    }

    const opsBySha = new Map<string, Operation>();
    for (const op of recentOps) {
      if (op.headBefore) opsBySha.set(op.headBefore.substring(0, 7), op);
      if (op.headAfter) opsBySha.set(op.headAfter.substring(0, 7), op);
    }

    printHistory({
      reflogEntries,
      opsBySha,
      recentOps,
      splog: context.splog,
    });

    if (argv.force) {
      performUndo('HEAD@{1}', context);
      return;
    }

    if (context.interactive) {
      const confirm = await context.prompts({
        type: 'confirm',
        name: 'value',
        message: 'Undo the most recent operation (reset to HEAD@{1})?',
        initial: false,
      });

      if (confirm.value) {
        performUndo('HEAD@{1}', context);
      }
    }
  });

function printHistory(opts: {
  reflogEntries: ReflogEntry[];
  opsBySha: Map<string, Operation>;
  recentOps: Operation[];
  splog: { info: (msg: string) => void };
}): void {
  const { reflogEntries, opsBySha, recentOps, splog } = opts;
  splog.info(chalk.bold('Recent history:'));
  splog.info('');

  for (const entry of reflogEntries) {
    const matchedOp = opsBySha.get(entry.sha);
    const marker = matchedOp
      ? chalk.yellow(' ◀ ') +
        chalk.yellow(`gt ${matchedOp.type}`) +
        chalk.gray(` ${matchedOp.branchName}`)
      : '';

    splog.info(
      `  ${chalk.dim(`HEAD@{${entry.index}}`)} ${chalk.cyan(entry.sha)} ${
        entry.description
      }${marker}`
    );
  }

  splog.info('');

  if (recentOps.length > 0) {
    splog.info(chalk.bold('Undo suggestions:'));
    splog.info('');
    const seen = new Set<string>();
    for (const op of recentOps) {
      const date = new Date(op.timestamp).toLocaleString();
      if (op.headBefore && !seen.has(op.headBefore)) {
        seen.add(op.headBefore);
        const refIdx = findReflogIndexForSha(reflogEntries, op.headBefore);
        const refHint =
          refIdx !== undefined ? `HEAD@{${refIdx}}` : shortSha(op.headBefore);
        splog.info(
          `  To undo ${chalk.cyan(op.type)} ${chalk.bold(
            op.branchName
          )} ${chalk.dim(`(${date})`)}:`
        );
        splog.info(`    ${chalk.green(`git reset --hard ${refHint}`)}`);
      } else if (!op.headBefore) {
        splog.info(
          `  ${chalk.cyan(op.type)} ${chalk.bold(op.branchName)} ${chalk.dim(
            `(${date})`
          )}`
        );
        splog.info(
          `    ${chalk.dim(
            'no SHA recorded — logged before undo tracking was added'
          )}`
        );
      }
      splog.info('');
    }
  } else {
    splog.info(chalk.gray('To undo to a specific state, run:'));
    splog.info(chalk.cyan('  git reset --hard HEAD@{N}'));
    splog.info('');
  }
}

function performUndo(
  target: string,
  context: {
    splog: { info: (msg: string) => void; error: (msg: string) => void };
  }
): void {
  const headBefore = captureHeadSha();
  const branchBefore = getCurrentBranchName();

  context.splog.info(chalk.yellow(`Undoing to ${target}...`));
  try {
    execSync(`git reset --hard ${target}`, { stdio: 'inherit' });
  } catch {
    context.splog.error('Failed to undo.');
    return;
  }

  logOperation({
    type: 'undo',
    branchName: branchBefore ?? 'HEAD',
    data: { target },
    headBefore,
    headAfter: captureHeadSha(),
    branchBefore,
  });

  context.splog.info(chalk.green('Undo complete.'));
  context.splog.info('');
  context.splog.info(
    chalk.yellow(
      'Charcoal branch metadata is not affected by undo, but may be out of sync.'
    )
  );
  context.splog.info(
    chalk.gray('Run `gt init` to rebuild metadata if branches look wrong.')
  );
}
