import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectRoot = join(import.meta.dirname, "..");
const TSX_BIN = join(projectRoot, "node_modules", ".bin", "tsx");
const CLI_ENTRY = join(import.meta.dirname, "index.ts");

function mygit(args: string[], cwd: string): string {
  return execFileSync(TSX_BIN, [CLI_ENTRY, ...args], { cwd, encoding: "utf8" });
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function withTempRepo(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "mygit-test"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("mygit hashObject -w で作ったblobを本物のgitが読める", () => {
  withTempRepo(dir => {
    mygit(["init"], dir);
    writeFileSync(join(dir, "hello.txt"), "hello mygit\n");

    const hash = mygit(["hashObject", "-w", "hello.txt"], dir).trim();

    assert.equal(git(["cat-file", "-p", hash], dir), "hello mygit\n");
    assert.equal(git(["cat-file", "-t", hash], dir).trim(), "blob");
  });
});

test("本物のgit hash-object -w で作ったblobをmygit catFileが読める", () => {
  withTempRepo(dir => {
    git(["init", "-q"], dir);
    writeFileSync(join(dir, "world.txt"), "hello real git\n");

    const hash = git(["hash-object", "-w", "world.txt"], dir).trim();

    const content = mygit(["catFile", "-p", hash], dir);
    assert.equal(content, "hello real git\n");
  });
});

test("mygit writeTree で作ったtreeお本物のgit ls-treeが読める", () => {
  withTempRepo(dir => {
    mygit(["init"], dir);
    writeFileSync(join(dir, "a.txt"), "a\n");
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "sub", "b.txt"), "b\n");

    const treeHash = mygit(["writeTree"], dir).trim();

    const nameFromGit = git(["ls-tree", "--name-only", "-r", treeHash], dir)
      .trim()
      .split("\n")
      .sort();
    assert.deepEqual(nameFromGit, ["a.txt", "sub/b.txt"]);
  });
});

test("init → hashObject → writeTree → commitTree の一連を本物のgit log で確認できる", () => {
  withTempRepo(dir => {
    mygit(["init"], dir);
    writeFileSync(join(dir, "README.md"), "# mygit\n");

    mygit(["hashObject", "-w", "README.md"], dir);
    const treeHash = mygit(["writeTree"], dir).trim();
    const commitHash = mygit(
      ["commitTree", treeHash, "-m", "first commit"],
      dir
    ).trim();

    git(["update-ref", "refs/heads/main", commitHash], dir);

    const log = git(["log", "--oneline", "--format=%H %s"], dir).trim();
    assert.equal(log, `${commitHash} first commit`);

    const treeFromCommit = git(["cat-file", "-p", commitHash], dir);
    assert.match(treeFromCommit, new RegExp(`^tree ${treeHash}`));
  });
});

