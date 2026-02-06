import { spawnSync } from 'child_process';
import yargs from 'yargs';

const args = {
  args: {
    describe: 'git add arguments',
    type: 'array',
    default: [],
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'add [args..]';
export const canonical = 'add';
export const description = 'git add passthrough';

export const handler = async (_argv: argsT): Promise<void> => {
  const gitArgs = process.argv.slice(3);
  spawnSync('git', ['add', ...gitArgs], { stdio: 'inherit' });
};
