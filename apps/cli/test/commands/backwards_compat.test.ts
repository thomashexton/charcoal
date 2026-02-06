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

  // Deprecated commands work but show "Run `gt X` instead." on stderr
  describe('default behavior (suggestion shown)', function () {
    it('deprecated branch commands show suggestion', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt create` instead');
    });

    it('deprecated stack commands show suggestion', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['stack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt restack --stack` instead');
    });

    it('deprecated upstack commands show suggestion', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['upstack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt restack --upstack` instead');
    });

    it('deprecated downstack commands show suggestion', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['downstack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt');
    });

    it('deprecated repo commands show suggestion', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'init', '--trunk', 'main', '--no-interactive'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt init` instead');
    });

    it('deprecated repo config commands show suggestion', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'owner'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: undefined }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.include('Run `gt config repo-owner` instead');
    });
  });

  describe('GT_CLI_HIDE_DEPRECATION_WARNINGS=1 (silent)', function () {
    it('deprecated branch commands work silently', () => {
      scene.repo.createChange('b', 'b');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch-2', '-m', 'test'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });

    it('deprecated stack commands work silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['stack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });

    it('deprecated upstack commands work silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['upstack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });

    it('deprecated downstack commands work silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['downstack', 'restack'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });

    it('deprecated repo commands work silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'init', '--trunk', 'main', '--no-interactive'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });

    it('deprecated repo config commands work silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'owner'],
        { GT_CLI_HIDE_DEPRECATION_WARNINGS: '1' }
      );
      expect(result.status).to.equal(0);
      expect(result.stderr).to.equal('');
    });
  });
});
