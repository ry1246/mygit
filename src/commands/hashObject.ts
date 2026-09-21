import { readFileSync, mkdirSync, existsSync, writeSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

export function hashObject(args: string[]): void {
  const write = args.includes("-w");
  const filePath = args.find(a => a !== "-w");

  if (!filePath) {
    console.error("usage: mygit hashObject [-w] <file>");
    process.exit(1);
  }

  const content = readFileSync(filePath);
  const header = Buffer.from(`blob ${content.length}\0`);
  const store = Buffer.concat([header, content]);

  const hash = createHash("sha1").update(store).digest("hex");

  if (write) {
    const dir = join(process.cwd(), ".git", "objects", hash.slice(0, 2));
    const objectPath = join(dir, hash.slice(2));
    if (!existsSync(objectPath)) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(objectPath, deflateSync(store));
    }
  }

  console.log(hash);
}
