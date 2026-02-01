import { handleDeprecatedCommand } from '../backwards_compat';

export function handleDeprecatedCommandNames(command: string[]): void {
  switch (command[0]) {
    case 'branch':
    case 'b':
      if (['next', 'n'].includes(command[1])) {
        handleDeprecatedCommand(`branch ${command[1]}`, 'up');
      }
      if (['previous', 'p'].includes(command[1])) {
        handleDeprecatedCommand(`branch ${command[1]}`, 'down');
      }
      if ('show' === command[1]) {
        handleDeprecatedCommand('branch show', 'info');
      }
      break;
    case 'downstack':
    case 'ds':
      if ('sync' === command[1]) {
        handleDeprecatedCommand('downstack sync', 'get');
      }
      break;
    case 'upstack':
    case 'us':
      if (['fix', 'f'].includes(command[1])) {
        handleDeprecatedCommand(`upstack ${command[1]}`, 'restack --upstack');
      }
      break;
    case 'stack':
    case 's':
      if (['fix', 'f'].includes(command[1])) {
        handleDeprecatedCommand(`stack ${command[1]}`, 'restack --stack');
      }
      break;
  }
}
