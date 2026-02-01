import { Argv } from 'yargs';
import { handleDeprecatedCommand } from '../../lib/backwards_compat';

export const command = 'repo <command>';
export const desc =
  '[DEPRECATED] Use `gt <command>` directly. Run `gt repo --help` to see available commands.';
export const aliases = ['r'];
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  sync: 'sync',
  init: 'init',
  owner: 'config repo-owner',
  name: 'config repo-name',
  remote: 'config repo-remote',
  'pr-templates': 'config repo-pr-templates',
  github: 'config repo-github',
};

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('../repo-commands', {
      extensions: ['js'],
    })
    .middleware((argv) => {
      const subcommand = argv._[1] as string | undefined;
      if (subcommand) {
        const newCmd = COMMAND_RENAMES[subcommand] ?? `repo ${subcommand}`;
        handleDeprecatedCommand(`repo ${subcommand}`, newCmd);
      }
    })
    .strict()
    .demandCommand();
};
