/* eslint-disable no-console */
import chalk from 'chalk';

const ENV_VAR = 'GT_CLI_HIDE_DEPRECATION_WARNINGS';

export function handleDeprecatedCommand(
  _oldCommand: string,
  newCommand: string
): void {
  if (process.env[ENV_VAR] !== '1') {
    console.error(chalk.yellow(`Run \`gt ${newCommand}\` instead.`));
  }
}
