import yargs, { Argv } from 'yargs';
import { switchBranchAction } from '../actions/branch_traversal';
import { graphite } from '../lib/runner';

interface DownArgs {
  steps: number;
}

export const command = 'down [steps]';
export const canonical = 'down';
export const aliases = ['d'];
export const description = 'Switch to the parent of the current branch.';
export const builder = (yargs: Argv): Argv<DownArgs> =>
  yargs.positional('steps', {
    describe: 'The number of levels to traverse downstack.',
    type: 'number',
    default: 1,
  }) as Argv<DownArgs>;
export const handler = async (argv: yargs.Arguments<DownArgs>): Promise<void> =>
  graphite(
    argv,
    canonical,
    async (context) =>
      await switchBranchAction(
        {
          direction: 'DOWN',
          numSteps: argv.steps,
        },
        context
      )
  );
