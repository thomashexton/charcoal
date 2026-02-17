import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'repo [command..]';
export const desc = false as const;
export const aliases = [];
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
  return yargs.strict(false);
};

export const handler = function (argv: { command?: string[] }): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    const newCmd = COMMAND_RENAMES[subcommand] ?? `repo ${subcommand}`;
    handleDeprecatedCommand(`repo ${subcommand}`, newCmd);
  } else {
    handleDeprecatedCommandGroup(
      '`gt repo` has been removed. Use `gt init`, `gt sync`, or `gt config repo-*` instead.'
    );
  }
};
