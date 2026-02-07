import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  // eslint-disable-next-line max-lines-per-function
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

    it('restack --stack 3-branch deep with extra commits', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      scene.repo.createChangeAndCommit('2.5', 'a.5');

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);
      scene.repo.createChangeAndCommit('3.5', 'b.5');

      scene.repo.createChange('4', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `4`]);

      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', 'main');
      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 2).join(', ')
      ).to.equal('1.5, 1');

      scene.repo.runCliCommand(['restack', '-q']);

      expect(scene.repo.currentBranchName()).to.equal('main');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1.5, 1');
    });

    it('restack --stack handles merge conflicts', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5');

      expect(() =>
        scene.repo.runCliCommand(['restack', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.resolveMergeConflicts();

      expect(() => scene.repo.runCliCommand(['continue', '-q'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue', '-q']);

      expect(scene.repo.rebaseInProgress()).to.eq(false);
      expect(scene.repo.currentBranchName()).to.eq('main');

      scene.repo.checkoutBranch('b');
      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 4).join(', ')
      ).to.equal('3, 2, 1.5, 1');
    });

    it('restack --stack restacks one specific stack', () => {
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

    it('restack --upstack restacks current and descendants only', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand(['restack', '--upstack', '-q']);

      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('restack --upstack 3-branch deep with extra commits', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      scene.repo.createChangeAndCommit('2.5', 'a.5');

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);
      scene.repo.createChangeAndCommit('3.5', 'b.5');

      scene.repo.createChange('4', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `4`]);

      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', 'main');
      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 2).join(', ')
      ).to.equal('1.5, 1');

      scene.repo.runCliCommand(['restack', '--upstack']);

      expect(scene.repo.currentBranchName()).to.equal('main');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1.5, 1');
    });

    it('restack --upstack handles merge conflicts', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5');

      expect(() => scene.repo.runCliCommand(['restack', '--upstack'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.resolveMergeConflicts();

      expect(() => scene.repo.runCliCommand(['continue', '-q'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue', '-q']);

      expect(scene.repo.rebaseInProgress()).to.eq(false);
      expect(scene.repo.currentBranchName()).to.eq('main');

      scene.repo.checkoutBranch('b');
      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 4).join(', ')
      ).to.equal('3, 2, 1.5, 1');
    });

    it("restack --upstack doesn't restack below current commit", () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndCommit('2.5', '2.5');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('b');

      scene.repo.runCliCommand(['restack', '--upstack']);

      expect(scene.repo.currentBranchName()).to.eq('b');
      expectCommits(scene.repo, 'b, 2.5, a, 1');
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

    it('restack --downstack 3-branch deep with extra commits', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      scene.repo.createChangeAndCommit('2.5', 'a.5');

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);
      scene.repo.createChangeAndCommit('3.5', 'b.5');

      scene.repo.createChange('4', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `4`]);

      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', 'main');
      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 2).join(', ')
      ).to.equal('1.5, 1');

      scene.repo.checkoutBranch('c');
      scene.repo.runCliCommand(['restack', '--downstack']);

      expect(scene.repo.currentBranchName()).to.equal('c');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, '4, 3.5, 3, 2.5, 2, 1.5, 1');
    });

    it('restack --downstack handles merge conflicts', () => {
      scene.repo.createChange('2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5');

      scene.repo.checkoutBranch('b');

      expect(() =>
        scene.repo.runCliCommand(['restack', '--downstack'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.resolveMergeConflicts();

      expect(() => scene.repo.runCliCommand(['continue', '-q'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.eq(true);

      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue', '-q']);

      expect(scene.repo.rebaseInProgress()).to.eq(false);
      expect(scene.repo.currentBranchName()).to.eq('b');

      expect(
        scene.repo.listCurrentBranchCommitMessages().slice(0, 4).join(', ')
      ).to.equal('3, 2, 1.5, 1');
    });

    it("restack --downstack doesn't restack above current commit", () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndCommit('2.5', '2.5');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('1.5', '1.5');

      scene.repo.checkoutBranch('a');

      scene.repo.runCliCommand(['restack', '--downstack']);

      scene.repo.checkoutBranch('b');

      expect(scene.repo.currentBranchName()).to.eq('b');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('Can abort a restack with a merge conflict', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndAmend('1');

      expect(() =>
        scene.repo.runCliCommand(['restack', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.runGitCommand(['rebase', '--abort']);

      expect(scene.repo.rebaseInProgress()).to.be.false;
      expect(scene.getContext().engine.currentBranchPrecondition).to.equal('b');
      expect(scene.repo.currentBranchName()).to.equal('b');

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('gt abort --force aborts a rebase in progress', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndAmend('1');

      expect(() =>
        scene.repo.runCliCommand(['restack', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.runCliCommand(['abort', '--force']);

      expect(scene.repo.rebaseInProgress()).to.be.false;
      expect(scene.repo.currentBranchName()).to.equal('b');

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('gt abort errors when no rebase is in progress', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(() =>
        scene.repo.runCliCommand(['abort', '--force'])
      ).to.throw();
    });

    it('Can continue a stack restack with single merge conflict', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndAmend('1');

      expect(() =>
        scene.repo.runCliCommand(['restack', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'a, 1');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('Can run continue multiple times on a stack restack with multiple merge conflicts', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.checkoutBranch('a');
      scene.repo.createChangeAndAmend('a1');

      scene.repo.checkoutBranch('b');
      scene.repo.createChangeAndAmend('b1');

      scene.repo.checkoutBranch('a');

      expect(() =>
        scene.repo.runCliCommand(['restack', '-q'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      expect(() => scene.repo.runCliCommand(['continue'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('a');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      expectCommits(scene.repo, 'a, 1');

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a, 1');
    });
  });
}
