import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): navigation (flat commands)`, function () {
    configureTest(this, scene);

    it('up moves to child branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`up`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('down moves to parent branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`down`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('top moves to tip of stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);
      scene.repo.checkoutBranch('a');

      scene.repo.runCliCommand([`top`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('c');
    });

    it('bottom moves to first branch from trunk', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.runCliCommand([`bottom`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('checkout switches to specified branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`checkout`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('up 2 moves two branches up', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);
      scene.repo.checkoutBranch('a');

      scene.repo.runCliCommand([`up`, `2`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('c');
    });

    it('down 2 moves two branches down', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.runCliCommand([`down`, `2`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('up returns non-zero exit code when already at top', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      // Already at top of stack (branch 'a' has no children)

      expect(() =>
        scene.repo.runCliCommand([`up`, `--no-interactive`])
      ).to.throw();
    });

    it('down returns non-zero exit code when already on trunk', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');
      // Already on trunk, can't go further down

      expect(() =>
        scene.repo.runCliCommand([`down`, `--no-interactive`])
      ).to.throw();
    });

    it('top returns non-zero exit code when already at top', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      // Already at top

      expect(() =>
        scene.repo.runCliCommand([`top`, `--no-interactive`])
      ).to.throw();
    });

    it('bottom returns non-zero exit code when already at bottom', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      // Already at bottom

      expect(() =>
        scene.repo.runCliCommand([`bottom`, `--no-interactive`])
      ).to.throw();
    });

  });
}
