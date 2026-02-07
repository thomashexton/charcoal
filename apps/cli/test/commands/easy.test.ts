import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  describe(`(${scene}): easy commands`, function () {
    configureTest(this, scene);

    it('modify amends the current commit by default', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('a2', 'a2');

      scene.repo.runCliCommand([`modify`, `-a`, `--no-edit`]);
      const commits = scene.repo.listCurrentBranchCommitMessages();
      expect(commits[0]).to.equal('a');
    });

    it('modify --commit creates a new commit', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('a2', 'a2');

      scene.repo.runCliCommand([`modify`, `-a`, `--commit`, `-m`, `a2`]);
      const commits = scene.repo.listCurrentBranchCommitMessages();
      expect(commits[0]).to.equal('a2');
    });

    it('pop deletes current branch and checks out parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`pop`]);
      expect(scene.repo.currentBranchName()).to.equal('a');

      const branches = scene.repo.runGitCommandAndGetOutput([
        'branch',
        '--list',
        'b',
      ]);
      expect(branches).to.equal('');
    });

    it('aliases shows available aliases', () => {
      const output = scene.repo.runCliCommandAndGetOutput([`aliases`]);
      expect(output).to.include('Available aliases');
      expect(output).to.include('checkout');
    });

    it('config --list shows configuration', () => {
      scene.repo.runCliCommand([`config`, `branch-prefix`, `--set`, `user/`]);
      const output = scene.repo.runCliCommandAndGetOutput([`config`, `--list`]);
      expect(output).to.include('User configuration');
      expect(output).to.include('branch-prefix');
    });

    it('commit create with multi-word message', () => {
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`commit`, `create`, `-m`, `a b c`]);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'a b c');
    });

    it('commit create fails with no staged changes', () => {
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(() =>
        scene.repo.runCliCommand([`commit`, `create`, `-m`, `a`])
      ).to.throw(Error);
    });

    it('commit create auto-restacks upwards', () => {
      scene.repo.createChange('2', '2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3', '3');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange('2.5', '2.5');
      scene.repo.runCliCommand([`commit`, `create`, `-m`, `2.5`]);

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, '3, 2.5, 2, 1');
    });

    it('commit amend changes message', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      expectCommits(scene.repo, '2, 1');

      scene.repo.runCliCommand([`commit`, `amend`, `-m`, `3`]);
      expectCommits(scene.repo, '3, 1');
    });

    it('commit amend with no staged changes is OK', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`commit`, `amend`, `-m`, `b`]);
      expectCommits(scene.repo, 'b, 1');
    });

    it('commit amend auto-restacks upwards', () => {
      scene.repo.createChange('2', '2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3', '3');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand([`commit`, `amend`, `-m`, `2.5`]);

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, '3, 2.5, 1');
    });

    it('commit amend with merge conflict during restack', () => {
      const lorem =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

      scene.repo.createChange(lorem);
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange(['b', lorem].join('\n'));
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange(`Hello world! ${lorem}`);
      expect(() =>
        scene.repo.runCliCommand([`commit`, `amend`, `-m`, `a1`])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand([`continue`]);

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a1, 1');
    });

    it('commit amend multi-word message', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`commit`, `amend`, `-m`, `a b c`]);
      expectCommits(scene.repo, 'a b c');
    });

    it('commit amend without staged changes (amend -n)', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      expectCommits(scene.repo, 'a, 1');

      scene.repo.runCliCommand([`commit`, `amend`, `-m`, `b`]);
      expectCommits(scene.repo, 'b, 1');

      scene.repo.runCliCommand([`commit`, `amend`, `-n`]);
      expectCommits(scene.repo, 'b, 1');
    });

    it('Cannot amend an empty commit', () => {
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
      expect(() =>
        scene.repo.runCliCommand([`commit`, `amend`, `-m`, `b`])
      ).to.throw();
    });

    it('Continue commit create with single merge conflict', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange('1');

      expect(() =>
        scene.repo.runCliCommand([`commit`, `create`, `-m`, `c`])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      scene.repo.runCliCommand(['log']);

      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'c, a, 1');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, c, a');
    });

    it('Continue commit create with multiple merge conflicts', () => {
      scene.repo.createChange('a', '1');
      scene.repo.createChange('a', '2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', '1');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('c', '2');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange('1', '1');
      scene.repo.createChange('2', '2');

      expect(() =>
        scene.repo.runCliCommand([`commit`, `create`, `-m`, 'a12'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      expect(() => scene.repo.runCliCommand(['continue'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'a12, a, 1');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a12, a');
    });

    it('Continue commit amend with single merge conflict', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange('1');

      expect(() =>
        scene.repo.runCliCommand(['commit', 'amend', '-m', 'c', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      scene.repo.runCliCommand(['log']);

      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'c, 1');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, c');
    });

    it('Continue commit amend with multiple merge conflicts', () => {
      scene.repo.createChange('a', '1');
      scene.repo.createChange('a', '2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', '1');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('c', '2');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChange('1', '1');
      scene.repo.createChange('2', '2');

      expect(() =>
        scene.repo.runCliCommand(['commit', `amend`, `-m`, 'a12'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      expect(() => scene.repo.runCliCommand(['continue'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'a12, 1');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a12');
    });

    it('split --by-file moves matching files into new parent branch', () => {
      scene.repo.createChange('feat-code', 'src');
      scene.repo.createChange('feat-test', 'test');
      scene.repo.runCliCommand([`create`, `feat`, `-m`, `feat`]);

      scene.repo.runCliCommand([
        `split`,
        `--by-file`,
        `test_test.txt`,
        `--no-interactive`,
      ]);

      expect(scene.repo.currentBranchName()).to.equal('feat');

      const ctx = scene.getContext();
      const parent = ctx.engine.getParentPrecondition('feat');
      expect(parent).to.equal('feat-files');

      scene.repo.checkoutBranch('feat-files');
      const parentFiles = scene.repo.runGitCommandAndGetOutput([
        'ls-tree',
        '-r',
        '--name-only',
        'HEAD',
      ]);
      expect(parentFiles).to.include('test_test.txt');
      expect(parentFiles).to.not.include('src_test.txt');

      scene.repo.checkoutBranch('feat');
      const originalFiles = scene.repo.runGitCommandAndGetOutput([
        'ls-tree',
        '-r',
        '--name-only',
        'HEAD',
      ]);
      expect(originalFiles).to.include('src_test.txt');
      expect(originalFiles).to.not.include('test_test.txt');
    });

    it('split --by-file errors when no files match', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(() =>
        scene.repo.runCliCommand([
          `split`,
          `--by-file`,
          `nonexistent.txt`,
          `--no-interactive`,
        ])
      ).to.throw();
    });

    it('split --by-file errors when all files match', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(() =>
        scene.repo.runCliCommand([
          `split`,
          `--by-file`,
          `test.txt`,
          `--no-interactive`,
        ])
      ).to.throw();
    });

    it('split --by-file restacks upstack branches', () => {
      scene.repo.createChange('feat-code', 'src');
      scene.repo.createChange('feat-test', 'test');
      scene.repo.runCliCommand([`create`, `feat`, `-m`, `feat`]);

      scene.repo.createChange('child-work', 'child');
      scene.repo.runCliCommand([`create`, `child`, `-m`, `child`]);

      scene.repo.checkoutBranch('feat');
      scene.repo.runCliCommand([
        `split`,
        `--by-file`,
        `test_test.txt`,
        `--no-interactive`,
      ]);

      scene.repo.checkoutBranch('child');
      expectCommits(scene.repo, 'child, feat');
    });

    it('unlink on branch with no PR is a no-op', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.runCliCommand([`unlink`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('unlink clears PR info from branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const ctx = scene.getContext();
      ctx.engine.upsertPrInfo('a', { number: 42 });
      expect(ctx.engine.getPrInfo('a')?.number).to.equal(42);

      scene.repo.runCliCommand([`unlink`]);

      const ctx2 = scene.getContext();
      expect(ctx2.engine.getPrInfo('a')).to.be.undefined;
    });
  });
}
