import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  describe(`(${scene}): restack (unified)`, function () {
    configureTest(this, scene);

    it('restack with no flags defaults to --stack scope', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['restack', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('b');
      expectCommits(scene.repo, 'b, a, 1.5, 1');
    });

    it('restack --stack restacks entire stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['restack', '--stack', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('b');
      expectCommits(scene.repo, 'b, a, 1.5, 1');
    });

    it('restack --upstack restacks current and descendants only', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand(['restack', '--upstack', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('restack --downstack restacks current and ancestors only', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand(['restack', '--downstack', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('restack -s is alias for --stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['restack', '-s', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('b');
      expectCommits(scene.repo, 'b, a, 1.5, 1');
    });
  });
}
