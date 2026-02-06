import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'upstack <command>';
export const desc =
  '[DEPRECATED] Use `gt <command> --upstack` instead. Run `gt upstack --help` to see available commands.';
export const aliases = ['us'];
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  onto: 'move',
};

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../upstack-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        const newCmd = COMMAND_RENAMES[subcommand] ?? `${subcommand} --upstack`;
        handleDeprecatedCommand(`upstack ${subcommand}`, newCmd);
      }
    })
    .strict()
    .demandCommand();
};
