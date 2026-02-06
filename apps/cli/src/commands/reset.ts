import { spawnSync } from 'child_process';
import yargs from 'yargs';

const args = {
  args: {
    describe: 'git reset arguments',
    type: 'array',
    default: [],
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'reset [args..]';
export const canonical = 'reset';
export const description = 'git reset passthrough';

export const handler = async (_argv: argsT): Promise<void> => {
  const gitArgs = process.argv.slice(3);
  spawnSync('git', ['reset', ...gitArgs], { stdio: 'inherit' });
};
