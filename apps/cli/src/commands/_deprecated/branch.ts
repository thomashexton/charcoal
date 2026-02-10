import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'branch [command..]';
export const desc = false as const;
export const aliases = [];
export const deprecated = true;

export const builder = function (yargs: Argv): Argv {
  return yargs.strict(false);
};

export const handler = function (argv: {
  command?: string[];
}): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    handleDeprecatedCommand(`branch ${subcommand}`, subcommand);
  } else {
    handleDeprecatedCommandGroup(
      '`gt branch` has been removed. Use `gt create`, `gt checkout`, `gt rename`, etc. directly.'
    );
  }
};
