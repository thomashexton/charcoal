import { Argv } from 'yargs';
import {
  handleDeprecatedCommand,
  handleDeprecatedCommandGroup,
} from '../../lib/backwards_compat';

export const command = 'user [command..]';
export const desc = false as const;
export const deprecated = true;

const COMMAND_RENAMES: Record<string, string> = {
  'branch-prefix': 'config branch-prefix',
  'branch-date': 'config branch-date',
  'branch-replacement': 'config branch-replacement',
  editor: 'config editor',
  pager: 'config pager',
  'restack-date': 'config restack-date',
  'submit-body': 'config submit-body',
  tips: 'config tips',
};

export const builder = function (yargs: Argv): Argv {
  return yargs.strict(false);
};

export const handler = function (argv: { command?: string[] }): void {
  const subcommand = argv.command?.[0];
  if (subcommand) {
    const newCmd = COMMAND_RENAMES[subcommand] ?? `config ${subcommand}`;
    handleDeprecatedCommand(`user ${subcommand}`, newCmd);
  } else {
    handleDeprecatedCommandGroup(
      '`gt user` has been removed. Use `gt config` instead.'
    );
  }
};
