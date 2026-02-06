import * as fs from 'fs';
import * as path from 'path';
import { runGitCommand } from '../git/runner';

/**
 * Operation log for tracking what operations were performed (used by `gt undo --list`).
 * This module only LOGS operations - it does NOT implement actual undo/reversal logic.
 * Full state restoration would require additional implementation.
 */

export type OperationType =
  | 'create'
  | 'delete'
  | 'rename'
  | 'move'
  | 'fold'
  | 'split'
  | 'modify'
  | 'restack';

export interface Operation {
  id: string;
  timestamp: number;
  type: OperationType;
  branchName: string;
  data: Record<string, unknown>;
}

function getOperationLogPath(): string {
  const gitDir = runGitCommand({
    args: ['rev-parse', '--git-dir'],
    onError: 'throw',
    resource: 'getOperationLogPath',
  }).trim();
  const charcoalDir = path.join(gitDir, 'charcoal');
  if (!fs.existsSync(charcoalDir)) {
    fs.mkdirSync(charcoalDir, { recursive: true });
  }
  return path.join(charcoalDir, 'operations.json');
}

function readOperations(): Operation[] {
  const logPath = getOperationLogPath();
  if (!fs.existsSync(logPath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(logPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeOperations(operations: Operation[]): void {
  const logPath = getOperationLogPath();
  fs.writeFileSync(logPath, JSON.stringify(operations, null, 2));
}

export function logOperation(op: Omit<Operation, 'id' | 'timestamp'>): void {
  const operations = readOperations();
  const newOp: Operation = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
  };
  operations.push(newOp);
  // Keep only last 100 operations
  const trimmed = operations.slice(-100);
  writeOperations(trimmed);
}

export function getRecentOperations(n = 10): Operation[] {
  const operations = readOperations();
  return operations.slice(-n).reverse();
}

export function popLastOperation(): Operation | undefined {
  const operations = readOperations();
  const lastOp = operations.pop();
  if (lastOp) {
    writeOperations(operations);
  }
  return lastOp;
}

export function clearOperations(): void {
  writeOperations([]);
}
