import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function init(): void {
  const gitDir = join(process.cwd(), ".git");
  const alreadyExists = existsSync(gitDir);

  mkdirSync(join(gitDir, "objects"), { recursive: true });
  mkdirSync(join(gitDir, "refs"), { recursive: true });
  writeFileSync(join(gitDir, "HEAD"), "ref: refs/heads/main\n");

  console.log(
    alreadyExists
      ? `Reinitialized existing Git repository in ${gitDir}/`
      : `Initialized empty Git repository in ${gitDir}/`,
  );
}
