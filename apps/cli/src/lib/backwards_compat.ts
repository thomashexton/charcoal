/* eslint-disable no-console */
import chalk from 'chalk';

const ENV_VAR = 'GT_CLI_BACKWARDS_COMPAT';

export function isBackwardsCompatEnabled(): boolean {
  const value = process.env[ENV_VAR];
  if (value === undefined || value === '1') {
    return true;
  }
  return false;
}

export function handleDeprecatedCommand(
  oldCommand: string,
  newCommand: string
): void {
  if (isBackwardsCompatEnabled()) {
    console.error(
      chalk.yellow(
        `⚠️  \`gt ${oldCommand}\` is deprecated. Use \`gt ${newCommand}\` instead.`
      )
    );
    console.error(
      chalk.yellow(`   Set ${ENV_VAR}=0 to disable deprecated commands.`)
    );
  } else {
    console.error(
      chalk.red(
        `Error: \`gt ${oldCommand}\` is deprecated. Use \`gt ${newCommand}\` instead.`
      )
    );
    // eslint-disable-next-line no-restricted-syntax
    process.exit(1);
  }
}
