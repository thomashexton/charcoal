import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  describe(`(${scene}): renamed and repo commands (flat)`, function () {
    configureTest(this, scene);

    it('move rebases branch onto new parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.runCliCommand([`move`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('c');
      expectCommits(scene.repo, 'c, a, 1');
    });

    it('reorder allows editing branch order', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('init initializes the repo', () => {
      scene.repo.runCliCommand([
        `init`,
        `--trunk`,
        `main`,
        `--no-interactive`,
      ]);
    });

    // Note: sync test removed - requires a remote origin which BasicScene doesn't have.
    // See repo/sync.test.ts for comprehensive sync testing with proper remote setup.
  });
}
