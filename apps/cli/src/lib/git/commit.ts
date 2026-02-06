import { runGitCommand } from './runner';

export type TCommitOpts = {
  amend?: boolean;
  message?: string;
  noEdit?: boolean;
  edit?: boolean;
  patch?: boolean;
  resetAuthor?: boolean;
  verbose?: number;
};
export function commit(opts: TCommitOpts & { noVerify: boolean }): void {
  runGitCommand({
    args: [
      'commit',
      ...(opts.amend ? [`--amend`] : []),
      ...(opts.message ? [`-m`, opts.message] : []),
      ...(opts.noEdit ? [`--no-edit`] : []),
      ...(opts.edit ? [`-e`] : []),
      ...(opts.patch ? [`-p`] : []),
      ...(opts.noVerify ? ['-n'] : []),
      ...(opts.resetAuthor ? ['--reset-author'] : []),
      ...Array(opts.verbose ?? 0).fill('--verbose'),
    ],
    options: {
      stdio: 'inherit',
    },
    onError: 'throw',
    resource: 'commit',
  });
}
