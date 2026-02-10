import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'upstack [command..]';
export const desc = false as const;
export const aliases = ['us'];
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  onto: 'move',
};

export const builder = function (yargs: Argv): Argv {
  return yargs.strict(false);
};

export const handler = function (argv: {
  command?: string[];
}): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    const newCmd = COMMAND_RENAMES[subcommand] ?? `${subcommand} --upstack`;
    handleDeprecatedCommand(`upstack ${subcommand}`, newCmd);
  } else {
    handleDeprecatedCommandGroup(
      '`gt upstack` has been removed. Use `gt submit --upstack`, `gt restack --upstack`, etc. instead.'
    );
  }
};
