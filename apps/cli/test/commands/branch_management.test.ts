import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';
import { expectBranches } from '../lib/utils/expect_branches';
import { expectCommits } from '../lib/utils/expect_commits';

for (const scene of allScenes) {
  // eslint-disable-next-line max-lines-per-function
  describe(`(${scene}): branch management (flat commands)`, function () {
    configureTest(this, scene);

    it('create creates a new branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
    });

    it('create with -m generates branch name from message', () => {
      scene.repo.createChange('test');
      scene.repo.runCliCommand([`create`, `-m`, `feat(test): add feature`]);
      expect(scene.repo.currentBranchName()).to.include('feat_test');
    });

    it('create rolls back on failed commit hook', () => {
      scene.repo.createPrecommitHook('exit 1');
      scene.repo.createChange('2');
      expect(() => {
        scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      }).to.throw(Error);
      expect(scene.repo.currentBranchName()).to.equal('main');
    });

    it('create with --add-all/-a option', () => {
      scene.repo.createChange('23', 'test', true);
      scene.repo.runCliCommand([
        `create`,
        `test-branch`,
        `-m`,
        `add all`,
        `-a`,
      ]);
    });

    it('create errors when branch name already exists', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.checkoutBranch('main');
      scene.repo.createChange('b', 'b');

      expect(() =>
        scene.repo.runCliCommand([`create`, `a`, `-m`, `b`])
      ).to.throw();

      // Should stay on main, not switch to the existing branch
      expect(scene.repo.currentBranchName()).to.equal('main');
    });

    it('rename to existing branch name errors', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      expect(() =>
        scene.repo.runCliCommand([`rename`, `a`])
      ).to.throw();

      expect(scene.repo.currentBranchName()).to.equal('b');
    });

    it('create with --insert restacks parent children', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.runCliCommand(['down']);

      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([
        `create`,
        `c`,
        `-m`,
        `c`,
        `--insert`,
      ]);
      expect(() => scene.repo.runCliCommand(['up'])).not.to.throw();

      expectCommits(scene.repo, 'b, c, a');
    });

    it('delete removes a branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `test-delete`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand([`delete`, `test-delete`, `--force`]);
      const branches = scene.repo.runGitCommandAndGetOutput([
        'branch',
        '--list',
        'test-delete',
      ]);
      expect(branches).to.equal('');
    });

    it('rename renames the current branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `old-name`, `-m`, `a`]);

      scene.repo.runCliCommand([`rename`, `new-name`, `--force`]);
      expect(scene.repo.currentBranchName()).to.equal('new-name');
    });

    it('rename preserves stack navigation', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand([`rename`, `a1`]);

      expect(() => scene.repo.runCliCommand([`ls`])).not.to.throw();

      scene.repo.checkoutBranch('b');

      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('a1');

      scene.repo.runCliCommand([`down`, `--no-interactive`]);
      expect(scene.repo.currentBranchName()).to.equal('main');
    });

    it('rename to same name does not break', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand([`rename`, `a`]);

      expect(() => scene.repo.runCliCommand([`ls`])).not.to.throw();
      expect(() => scene.repo.runCliCommand([`up`])).not.to.throw();
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('info shows branch information', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `test-info`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([`info`]);
      expect(output).to.include('test-info');
    });

    it("fold can't fold from trunk or into trunk", () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expect(() => scene.repo.runCliCommand([`fold`])).to.throw();
      expect(() =>
        scene.repo.runCliCommand([`fold`, `--keep`])
      ).to.throw();

      scene.repo.runCliCommand([`down`]);

      expect(() => scene.repo.runCliCommand([`fold`])).to.throw();
      expect(() =>
        scene.repo.runCliCommand([`fold`, `--keep`])
      ).to.throw();
    });

    it('fold merges branch into parent', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.runCliCommand([`fold`]);
      expect(scene.repo.currentBranchName()).to.equal('a');
      expectCommits(scene.repo, 'b, a, 1');
    });

    it('fold without --keep restacks children', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);
      scene.repo.runCliCommand([`down`, `2`]);
      scene.repo.createChange('d', 'd');
      scene.repo.runCliCommand([`create`, `d`, `-m`, `d`]);
      scene.repo.checkoutBranch('b');

      scene.repo.runCliCommand([`fold`]);
      expectBranches(scene.repo, 'a, c, d, main');
      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`]);
      expectCommits(scene.repo, '1');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a, 1');

      scene.repo.checkoutBranch('d');
      expectCommits(scene.repo, 'd, b, a, 1');
    });

    it('fold with --keep restacks children', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);
      scene.repo.runCliCommand([`down`, `2`]);
      scene.repo.createChange('d', 'd');
      scene.repo.runCliCommand([`create`, `d`, `-m`, `d`]);
      scene.repo.checkoutBranch('b');

      scene.repo.runCliCommand([`fold`, `--keep`]);
      expectBranches(scene.repo, 'b, c, d, main');
      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`]);
      expectCommits(scene.repo, '1');

      scene.repo.checkoutBranch('c');
      expectCommits(scene.repo, 'c, b, a, 1');

      scene.repo.checkoutBranch('d');
      expectCommits(scene.repo, 'd, b, a, 1');
    });

    it('squash squashes two commits and restacks child', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('a2', 'a2');
      scene.repo.runCliCommand([`commit`, `create`, `-m`, `a2`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      expectCommits(scene.repo, 'b, a2, a, 1');

      scene.repo.runCliCommand([`down`]);
      scene.repo.runCliCommand([`squash`, `-n`]);
      scene.repo.runCliCommand([`up`]);

      expectCommits(scene.repo, 'b, a, 1');
    });

    it('untrack blocks navigation from and to branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      expectBranches(scene.repo, 'a, b, main');
      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`untrack`, `b`]);
      expectBranches(scene.repo, 'a, b, main');

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).to.throw();

      scene.repo.checkoutBranch('a');
      expectCommits(scene.repo, 'a, 1');
      expect(() => {
        scene.repo.runCliCommand([`up`]);
      }).to.throw();
      expectCommits(scene.repo, 'a, 1');
    });

    it('untrack with children', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);
      scene.repo.createChange('c', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);
      expectBranches(scene.repo, 'a, b, c, main');
      expectCommits(scene.repo, 'c, b, a, 1');

      scene.repo.runCliCommand([`untrack`, `b`, `-f`]);
      expectBranches(scene.repo, 'a, b, c, main');

      scene.repo.checkoutBranch('c');
      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).to.throw();
    });

    it('track and restack current branch if previously untracked', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a1', 'a1');
      scene.repo.createChangeAndCommit('a2', 'a2');
      scene.repo.createChangeAndCommit('a3', 'a3');

      scene.repo.checkoutBranch('main');
      scene.repo.createChangeAndCommit('b', 'b');

      scene.repo.checkoutBranch('a');
      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `main`]);
      }).to.not.throw();

      expectCommits(scene.repo, 'a3, a2, a1, 1');

      scene.repo.runCliCommand([`restack`]);

      expectCommits(scene.repo, 'a3, a2, a1, b, 1');

      scene.repo.runCliCommand([`down`]);
      expect(scene.repo.currentBranchName()).to.eq('main');
    });

    it('track a branch, insert before, track both as stack', () => {
      scene.repo.createAndCheckoutBranch('b');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.createChangeAndCommit('b', 'b');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `main`]);
      }).to.not.throw();

      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`]);
      expect(scene.repo.currentBranchName()).to.eq('main');

      scene.repo.runGitCommand([`branch`, `a`, `b~`]);
      scene.repo.checkoutBranch('a');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `main`]);
      }).to.not.throw();

      expectCommits(scene.repo, 'a, 1');

      scene.repo.runCliCommand([`down`]);
      expect(scene.repo.currentBranchName()).to.eq('main');

      scene.repo.checkoutBranch('b');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `a`]);
      }).to.not.throw();

      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`]);
      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('track needs rebase after parent amended', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.createAndCheckoutBranch('b');
      scene.repo.createChangeAndCommit('b', 'b');
      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.checkoutBranch('a');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `main`]);
      }).not.to.throw();

      scene.repo.createChangeAndAmend('a1', 'a1');
      scene.repo.checkoutBranch('b');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `a`]);
      }).to.throw();

      scene.repo.runGitCommand(['rebase', 'a']);

      expect(() => {
        scene.repo.runCliCommand([`track`, `-p`, `a`]);
      }).to.not.throw();

      expectCommits(scene.repo, 'b, a, 1');

      scene.repo.runCliCommand([`down`]);
      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('track --force uses most recent ancestor', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      expectCommits(scene.repo, 'a, 1');

      scene.repo.checkoutBranch('a');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-f`]);
      }).not.to.throw();

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('main');

      scene.repo.runCliCommand([`up`]);
      scene.repo.createAndCheckoutBranch('b');
      scene.repo.createChangeAndCommit('b', 'b');
      expectCommits(scene.repo, 'b, a, 1');

      expect(() => {
        scene.repo.runCliCommand([`track`, `-f`]);
      }).not.to.throw();

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('downstack track with -f force flag', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');

      expect(() => {
        scene.repo.runCliCommand(['track', '-f']);
      }).not.to.throw();

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('main');
    });

    it('downstack track specific branch by name', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.checkoutBranch('main');

      expect(() => {
        scene.repo.runCliCommand(['track', '-f', 'a']);
      }).not.to.throw();

      expect(() => {
        scene.repo.runCliCommand([`up`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('a');
    });

    it('downstack track branches one at a time to build stack', () => {
      scene.repo.createAndCheckoutBranch('a');
      scene.repo.createChangeAndCommit('a', 'a');
      scene.repo.createAndCheckoutBranch('b');
      scene.repo.createChangeAndCommit('b', 'b');
      scene.repo.createAndCheckoutBranch('c');
      scene.repo.createChangeAndCommit('c', 'c');

      scene.repo.checkoutBranch('a');
      scene.repo.runCliCommand(['track', '-f']);

      scene.repo.checkoutBranch('b');
      scene.repo.runCliCommand(['track', '-f']);

      scene.repo.checkoutBranch('c');
      scene.repo.runCliCommand(['track', '-f']);

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('b');

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('a');

      expect(() => {
        scene.repo.runCliCommand([`down`]);
      }).not.to.throw();
      expect(scene.repo.currentBranchName()).to.eq('main');
    });
  });
}
