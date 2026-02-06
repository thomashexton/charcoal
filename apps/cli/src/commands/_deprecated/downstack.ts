import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'downstack <command>';
export const desc =
  '[DEPRECATED] Use `gt <command> --downstack` instead. Run `gt downstack --help` to see available commands.';
export const aliases = ['ds'];
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  edit: 'reorder',
};

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../downstack-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        const newCmd =
          COMMAND_RENAMES[subcommand] ?? `${subcommand} --downstack`;
        handleDeprecatedCommand(`downstack ${subcommand}`, newCmd);
      }
    })
    .strict()
    .demandCommand();
};
