import { expect } from 'chai';
import { spawnSync } from 'child_process';
import path from 'path';
import { TrailingProdScene } from '../lib/scenes/trailing_prod_scene';
import { configureTest } from '../lib/utils/configure_test';
import { USER_CONFIG_OVERRIDE_ENV } from '../../src/lib/context';

const CLI_PATH = path.join(__dirname, '..', '..', 'src', 'index.js');

function runCliCommandWithEnv(
  dir: string,
  userConfigPath: string,
  command: string[],
  env: Record<string, string | undefined>
): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.argv[0], [CLI_PATH, ...command], {
    encoding: 'utf-8',
    cwd: dir,
    env: {
      ...process.env,
      [USER_CONFIG_OVERRIDE_ENV]: userConfigPath,
      GRAPHITE_DISABLE_TELEMETRY: '1',
      GRAPHITE_DISABLE_UPGRADE_PROMPT: '1',
      GRAPHITE_DISABLE_SURVEY: '1',
      GRAPHITE_PROFILE: undefined,
      ...env,
    },
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// Use TrailingProdScene which runs repo init during setup
const scene = new TrailingProdScene();

describe(`backwards compatibility`, function () {
  configureTest(this, scene);

  describe('GT_CLI_BACKWARDS_COMPAT=1 (default)', function () {
    it('deprecated branch commands run with warning', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_BACKWARDS_COMPAT: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('gt create');
    });

    it('deprecated stack commands suggest --stack flag', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([
        'branch',
        'create',
        'test-branch',
        '-m',
        'test',
      ]);
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['stack', 'restack'],
        { GT_CLI_BACKWARDS_COMPAT: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--stack');
    });

    it('deprecated upstack commands suggest new command', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([
        'branch',
        'create',
        'test-branch',
        '-m',
        'test',
      ]);
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['upstack', 'restack'],
        { GT_CLI_BACKWARDS_COMPAT: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--upstack');
    });

    it('deprecated downstack commands suggest new command', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([
        'branch',
        'create',
        'test-branch',
        '-m',
        'test',
      ]);
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['downstack', 'restack'],
        { GT_CLI_BACKWARDS_COMPAT: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--downstack');
    });

    it('deprecated repo commands suggest new command', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'init', '--trunk', 'main', '--no-interactive'],
        { GT_CLI_BACKWARDS_COMPAT: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('gt init');
    });
  });

  describe('GT_CLI_BACKWARDS_COMPAT=0', function () {
    it('deprecated commands exit with error', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_BACKWARDS_COMPAT: '0' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('gt create');
    });
  });

  describe('GT_CLI_BACKWARDS_COMPAT unset (defaults to enabled)', function () {
    it('deprecated commands run with warning when env var is unset', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_BACKWARDS_COMPAT: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('deprecated');
    });
  });
});
