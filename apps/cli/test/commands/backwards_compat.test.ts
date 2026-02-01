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

  describe('GT_CLI_SHOW_DEPRECATION_HELP unset (default)', function () {
    it('deprecated branch commands exit silently', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });

    it('deprecated stack commands exit silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['stack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });

    it('deprecated upstack commands exit silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['upstack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });

    it('deprecated downstack commands exit silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['downstack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });

    it('deprecated repo commands exit silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'init', '--trunk', 'main', '--no-interactive'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });

    it('deprecated repo config commands exit silently', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'owner'],
        { GT_CLI_SHOW_DEPRECATION_HELP: undefined }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.not.include('deprecated');
    });
  });

  describe('GT_CLI_SHOW_DEPRECATION_HELP=1', function () {
    it('deprecated branch commands exit with helpful message', () => {
      scene.repo.createChange('a', 'a');
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['branch', 'create', 'test-branch', '-m', 'test'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('gt create');
    });

    it('deprecated stack commands suggest --stack flag', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['stack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--stack');
    });

    it('deprecated upstack commands suggest new command', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['upstack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--upstack');
    });

    it('deprecated downstack commands suggest new command', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['downstack', 'restack'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('--downstack');
    });

    it('deprecated repo commands suggest new command', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'init', '--trunk', 'main', '--no-interactive'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('gt init');
    });

    it('deprecated repo config commands suggest config subcommand', () => {
      const result = runCliCommandWithEnv(
        scene.repo.dir,
        scene.repo.userConfigPath,
        ['repo', 'owner'],
        { GT_CLI_SHOW_DEPRECATION_HELP: '1' }
      );
      expect(result.status).to.equal(1);
      expect(result.stderr).to.include('deprecated');
      expect(result.stderr).to.include('config repo-owner');
    });
  });
});
