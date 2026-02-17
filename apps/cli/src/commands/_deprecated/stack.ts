import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'stack [command..]';
export const desc = false as const;
export const aliases = [];
export const deprecated = true;

export const builder = function (yargs: Argv): Argv {
  return yargs.strict(false);
};

export const handler = function (argv: { command?: string[] }): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    handleDeprecatedCommand(`stack ${subcommand}`, `${subcommand} --stack`);
  } else {
    handleDeprecatedCommandGroup(
      '`gt stack` has been removed. Use `gt submit --stack`, `gt restack --stack`, etc. instead.'
    );
  }
};
