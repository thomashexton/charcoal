import { expect } from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  describe(`(${scene}): absorb`, function () {
    configureTest(this, scene);

    it('Absorbs changes into downstack commit and restacks', () => {
      // Setup: Trunk -> A -> B -> C
      // Commit A: adds file "f1"
      scene.repo.createChange('content A', 'f1');
      scene.repo.runCliCommand(['create', 'A', '-m', 'commit A']);

      // Commit B: adds file "f2"
      scene.repo.createChange('content B', 'f2');
      scene.repo.runCliCommand(['create', 'B', '-m', 'commit B']);

      // Commit C: adds file "f3" (to test restacking upstack)
      scene.repo.createChange('content C', 'f3');
      scene.repo.runCliCommand(['create', 'C', '-m', 'commit C']);

      // Checkout B
      scene.repo.checkoutBranch('B');

      // Modify f1 (from A)
      // Note: createChange creates or overwrites file.
      // Filename will be f1_test.txt
      scene.repo.createChange('content A modified', 'f1', true); // true for unstaged

      // Run gt absorb
      // We use -a to stage the change to f1. -f to avoid prompt.
      scene.repo.runCliCommand(['absorb', '-a', '-f']);

      // Verify A is changed.
      // Checkout A and check content.
      scene.repo.checkoutBranch('A');
      const f1Path = path.join(scene.repo.dir, 'f1_test.txt');
      const contentA = fs.readFileSync(f1Path, 'utf-8');
      expect(contentA).to.equal('content A modified');

      // Verify B is restacked onto new A.
      scene.repo.checkoutBranch('B');
      expectCommits(scene.repo, 'commit B, commit A, 1');

      // Verify C is restacked onto new B.
      scene.repo.checkoutBranch('C');
      expectCommits(scene.repo, 'commit C, commit B, commit A, 1');
    });

    it('Errors gracefully if git-absorb is not installed', () => {
      // Stage a change so we get past any "no changes" checks if any
      scene.repo.createChange('dummy', 'dummy', false);
      
      const result = require('child_process').spawnSync(
        process.argv[0],
        [
          path.join(__dirname, '..', '..', '..', 'dist', 'src', 'index.js'),
          'absorb',
        ],
        {
          cwd: scene.repo.dir,
          env: {
            ...process.env,
            PATH: '/usr/bin:/bin', 
            GIT_EXEC_PATH: '/tmp/empty', // Override git exec path to avoid finding git-absorb
          },
        }
      );
      
      const output = result.stdout.toString() + result.stderr.toString();
      try {
        expect(output).to.contain('git-absorb is not installed');
      } catch (e) {
        console.log('Output was:', output);
        throw e;
      }
    });
  });
}
