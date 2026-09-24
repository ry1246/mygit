import { createHash } from "node:crypto";
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

function formatTimezoneOffset(offsetMinutes: number): string {
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const minutes = String(abs % 60).padStart(2, "0");
  return `${sign}${hours}${minutes}`;
}

function buildIndentityLine(): string {
  const name = process.env.GIT_AUTHOR_NAME ?? "mygit";
  const email = process.env.GIT_AUTHOR_EMAIL ?? "mygit@example.com";
  const timestamp = Math.floor(Date.now() / 1000);
  const timezone = formatTimezoneOffset(new Date().getTimezoneOffset());
  return `${name} <${email}> ${timestamp} ${timezone}`;
}

function writeObject(content: Buffer): Buffer {
  const header = Buffer.from(`commit ${content.length}\0`);
  const store = Buffer.concat([header, content]);
  const hash = createHash("sha1").update(store).digest();

  const hex = hash.toString("hex");
  const dir = join(process.cwd(), ".git", "objects", hex.slice(0, 2));
  const objectPath = join(dir, hex.slice(2));
  if (!existsSync(objectPath)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(objectPath, deflateSync(store));
  }

  return hash;
}

export function commitTree(args: string[]): void {
  const treeHash = args[0];
  const parents: string[] = [];
  let message: string | undefined;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "-p") {
      const parent = args[++i];
      if (!parent) {
        console.error("mygit commitTree: -p の後ろにハッシュ値が必要");
        process.exit(1);
      }
      parents.push(parent);
    } else if (args[i] === "-m") {
      const msg = args[++i];
      if (msg === undefined) {
        console.error("mygit commitTree: -m の後ろにメッセージが必要");
        process.exit(1);
      }
      message = msg;
    }
  }

  if (!treeHash || message === undefined) {
    console.error("usage: mygit commitTree <tree-hash> [-p <parent-hash>...] -m <message>");
    process.exit(1);
  }

  const identity = buildIndentityLine();
  const lines = [
    `tree ${treeHash}`,
    ...parents.map(p => `parent ${p}`),
      `author ${identity}`,
    `committer ${identity}`,
    "",
    message,
    "",
  ];

  const hash = writeObject(Buffer.from(lines.join("\n")));
  console.log(hash.toString("hex"));
}
