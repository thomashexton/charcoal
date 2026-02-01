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
  });
}
