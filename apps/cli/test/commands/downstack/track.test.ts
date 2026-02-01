import { expect } from 'chai';
import { allScenes } from '../../lib/scenes/all_scenes';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): track`, function () {
    configureTest(this, scene);

    it('can track a single branch with force flag', () => {
      // Create an untracked branch
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');

      // Track it with -f (force uses most recent tracked ancestor as parent)
      expect(() => {
        scene.repo.runCliCommand(['track', '-f']);
      }).not.to.throw();

      // Verify it's tracked by navigating down
      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('main');
    });

    it('can track a specific branch by name', () => {
      // Create an untracked branch
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.checkoutBranch('main');

      // Track it by name with -f
      expect(() => {
        scene.repo.runCliCommand(['track', '-f', 'a']);
      }).not.to.throw();

      // Verify it's tracked by navigating up
      expect(() => {
        scene.repo.runCliCommand([`up`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('can track branches one at a time to build a stack', () => {
      // Create untracked branches
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.createAndCheckoutBranch('b');
      scene.repo.createChangeAndCommit('b', 'b');
      scene.repo.createAndCheckoutBranch('c');
      scene.repo.createChangeAndCommit('c', 'c');

      // Track each branch individually from bottom to top
      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand(['track', '-f']);

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['track', '-f']);

      scene.repo.checkoutBranch('c');
      scene.repo.runCliCommand(['track', '-f']);

      // Verify the stack by navigating down from c
      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('b');

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('a');

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('main');
    });
  });
}
