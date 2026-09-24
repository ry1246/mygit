import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

type TreeEntry = { mode: string; name: string; hash: Buffer };

function readObject(hash: string): Buffer {
  const objectPath = join(
    process.cwd(),
    ".git",
    "objects",
    hash.slice(0, 2),
    hash.slice(2)
  );

  const compressed = readFileSync(objectPath);
  const store = inflateSync(compressed);

  const nullIndex = store.indexOf(0);
  return store.subarray(nullIndex + 1);
}

function parseTreeEntries(content: Buffer): TreeEntry[] {
  const entries: TreeEntry[] = [];
  let offset = 0;

  while (offset < content.length) {
    const spaceIndex = content.indexOf(0x20, offset);
    const mode = content.subarray(offset, spaceIndex).toString();

    const nullIndex = content.indexOf(0, spaceIndex);
    const name = content.subarray(spaceIndex + 1, nullIndex).toString();

    const hash = content.subarray(nullIndex + 1, nullIndex + 21);
    entries.push({ mode, name, hash });

    offset = nullIndex + 21;
  }

  return entries;
}

export function lsTree(args: string[]): void {
  const nameOnly = args.includes("--name-only");
  const hash = args.find(a => a !== "--name-only");

  if (!hash) {
    console.error("usage: mygit lsTree --name-only <Tree-hash>");
    process.exit(1);
  }

  const entries = parseTreeEntries(readObject(hash));

  for (const entry of entries) {
    if (nameOnly) {
      console.log(entry.name);
      continue;
    }
    const type = entry.mode === "40000" ? "tree" : "blob";
    console.log(`${entry.mode.padStart(6, "0")} ${type} ${entry.hash.toString("hex")}\t${entry.name}`);
  }
}
