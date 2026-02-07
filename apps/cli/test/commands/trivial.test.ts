import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): trivial commands`, function () {
    configureTest(this, scene);

    it('parent shows parent branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([`parent`]);
      expect(output).to.include('main');
    });

    it('parent shows message when on trunk', () => {
      const output = scene.repo.runCliCommandAndGetOutput([`parent`]);
      expect(output).to.include('No parent');
    });

    it('children shows child branches', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');

      const output = scene.repo.runCliCommandAndGetOutput([`children`]);
      expect(output).to.include('a');
    });

    it('children shows message when no children', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([`children`]);
      expect(output).to.include('No child');
    });

    it('trunk shows trunk branch name', () => {
      const output = scene.repo.runCliCommandAndGetOutput([`trunk`]);
      expect(output).to.include('main');
    });

    it('trunk --add adds an additional trunk', () => {
      scene.repo.createAndCheckoutBranch('release');
      scene.repo.createChangeAndCommit('r', 'r');
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`trunk`, `--add`, `release`]);
      const output = scene.repo.runCliCommandAndGetOutput([`trunk`, `--all`]);
      expect(output).to.include('main');
      expect(output).to.include('release');
    });

    it('trunk --add errors for nonexistent branch', () => {
      expect(() =>
        scene.repo.runCliCommand([`trunk`, `--add`, `nonexistent`])
      ).to.throw();
    });

    it('trunk --remove removes an additional trunk', () => {
      scene.repo.createAndCheckoutBranch('release');
      scene.repo.createChangeAndCommit('r', 'r');
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`trunk`, `--add`, `release`]);
      const before = scene.repo.runCliCommandAndGetOutput([`trunk`, `--all`]);
      expect(before).to.include('release');

      scene.repo.runCliCommand([`trunk`, `--remove`, `release`]);
      const after = scene.repo.runCliCommandAndGetOutput([`trunk`, `--all`]);
      expect(after).to.not.include('release');
    });

    it('revert creates a branch reverting a commit', () => {
      scene.repo.createChangeAndCommit('bad-change', 'bad');
      const sha = scene.repo.runGitCommandAndGetOutput([
        'rev-parse',
        'HEAD',
      ]);

      scene.repo.runCliCommand([`revert`, sha]);
      const branchName = scene.repo.currentBranchName();
      expect(branchName).to.include('revert-');
      expect(branchName).to.include(sha.slice(0, 7));
    });

    it('revert errors for invalid SHA', () => {
      expect(() =>
        scene.repo.runCliCommand([`revert`, `0000000000000000`])
      ).to.throw();
    });
  });
}
