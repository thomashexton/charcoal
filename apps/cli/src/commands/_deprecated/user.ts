import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'user <command>';
export const desc =
  '[DEPRECATED] Use `gt config` instead. Run `gt config --help` to see available settings.';
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  'branch-prefix': 'config branch-prefix',
  'branch-date': 'config branch-date',
  'branch-replacement': 'config branch-replacement',
  editor: 'config editor',
  pager: 'config pager',
  'restack-date': 'config restack-date',
  'submit-body': 'config submit-body',
  tips: 'config tips',
};

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../user-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        const newCmd = COMMAND_RENAMES[subcommand] ?? `config ${subcommand}`;
        handleDeprecatedCommand(`user ${subcommand}`, newCmd);
      }
    })
    .strict()
    .demandCommand();
};
