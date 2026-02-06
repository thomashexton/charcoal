// Deprecation warnings are handled by yargs middleware in the _deprecated command files.
// This function is kept for any future command preprocessing needs.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleDeprecatedCommandNames(command: string[]): void {
  // No-op: warnings are emitted by yargs middleware to avoid duplicates
}
