import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): undo command`, function () {
    configureTest(this, scene);

    it('undo --list shows recent operations', function () {
      // Create a branch to generate an operation
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'test-branch', '-m', 'test']);

      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      // Should show recent operations or reflog entries
      expect(output).to.include('Recent');
    });

    it('operations are logged when creating branches', function () {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'logged-branch', '-m', 'test']);

      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      // The undo command shows recent charcoal operations
      expect(output).to.include('logged-branch');
    });

    it('operations are logged when deleting branches', function () {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'to-delete', '-m', 'test']);
      scene.repo.checkoutBranch('main');
      scene.repo.runCliCommand(['delete', 'to-delete', '--force']);

      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      expect(output).to.include('delete');
      expect(output).to.include('to-delete');
    });

    it('undo --force resets to previous state', function () {
      // Create initial state
      scene.repo.createChange('initial', 'initial');
      scene.repo.runCliCommand(['create', 'initial-branch', '-m', 'initial']);

      // Create another change
      scene.repo.createChange('second', 'second');
      scene.repo.runCliCommand(['create', 'second-branch', '-m', 'second']);

      // Undo should reset to previous state
      scene.repo.runCliCommand(['undo', '--force']);

      // We should be able to see reflog showing the undo happened
      const reflog = scene.repo.runGitCommandAndGetOutput([
        'reflog',
        '--oneline',
        '-n',
        '5',
      ]);
      expect(reflog).to.include('reset');
    });

    it('undo preserves untracked files', function () {
      // Create an untracked file
      const untrackedPath = path.join(scene.dir, 'untracked.txt');
      fs.writeFileSync(untrackedPath, 'untracked content');

      // Create a branch
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'test-branch', '-m', 'test']);

      // Undo with force
      scene.repo.runCliCommand(['undo', '--force']);

      // Untracked file should still exist (git reset --hard doesn't touch untracked files)
      expect(fs.existsSync(untrackedPath)).to.be.true;
      expect(fs.readFileSync(untrackedPath, 'utf-8')).to.equal(
        'untracked content'
      );
    });

    it('undo works after creating multiple branches', function () {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'branch-a', '-m', 'a']);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand(['create', 'branch-b', '-m', 'b']);

      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand(['create', 'branch-c', '-m', 'c']);

      // Should have operations logged
      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      expect(output).to.include('branch-c');
      expect(output).to.include('branch-b');
      expect(output).to.include('branch-a');
    });

    it('undo works with freeze/unfreeze', function () {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'frozen-branch', '-m', 'test']);
      scene.repo.runCliCommand(['freeze']);

      // Undo should still work
      scene.repo.runCliCommand(['undo', '--force']);

      // Should have reset successfully
      const reflog = scene.repo.runGitCommandAndGetOutput([
        'reflog',
        '--oneline',
        '-n',
        '3',
      ]);
      expect(reflog).to.include('reset');
    });

    it('undo shows recent operations and git reflog', function () {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'test-branch', '-m', 'test']);

      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      // Should show recent Charcoal operations
      expect(output).to.include('Recent');
      expect(output).to.include('test-branch');
    });

    it('undo after multiple operations shows history', function () {
      // Create several branches
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand(['create', 'branch-1', '-m', 'first']);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand(['create', 'branch-2', '-m', 'second']);

      // Delete a branch
      scene.repo.checkoutBranch('branch-1');
      scene.repo.runCliCommand(['delete', 'branch-2', '--force']);

      const output = scene.repo.runCliCommandAndGetOutput(['undo', '--list']);
      // Should show both create and delete operations
      expect(output).to.include('create');
      expect(output).to.include('delete');
    });
  });
}
