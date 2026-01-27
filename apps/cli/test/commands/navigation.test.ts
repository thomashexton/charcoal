import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): navigation (flat commands)`, function () {
    configureTest(this, scene);

    it('up moves to child branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`up`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('down moves to parent branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`down`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('top moves to tip of stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`branch`, `create`, `c`, `-m`, `c`]);
      scene.repo.checkoutBranch('a');

      scene.repo.runCliCommand([`top`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('c');
    });

    it('bottom moves to first branch from trunk', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`branch`, `create`, `c`, `-m`, `c`]);

      scene.repo.runCliCommand([`bottom`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('checkout switches to specified branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`branch`, `create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`branch`, `create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`checkout`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });


  });
}
