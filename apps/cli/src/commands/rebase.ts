import { spawnSync } from 'child_process';
import yargs from 'yargs';

const args = {
  args: {
    describe: 'git rebase arguments',
    type: 'array',
    default: [],
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'rebase [args..]';
export const canonical = 'rebase';
export const description = 'git rebase passthrough';

export const handler = async (_argv: argsT): Promise<void> => {
  const gitArgs = process.argv.slice(3);
  spawnSync('git', ['rebase', ...gitArgs], { stdio: 'inherit' });
};
