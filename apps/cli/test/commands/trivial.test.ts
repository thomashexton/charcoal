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
  });
}
