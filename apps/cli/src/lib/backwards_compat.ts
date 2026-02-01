/* eslint-disable no-console */
import chalk from 'chalk';

const ENV_VAR = 'GT_CLI_SHOW_DEPRECATION_HELP';

export function showDeprecationHelp(): boolean {
  return process.env[ENV_VAR] === '1';
}

export function handleDeprecatedCommand(
  oldCommand: string,
  newCommand: string
): never {
  if (showDeprecationHelp()) {
    console.error(
      chalk.yellow(
        `\`gt ${oldCommand}\` is deprecated. Use \`gt ${newCommand}\` instead.`
      )
    );
  }
  // eslint-disable-next-line no-restricted-syntax
  process.exit(1);
}
