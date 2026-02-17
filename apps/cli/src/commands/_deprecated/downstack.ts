import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'downstack [command..]';
export const desc = false as const;
export const aliases = ['ds'];
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  edit: 'reorder',
};

export const builder = function (yargs: Argv): Argv {
  return yargs.strict(false);
};

export const handler = function (argv: { command?: string[] }): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    const newCmd = COMMAND_RENAMES[subcommand] ?? `${subcommand} --downstack`;
    handleDeprecatedCommand(`downstack ${subcommand}`, newCmd);
  } else {
    handleDeprecatedCommandGroup(
      '`gt downstack` has been removed. Use `gt submit --downstack`, `gt restack --downstack`, etc. instead.'
    );
  }
};
