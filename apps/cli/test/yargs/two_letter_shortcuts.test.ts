import { expect } from 'chai';
import { BasicScene } from '../lib/scenes/basic_scene';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): two letter shortcuts`, function () {
    configureTest(this, scene);

    it("Can run 'd' shortcut command for down", () => {
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      expect(() => scene.repo.runCliCommand(['d'])).to.not.throw(Error);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it("Can run 'u' shortcut command for up", () => {
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');
      expect(() => scene.repo.runCliCommand(['u'])).to.not.throw(Error);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it("Can run 'c' shortcut command for create", () => {
      scene.repo.createChange('a', 'a');
      expect(() => scene.repo.runCliCommand(['c', 'a', '-m', 'a'])).to.not.throw(Error);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });
  });
}
