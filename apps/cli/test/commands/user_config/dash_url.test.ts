import { expect } from 'chai';
import { BasicScene } from '../../lib/scenes/basic_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): user dash-url`, function () {
    configureTest(this, scene);

    it('Can check dash-url when not set', () => {
      const output = scene.repo.runCliCommandAndGetOutput([
        `config`,
        `dash-url`,
      ]);
      expect(output).to.include('Dashboard URL is not set');
    });

    it('Can set dash-url', () => {
      expect(
        scene.repo.runCliCommandAndGetOutput([
          `config`,
          `dash-url`,
          `--set`,
          `https://example.com/dashboard`,
        ])
      ).to.equal(
        'Dashboard URL set to https://example.com/dashboard'
      );
      expect(
        scene.repo.runCliCommandAndGetOutput([`config`, `dash-url`])
      ).to.equal('https://example.com/dashboard');
    });

    it('Can unset dash-url', () => {
      scene.repo.runCliCommand([
        `config`,
        `dash-url`,
        `--set`,
        `https://example.com/dashboard`,
      ]);
      const output = scene.repo.runCliCommandAndGetOutput([
        `config`,
        `dash-url`,
        `--unset`,
      ]);
      expect(output).to.equal('Dashboard URL unset.');
    });
  });
}
