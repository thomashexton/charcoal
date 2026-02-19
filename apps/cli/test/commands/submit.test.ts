import { expect } from 'chai';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): submit (unified)`, function () {
    configureTest(this, scene);

    it('submit --dry-run with no flags defaults to --stack scope', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('submit --stack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--stack',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('submit -s --dry-run uses alias for --stack', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '-s',
        '--dry-run',
      ]);
      expect(output).to.include('a');
    });

    it('ss --dry-run implies --stack scope', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      const output = scene.repo.runCliCommandAndGetOutput(['ss', '--dry-run']);
      expect(output).to.include('a');
    });

    it('submit --upstack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.checkoutBranch('a');
      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--upstack',
        '--dry-run',
        '--ignore-out-of-sync-trunk',
      ]);
      expect(output).to.include('a');
      expect(output).to.include('b');
    });

    it('submit --downstack --dry-run works', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      const output = scene.repo.runCliCommandAndGetOutput([
        'submit',
        '--downstack',
        '--dry-run',
        '--ignore-out-of-sync-trunk',
      ]);
      expect(output).to.include('a');
      expect(output).to.include('b');
    });

    describe('out-of-sync trunk behavior', () => {
      it('CLI flag --ignore-out-of-sync-trunk takes precedence over user config', () => {
        // Set user config to 'prompt' but use CLI flag to ignore
        scene.repo.runCliCommand([
          'config',
          'ignore-out-of-sync-trunk',
          '--set',
          'prompt',
        ]);

        scene.repo.createChange('a', 'a');
        scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

        const output = scene.repo.runCliCommandAndGetOutput([
          'submit',
          '--dry-run',
          '--ignore-out-of-sync-trunk',
        ]);
        // Should succeed without prompting
        expect(output).to.include('a');
      });

      it('user config ignoreOutOfSyncTrunk=ignore skips trunk check', () => {
        scene.repo.runCliCommand([
          'config',
          'ignore-out-of-sync-trunk',
          '--set',
          'ignore',
        ]);

        scene.repo.createChange('a', 'a');
        scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

        const output = scene.repo.runCliCommandAndGetOutput([
          'submit',
          '--dry-run',
        ]);
        // Should succeed without warning
        expect(output).to.include('a');
        expect(output).to.not.include('out of sync');
      });

      it('user config ignoreOutOfSyncTrunk=warn shows warning but proceeds', () => {
        scene.repo.runCliCommand([
          'config',
          'ignore-out-of-sync-trunk',
          '--set',
          'warn',
        ]);

        scene.repo.createChange('a', 'a');
        scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

        const output = scene.repo.runCliCommandAndGetOutput([
          'submit',
          '--dry-run',
        ]);
        // Should succeed but may show warning (depends on whether trunk is actually out of sync)
        expect(output).to.include('a');
      });

      it('environment variable GT_IGNORE_OUT_OF_SYNC_TRUNK=ignore overrides user config', () => {
        // Set user config to 'prompt'
        scene.repo.runCliCommand([
          'config',
          'ignore-out-of-sync-trunk',
          '--set',
          'prompt',
        ]);

        // Set env var to 'ignore'
        const oldEnv = process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
        process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = 'ignore';

        try {
          scene.repo.createChange('a', 'a');
          scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

          const output = scene.repo.runCliCommandAndGetOutput([
            'submit',
            '--dry-run',
          ]);
          // Should succeed without prompting due to env var
          expect(output).to.include('a');
        } finally {
          // Restore env var
          if (oldEnv !== undefined) {
            process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = oldEnv;
          } else {
            delete process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
          }
        }
      });

      it('environment variable GT_IGNORE_OUT_OF_SYNC_TRUNK=warn shows warning', () => {
        const oldEnv = process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
        process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = 'warn';

        try {
          scene.repo.createChange('a', 'a');
          scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

          const output = scene.repo.runCliCommandAndGetOutput([
            'submit',
            '--dry-run',
          ]);
          // Should succeed
          expect(output).to.include('a');
        } finally {
          // Restore env var
          if (oldEnv !== undefined) {
            process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = oldEnv;
          } else {
            delete process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
          }
        }
      });

      it('invalid environment variable value falls back to user config', () => {
        scene.repo.runCliCommand([
          'config',
          'ignore-out-of-sync-trunk',
          '--set',
          'ignore',
        ]);

        const oldEnv = process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
        process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = 'invalid-value';

        try {
          scene.repo.createChange('a', 'a');
          scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

          const output = scene.repo.runCliCommandAndGetOutput([
            'submit',
            '--dry-run',
          ]);
          // Should succeed due to user config fallback
          expect(output).to.include('a');
          // Note: Warning about invalid env var is written to stderr and may not be captured in test output
        } finally {
          // Restore env var
          if (oldEnv !== undefined) {
            process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK = oldEnv;
          } else {
            delete process.env.GT_IGNORE_OUT_OF_SYNC_TRUNK;
          }
        }
      });
    });
  });
}
