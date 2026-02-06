import { spawnSync } from 'child_process';
import yargs from 'yargs';

const args = {
  args: {
    describe: 'git cherry-pick arguments',
    type: 'array',
    default: [],
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'cherry-pick [args..]';
export const canonical = 'cherry-pick';
export const description = 'git cherry-pick passthrough';

export const handler = async (_argv: argsT): Promise<void> => {
  const gitArgs = process.argv.slice(3);
  spawnSync('git', ['cherry-pick', ...gitArgs], { stdio: 'inherit' });
};
