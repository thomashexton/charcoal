import yargs, { Argv } from 'yargs';
import { switchBranchAction } from '../actions/branch_traversal';
import { graphite } from '../lib/runner';

interface UpArgs {
  steps: number;
  to?: string;
}

export const command = 'up [steps]';
export const canonical = 'up';
export const aliases = ['u'];
export const description =
  'Switch to the child of the current branch. Prompts if ambiguous.';
export const builder = (yargs: Argv): Argv<UpArgs> =>
  yargs
    .positional('steps', {
      describe: 'The number of levels to traverse upstack.',
      type: 'number',
      default: 1,
    })
    .option('to', {
      describe:
        'Target branch to navigate towards. When multiple children exist, selects the path leading to this branch.',
      type: 'string',
    }) as Argv<UpArgs>;
export const handler = async (argv: yargs.Arguments<UpArgs>): Promise<void> =>
  graphite(
    argv,
    canonical,
    async (context) =>
      await switchBranchAction(
        {
          direction: 'UP',
          numSteps: argv.steps,
          towards: argv.to,
        },
        context
      )
  );
