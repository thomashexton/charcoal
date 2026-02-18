import { expect } from 'chai';
import { spawnSync } from 'child_process';
import path from 'path';
import { TrailingProdScene } from '../lib/scenes/trailing_prod_scene';
import { configureTest } from '../lib/utils/configure_test';
import { USER_CONFIG_OVERRIDE_ENV } from '../../src/lib/context';

const CLI_PATH = path.join(__dirname, '..', '..', 'src', 'index.js');

function runCliCommand(
  dir: string,
  userConfigPath: string,
  command: string[]
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

  it('deprecated branch commands show suggestion and exit with error', () => {
    scene.repo.createChange('a', 'a');
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'branch',
      'create',
      'test-branch',
      '-m',
      'test',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt create` instead');
  });

  it('deprecated stack commands show suggestion and exit with error', () => {
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'stack',
      'restack',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt restack --stack` instead');
  });

  it('deprecated upstack commands show suggestion and exit with error', () => {
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'upstack',
      'restack',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt restack --upstack` instead');
  });

  it('deprecated downstack commands show suggestion and exit with error', () => {
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'downstack',
      'restack',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt');
  });

  it('deprecated repo commands show suggestion and exit with error', () => {
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'repo',
      'init',
      '--trunk',
      'main',
      '--no-interactive',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt init` instead');
  });

  it('deprecated repo config commands show suggestion and exit with error', () => {
    const result = runCliCommand(scene.repo.dir, scene.repo.userConfigPath, [
      'repo',
      'owner',
    ]);
    expect(result.status).to.equal(1);
    expect(result.stdout).to.include('Run `gt config repo-owner` instead');
  });
});
