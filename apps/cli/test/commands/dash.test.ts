import { expect } from 'chai';
import { BasicScene } from '../lib/scenes/basic_scene';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): dash`, function () {
    configureTest(this, scene);

    before(() => {
      process.env.GT_DISABLE_OPEN = '1';
    });

    after(() => {
      delete process.env.GT_DISABLE_OPEN;
    });

    it('Shows help when dash-url is not set', () => {
      const output = scene.repo.runCliCommandAndGetOutput([`dash`]);
      expect(output).to.include('No dashboard URL configured');
      expect(output).to.include('gt config dash-url --set');
    });

    it('Outputs dashboard URL when dash-url is set', () => {
      scene.repo.runCliCommand([
        `config`,
        `dash-url`,
        `--set`,
        `https://example.com/dashboard`,
      ]);
      const output = scene.repo.runCliCommandAndGetOutput([`dash`]);
      expect(output).to.include('https://example.com/dashboard');
    });
  });
}
