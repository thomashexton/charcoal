import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  describe(`(${scene}): branch management (flat commands)`, function () {
    configureTest(this, scene);

    it('create creates a new branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('create with -m generates branch name from message', () => {
      scene.repo.createChange('test');
      scene.repo.runCliCommand([`create`, `-m`, `feat(test): add feature`]);
      expect(scene.repo.currentBranchName()).to.include('feat_test');
    });

    it('delete removes a branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `test-delete`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`delete`, `test-delete`, `--force`]);
      const branches = scene.repo.runGitCommandAndGetOutput([
        'branch',
        '--list',
        'test-delete',
      ]);
      expect(branches).to.equal('');
    });

    it('rename renames the current branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `old-name`, `-m`, `a`]);

      scene.repo.runCliCommand([`rename`, `new-name`, `--force`]);
      expect(scene.repo.currentBranchName()).to.equal('new-name');
    });

    it('info shows branch information', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `test-info`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([`info`]);
      expect(output).to.include('test-info');
    });

    it('fold merges branch into parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`fold`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('squash squashes commits in current branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChangeAndCommit('a2', 'a2');

      scene.repo.runCliCommand([`squash`, `--no-edit`]);
      const commits = scene.repo.listCurrentBranchCommitMessages();
      expect(commits.length).to.be.lessThanOrEqual(4);
    });

    it('untrack stops tracking a branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `test-untrack`, `-m`, `a`]);

      scene.repo.runCliCommand([`untrack`, `--force`]);
    });

    it('track starts tracking a branch', () => {
      scene.repo.createAndCheckoutBranch('untracked-branch');
      scene.repo.createChangeAndCommit('untracked', 'untracked');

      scene.repo.runCliCommand([`track`, `--parent`, `main`]);
    });
  });
}
