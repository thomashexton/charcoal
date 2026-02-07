import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { performInTmpDir } from '../../src/lib/utils/perform_in_tmp_dir';
import { allScenes } from '../lib/scenes/all_scenes';
import { BasicScene } from '../lib/scenes/basic_scene';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

function createStackEditsInput(opts: {
  dirPath: string;
  orderedBranches: string[];
}): string {
  const contents = opts.orderedBranches.join('\n');
  const filePath = path.join(opts.dirPath, 'edits.txt');
  fs.writeFileSync(filePath, contents);
  return filePath;
}

for (const scene of allScenes) {
  describe(`(${scene}): renamed and repo commands (flat)`, function () {
    configureTest(this, scene);

    it('move rebases branch onto new parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.runCliCommand([`move`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('c');
      expectCommits(scene.repo, 'c, a, 1');
    });

    it('move leaf stack onto main', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      scene.repo.runCliCommand([`move`, `main`]);
      expectCommits(scene.repo, '3, 1');
    });

    it('move catches merge conflict on first rebase', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('3', 'a');

      scene.repo.checkoutBranch('a');
      expect(() => {
        scene.repo.runCliCommand([`move`, `main`]);
      }).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;
    });

    it('continue move with single merge conflict', () => {
      scene.repo.createChange('a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.checkoutBranch('main');

      scene.repo.createChange('b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      expect(() =>
        scene.repo.runCliCommand(['move', 'a'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      const output = scene.repo.runCliCommandAndGetOutput(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('b');
      expectCommits(scene.repo, 'b, a');
      expect(scene.repo.rebaseInProgress()).to.be.false;
      output.includes('Successfully moved');
    });

    it('continue move with multiple merge conflicts', () => {
      scene.repo.createChange('a', '1');
      scene.repo.createChange('a', '2');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.checkoutBranch('main');

      scene.repo.createChange('b', '1');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('c', '2');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      scene.repo.checkoutBranch('b');

      expect(() =>
        scene.repo.runCliCommand(['move', 'a'])
      ).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();

      expect(() => scene.repo.runCliCommand(['continue'])).to.throw();
      expect(scene.repo.rebaseInProgress()).to.be.true;

      scene.repo.resolveMergeConflicts();
      scene.repo.markMergeConflictsAsResolved();
      scene.repo.runCliCommand(['continue']);

      expect(scene.repo.currentBranchName()).to.equal('b');
      expectCommits(scene.repo, 'b, a');
      expect(scene.repo.rebaseInProgress()).to.be.false;

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a');
    });

    it('reorder allows editing branch order', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('init initializes the repo', () => {
      scene.repo.runCliCommand([
        `init`,
        `--trunk`,
        `main`,
        `--no-interactive`,
      ]);
    });
  });
}

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): reorder commands`, function () {
    configureTest(this, scene);

    it('no-op reorder without conflict', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      performInTmpDir((dirPath) => {
        const inputPath = createStackEditsInput({
          dirPath,
          orderedBranches: ['b', 'a'],
        });
        expect(() =>
          scene.repo.runCliCommand([`reorder`, `--input`, inputPath])
        ).to.not.throw(Error);
        expect(scene.repo.rebaseInProgress()).to.be.false;
      });
    });

    it('reorder with conflict, resolve, and continue', () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `2`]);
      scene.repo.createChange('3', 'a');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `3`]);

      performInTmpDir((dirPath) => {
        const inputPath = createStackEditsInput({
          dirPath,
          orderedBranches: ['a', 'b'],
        });
        expect(() =>
          scene.repo.runCliCommand([`reorder`, `--input`, inputPath])
        ).to.throw(Error);
        expect(scene.repo.rebaseInProgress()).to.be.true;

        scene.repo.resolveMergeConflicts();
        scene.repo.markMergeConflictsAsResolved();

        expect(() => scene.repo.runCliCommand(['continue'])).to.throw();
        expect(scene.repo.rebaseInProgress()).to.eq(true);

        scene.repo.resolveMergeConflicts();
        scene.repo.markMergeConflictsAsResolved();
        scene.repo.runCliCommand(['continue']);
        expectCommits(scene.repo, '2, 3, 1');
      });
    });
  });
}
