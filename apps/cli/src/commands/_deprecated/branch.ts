import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'branch <command>';
export const desc =
  '[DEPRECATED] Use `gt <command>` directly. Run `gt branch --help` to see available commands.';
export const aliases = [];
export const deprecated = true;

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../branch-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        handleDeprecatedCommand(`branch ${subcommand}`, subcommand);
      }
    })
    .strict()
    .demandCommand();
};
