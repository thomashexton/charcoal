import yargs from 'yargs';
import { submitAction } from '../actions/submit/submit_action';
import { SCOPE, TScopeSpec } from '../lib/engine/scope_spec';
import { graphite } from '../lib/runner';
import open from 'open';

const args = {
  draft: {
    describe: 'If set, all new PRs will be created in draft mode.',
    type: 'boolean',
    default: false,
    alias: 'd',
  },
  publish: {
    describe: 'If set, publishes all PRs being submitted.',
    type: 'boolean',
    default: false,
    alias: 'p',
  },
  edit: {
    describe:
      'Input metadata for all PRs interactively. If neither --edit nor --no-edit is passed, only prompts for new PRs.',
    type: 'boolean',
    alias: 'e',
  },
  'no-edit': {
    describe: "Don't edit any PR fields inline. Takes precedence over --edit.",
    type: 'boolean',
    default: false,
    alias: 'n',
  },
  'edit-title': {
    describe:
      'Input the PR title interactively. Default only prompts for new PRs. Takes precedence over --no-edit.',
    type: 'boolean',
  },
  'no-edit-title': {
    describe:
      "Don't prompt for the PR title. Takes precedence over --edit-title and --edit.",
    type: 'boolean',
  },
  'edit-description': {
    describe:
      'Input the PR description interactively. Default only prompts for new PRs. Takes precedence over --no-edit.',
    type: 'boolean',
  },
  'no-edit-description': {
    describe:
      "Don't prompt for the PR description. Takes precedence over --edit-description and --edit.",
    type: 'boolean',
  },
  reviewers: {
    describe:
      'If set without an argument, prompt to manually set reviewers. Alternatively, accepts a comma separated string of reviewers.',
    type: 'string',
    alias: 'r',
  },
  'team-reviewers': {
    describe:
      'Comma separated list of team slugs. Will enable the --reviewers prompt if set without arguments.',
    type: 'string',
    alias: 't',
  },
  'dry-run': {
    describe:
      'Reports the PRs that would be submitted and terminates. No branches are restacked or pushed and no PRs are opened or updated.',
    type: 'boolean',
    default: false,
  },
  confirm: {
    describe:
      'Reports the PRs that would be submitted and asks for confirmation before pushing branches and opening/updating PRs. If either of --no-interactive or --dry-run is passed, this flag is ignored.',
    type: 'boolean',
    default: false,
    alias: 'c',
  },
  select: {
    describe:
      'Reports the PRs that would be submitted and asks the user to select which should be updated/created. If either of --no-interactive or --dry-run is passed, this flag is ignored.',
    type: 'boolean',
    default: false,
    alias: 'S',
  },
  'update-only': {
    describe:
      'Only push branches and update PRs for branches that already have PRs open.',
    type: 'boolean',
    default: false,
    alias: 'u',
  },
  force: {
    describe:
      'Force push: overwrites the remote branch with your local branch. Otherwise defaults to --force-with-lease.',
    type: 'boolean',
    default: false,
    alias: 'f',
  },
  always: {
    describe:
      'Always push updates, even if the branch has not changed. Can be helpful for fixing an inconsistent stack view on Web/GitHub resulting from downtime/a bug.',
    type: 'boolean',
    default: false,
  },
  branch: {
    describe:
      'Which branch to run this command from. Defaults to the current branch.',
    type: 'string',
  },
  stack: {
    describe:
      'Submit descendants of the current branch in addition to its ancestors.',
    type: 'boolean',
    alias: 's',
  },
  downstack: {
    describe: 'Submit current branch and ancestors only.',
    type: 'boolean',
  },
  upstack: {
    describe: 'Submit current branch and descendants only.',
    type: 'boolean',
  },
  restack: {
    describe:
      'Restack branches before submitting. If there are conflicts, output the branch names that could not be restacked.',
    type: 'boolean',
  },
  'merge-when-ready': {
    describe:
      'If set, marks all PRs being submitted as merge when ready, which will let them automatically merge as soon as all merge requirements are met.',
    type: 'boolean',
    alias: 'm',
  },
  'rerequest-review': {
    describe: 'Rerequest review from current reviewers.',
    type: 'boolean',
  },
  view: {
    describe: 'Open the PR in your browser after submitting.',
    type: 'boolean',
    alias: 'v',
  },
  web: {
    describe:
      'Open a web browser to edit PR metadata, even if no new PRs are being created or if configured to edit PR metadata via the CLI.',
    type: 'boolean',
    alias: 'w',
  },
  cli: {
    describe: 'Edit PR metadata via the CLI instead of on web.',
    type: 'boolean',
  },
  'ignore-out-of-sync-trunk': {
    describe: 'Perform submit even if trunk is out of sync with remote.',
    type: 'boolean',
    default: false,
  },
  comment: {
    describe: 'Add a comment on the PR with the given message.',
    type: 'string',
  },
  'target-trunk': {
    describe:
      'Which trunk to open PRs against on remote. Defaults to the target trunk for the current local trunk.',
    type: 'string',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'submit';
export const canonical = 'submit';
export const description =
  'Push branches to GitHub, creating or updating pull requests.';
export const builder = args;
export const aliases = ['ss'];

function getScope(argv: argsT): TScopeSpec {
  if (argv.stack) {
    return SCOPE.STACK;
  }
  if (argv.downstack) {
    return SCOPE.DOWNSTACK;
  }
  if (argv.upstack) {
    return SCOPE.UPSTACK;
  }
  return SCOPE.STACK;
}

function isStackAlias(): boolean {
  const args = process.argv.slice(2);
  return args[0] === 'ss';
}

export const handler = async (argv: argsT): Promise<void> => {
  await graphite(argv, canonical, async (context) => {
    const scope = isStackAlias() ? SCOPE.STACK : getScope(argv);

    const result = await submitAction(
      {
        scope,
        editPRFieldsInline: !argv['no-edit'] && argv.edit,
        editTitle: argv['edit-title'],
        noEditTitle: argv['no-edit-title'],
        editDescription: argv['edit-description'],
        noEditDescription: argv['no-edit-description'],
        draft: argv.draft,
        publish: argv.publish,
        dryRun: argv['dry-run'],
        updateOnly: argv['update-only'],
        reviewers: argv.reviewers,
        teamReviewers: argv['team-reviewers'],
        confirm: argv.confirm,
        forcePush: argv.force,
        select: argv.select,
        always: argv.always,
        branch: argv.branch,
        restack: argv.restack,
        view: argv.view,
        web: argv.web,
        comment: argv.comment,
        mergeWhenReady: argv['merge-when-ready'],
        rerequestReview: argv['rerequest-review'],
        targetTrunk: argv['target-trunk'],
        cli: argv.cli,
        ignoreOutOfSyncTrunk: argv['ignore-out-of-sync-trunk'],
      },
      context
    );

    if (argv.view && result.submittedPrUrls.length > 0) {
      const lastPrUrl =
        result.submittedPrUrls[result.submittedPrUrls.length - 1];
      context.splog.info(`Opening ${lastPrUrl} in browser...`);
      await open(lastPrUrl);
    }

    if (argv.web && result.submittedPrUrls.length > 0) {
      for (const prUrl of result.submittedPrUrls) {
        const editUrl = prUrl.replace(/\/pull\/(\d+)$/, '/pull/$1/edit');
        context.splog.info(`Opening ${editUrl} in browser...`);
        await open(editUrl);
      }
    }
  });
};
