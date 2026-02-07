import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): easy commands`, function () {
    configureTest(this, scene);

    it('modify amends the current commit by default', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('a2', 'a2');

      scene.repo.runCliCommand([`modify`, `-a`, `--no-edit`]);
      const commits = scene.repo.listCurrentBranchCommitMessages();
      expect(commits[0]).to.equal('a');
    });

    it('modify --commit creates a new commit', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('a2', 'a2');

      scene.repo.runCliCommand([`modify`, `-a`, `--commit`, `-m`, `a2`]);
      const commits = scene.repo.listCurrentBranchCommitMessages();
      expect(commits[0]).to.equal('a2');
    });

    it('pop deletes current branch and checks out parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      // pop has no flags - it preserves working tree state per reference
      scene.repo.runCliCommand([`pop`]);
      expect(scene.repo.currentBranchName()).to.equal('a');

      const branches = scene.repo.runGitCommandAndGetOutput([
        'branch',
        '--list',
        'b',
      ]);
      expect(branches).to.equal('');
    });

    it('aliases shows available aliases', () => {
      const output = scene.repo.runCliCommandAndGetOutput([`aliases`]);
      expect(output).to.include('Available aliases');
      expect(output).to.include('checkout');
    });

    it('config --list shows configuration', () => {
      scene.repo.runCliCommand([`config`, `branch-prefix`, `--set`, `user/`]);
      const output = scene.repo.runCliCommandAndGetOutput([`config`, `--list`]);
      expect(output).to.include('User configuration');
      expect(output).to.include('branch-prefix');
    });
  });
}
