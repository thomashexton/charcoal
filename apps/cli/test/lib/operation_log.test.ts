import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import tmp from 'tmp';
import {
  logOperation,
  getRecentOperations,
  popLastOperation,
  clearOperations,
} from '../../src/lib/engine/operation_log';

describe('operation_log', function () {
  this.timeout(60000);

  let tmpDir: tmp.DirResult;
  let oldDir: string;

  beforeEach(function () {
    oldDir = process.cwd();
    tmpDir = tmp.dirSync();
    spawnSync('git', ['init', tmpDir.name, '-b', 'main']);
    process.chdir(tmpDir.name);
    clearOperations();
  });

  afterEach(function () {
    process.chdir(oldDir);
    if (!process.env.DEBUG) {
      fs.rmSync(tmpDir.name, { recursive: true, force: true });
    }
  });

  it('logOperation adds an operation to the log', function () {
    logOperation({
      type: 'create',
      branchName: 'test-branch',
      data: { parent: 'main' },
    });

    const ops = getRecentOperations(10);
    expect(ops).to.have.length(1);
    expect(ops[0].type).to.equal('create');
    expect(ops[0].branchName).to.equal('test-branch');
    expect(ops[0].data).to.deep.equal({ parent: 'main' });
  });

  it('getRecentOperations returns operations in reverse chronological order', function () {
    logOperation({ type: 'create', branchName: 'branch-1', data: {} });
    logOperation({ type: 'create', branchName: 'branch-2', data: {} });
    logOperation({ type: 'create', branchName: 'branch-3', data: {} });

    const ops = getRecentOperations(10);
    expect(ops).to.have.length(3);
    expect(ops[0].branchName).to.equal('branch-3'); // Most recent first
    expect(ops[2].branchName).to.equal('branch-1'); // Oldest last
  });

  it('popLastOperation removes and returns the last operation', function () {
    logOperation({ type: 'create', branchName: 'branch-1', data: {} });
    logOperation({ type: 'delete', branchName: 'branch-2', data: {} });

    const popped = popLastOperation();
    expect(popped?.type).to.equal('delete');
    expect(popped?.branchName).to.equal('branch-2');

    const remaining = getRecentOperations(10);
    expect(remaining).to.have.length(1);
    expect(remaining[0].branchName).to.equal('branch-1');
  });

  it('popLastOperation returns undefined when log is empty', function () {
    const popped = popLastOperation();
    expect(popped).to.be.undefined;
  });

  it('clearOperations removes all operations', function () {
    logOperation({ type: 'create', branchName: 'test', data: {} });
    clearOperations();

    const ops = getRecentOperations(10);
    expect(ops).to.have.length(0);
  });

  it('log is capped at 100 operations', function () {
    for (let i = 0; i < 110; i++) {
      logOperation({ type: 'create', branchName: `branch-${i}`, data: {} });
    }

    const ops = getRecentOperations(200);
    expect(ops).to.have.length(100);
    // Should have kept the most recent 100 (10-109)
    expect(ops[0].branchName).to.equal('branch-109');
    expect(ops[99].branchName).to.equal('branch-10');
  });

  it('operations include id and timestamp', function () {
    logOperation({ type: 'create', branchName: 'test', data: {} });

    const ops = getRecentOperations(1);
    expect(ops[0].id).to.be.a('string');
    expect(ops[0].id).to.match(/^op-/);
    expect(ops[0].timestamp).to.be.a('number');
    expect(ops[0].timestamp).to.be.closeTo(Date.now(), 5000);
  });

  it('stores operations persistently in .git/charcoal/operations.json', function () {
    logOperation({ type: 'create', branchName: 'test', data: {} });

    const opsPath = path.join(tmpDir.name, '.git', 'charcoal', 'operations.json');
    expect(fs.existsSync(opsPath)).to.be.true;

    const content = JSON.parse(fs.readFileSync(opsPath, 'utf-8'));
    expect(content).to.have.length(1);
    expect(content[0].branchName).to.equal('test');
  });

  it('handles all operation types', function () {
    const types = [
      'create',
      'delete',
      'rename',
      'move',
      'fold',
      'split',
      'modify',
      'restack',
    ] as const;

    types.forEach((type) => {
      logOperation({ type, branchName: `${type}-branch`, data: {} });
    });

    const ops = getRecentOperations(10);
    expect(ops).to.have.length(8);
    expect(ops.map((o) => o.type)).to.have.members([...types]);
  });
});
