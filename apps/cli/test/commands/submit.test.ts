import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): submit (unified)`, function () {
    configureTest(this, scene);

    it('submit --dry-run with no flags defaults to --stack scope', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('submit --stack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--stack',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('submit -s --dry-run uses alias for --stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '-s',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('ss --dry-run implies --stack scope', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput(['ss', '--dry-run']);
      expect(output).to.include('a');
    });

    it('submit --upstack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--upstack',
        '--dry-run',
        '--ignore-out-of-sync-trunk',
      ]);
      expect(output).to.include('a');
      expect(output).to.include('b');
    });

    it('submit --downstack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--downstack',
        '--dry-run',
        '--ignore-out-of-sync-trunk',
      ]);
      expect(output).to.include('a');
      expect(output).to.include('b');
    });
  });
}
