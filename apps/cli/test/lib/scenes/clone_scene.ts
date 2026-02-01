import fs from 'fs-extra';
import tmp from 'tmp';
import { cuteString } from '../../../src/lib/utils/cute_string';
import { GitRepo } from '../../../src/lib/utils/git_repo';
import { AbstractScene } from './abstract_scene';

export class CloneScene extends AbstractScene {
  declare originTmpDir: tmp.DirResult;
  declare originDir: string;
  originRepo!: GitRepo;
  private cloneTmpDir!: tmp.DirResult;
  private bareOriginTmpDir: tmp.DirResult | undefined;
  private bareOriginDir: string | undefined;

  public toString(): string {
    return 'CloneScene';
  }

  public setup(): void {
    super.setup();
    this.repo.createChangeAndCommit('1', '1');

    // Store the bare origin created by AbstractScene so we can clean it up
    this.bareOriginTmpDir = this.originTmpDir;
    this.bareOriginDir = this.originDir;

    // The original working repo becomes the origin for the clone
    [this.originDir, this.originRepo, this.originTmpDir] = [
      this.dir,
      this.repo,
      this.tmpDir,
    ];

    this.cloneTmpDir = tmp.dirSync();
    this.dir = this.cloneTmpDir.name;
    this.repo = new GitRepo(this.dir, { repoUrl: this.originDir });
    fs.writeFileSync(
      `${this.dir}/.git/.graphite_repo_config`,
      cuteString({ trunk: 'main' })
    );
    fs.writeFileSync(`${this.dir}/.git/.graphite_user_config`, cuteString({}));

    process.chdir(this.dir);
  }

  public cleanup(): void {
    process.chdir(this.oldDir);
    if (!process.env.DEBUG) {
      fs.emptyDirSync(this.originDir);
      fs.emptyDirSync(this.dir);
      this.cloneTmpDir.removeCallback();
      this.originTmpDir.removeCallback();
      // Clean up the bare origin that AbstractScene created
      if (this.bareOriginDir && this.bareOriginTmpDir) {
        fs.emptyDirSync(this.bareOriginDir);
        this.bareOriginTmpDir.removeCallback();
      }
    }
  }
}
