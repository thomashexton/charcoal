import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'stack <command>';
export const desc =
  '[DEPRECATED] Use `gt <command> --stack` instead. Run `gt stack --help` to see available commands.';
export const aliases = ['s'];
export const deprecated = true;

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../stack-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        handleDeprecatedCommand(`stack ${subcommand}`, `${subcommand} --stack`);
      }
    })
    .strict()
    .demandCommand();
};
