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
      // Setup: Trunk -> a -> b -> c
      scene.repo.createChange('a', 'f1');
      scene.repo.runCliCommand(['create', 'a', '-m', 'a']);

      scene.repo.createChange('b', 'f2');
      scene.repo.runCliCommand(['create', 'b', '-m', 'b']);

      scene.repo.createChange('c', 'f3');
      scene.repo.runCliCommand(['create', 'c', '-m', 'c']);

      // Checkout b, modify f1 (from a)
      scene.repo.checkoutBranch('b');
      scene.repo.createChange('a modified', 'f1', true);

      // Run gt absorb (-a to stage, -f to skip prompt)
      scene.repo.runCliCommand(['absorb', '-a', '-f']);

      // Verify a has the modified content
      scene.repo.checkoutBranch('a');
      const f1Path = path.join(scene.repo.dir, 'f1_test.txt');
      expect(fs.readFileSync(f1Path, 'utf-8')).to.equal('a modified');

      // Verify b is restacked onto new a
      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, a, 1');

      // Verify c is restacked onto new b
      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a, 1');
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
