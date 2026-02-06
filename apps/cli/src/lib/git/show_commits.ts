import { runGitCommand } from './runner';

export function showCommits(
  base: string,
  head: string,
  opts?: { patch?: boolean; stat?: boolean }
): string {
  return runGitCommand({
    args: [
      `-c`,
      `color.ui=always`,
      `--no-pager`,
      `log`,
      ...(opts?.patch ? ['-p'] : []),
      ...(opts?.stat ? ['--stat'] : []),
      `${base}..${head}`,
      `--`,
    ],
    onError: 'throw',
    resource: 'showCommits',
  });
}
