import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): freeze/unfreeze commands`, function () {
    configureTest(this, scene);

    it('freeze marks branch as frozen', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([`freeze`]);
      expect(output).to.include('Froze');
      expect(output).to.include('a');
    });

    it('unfreeze marks branch as not frozen', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`freeze`]);

      const output = scene.repo.runCliCommandAndGetOutput([`unfreeze`]);
      expect(output).to.include('Unfroze');
      expect(output).to.include('a');
    });

    it('freeze automatically freezes downstack branches per reference', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      // Per Graphite reference: freeze freezes specified branch and branches downstack of it
      const output = scene.repo.runCliCommandAndGetOutput([`freeze`]);
      expect(output).to.include('Froze');
      expect(output).to.include('downstack');
    });

    it('unfreeze automatically unfreezes upstack branches per reference', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      // Freeze from 'a' to freeze a and downstack
      scene.repo.runCliCommand([`checkout`, `a`]);
      scene.repo.runCliCommand([`freeze`]);

      // Per Graphite reference: unfreeze unfreezes specified branch and branches upstack of it
      const output = scene.repo.runCliCommandAndGetOutput([`unfreeze`]);
      expect(output).to.include('Unfroze');
    });

    it('isFrozen returns true for frozen branches', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`freeze`]);

      const context = scene.getContext();
      expect(context.engine.isFrozen('a')).to.be.true;
    });

    it('isFrozen returns false for unfrozen branches', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`freeze`]);
      scene.repo.runCliCommand([`unfreeze`]);

      const context = scene.getContext();
      expect(context.engine.isFrozen('a')).to.be.false;
    });

    it('newly created branches are not frozen by default', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const context = scene.getContext();
      expect(context.engine.isFrozen('a')).to.be.false;
    });

    it('restack skips frozen branches', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`checkout`, `a`]);
      scene.repo.runCliCommand([`freeze`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['restack', '--stack', '-q']);

      // a should still be frozen and not restacked
      const context = scene.getContext();
      expect(context.engine.isFrozen('a')).to.be.true;
    });
  });
}
