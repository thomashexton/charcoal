/* eslint-disable no-console */
import chalk from 'chalk';

export function handleDeprecatedCommand(
  _oldCommand: string,
  newCommand: string
): void {
  console.error(chalk.yellow(`Run \`gt ${newCommand}\` instead.`));
  process.exit(1);
}

export function handleDeprecatedCommandGroup(message: string): void {
  console.error(chalk.yellow(message));
  process.exit(1);
}
