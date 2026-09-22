import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

export function catFile(args: string[]): void {
  const pretty = args.includes("-p");
  const hash = args.find(a => a !== "-p");

  if (!pretty || !hash) {
    console.error("usage: mygit catFile -p <hash>");
    process.exit(1);
  }

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
  const content = store.subarray(nullIndex + 1);

  process.stdout.write(content);
}
