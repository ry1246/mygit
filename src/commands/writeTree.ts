import { readdirSync, readFileSync, statSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";

type TreeEntry = { mode: string; name: string; hash: Buffer };

function writeObject(type: "blob" | "tree", content: Buffer): Buffer {
  const header = Buffer.from(`${type} ${content.length}\0`);
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

function writeTreeForDir(dirPath: string): Buffer {
  const names = readdirSync(dirPath).filter(
    name => name !== ".git" && name !== ".gitignore"
  );

  const entries: TreeEntry[] = names.map(name => {
    const fullPath = join(dirPath, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return { mode: "40000", name, hash: writeTreeForDir(fullPath) };
    }

    const content = readFileSync(fullPath);
    const isExecutable = (stat.mode & 0o111) !== 0;
    return {
      mode: isExecutable ? "100755" : "100644",
      name,
      hash: writeObject("blob", content),
    };
  });

  entries.sort((a, b) => {
    const aKey = a.mode === "40000" ? `${a.name}/` : a.name;
    const bKey = b.mode === "40000" ? `${b.name}/` : b.name;
    return aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
  });

  const content = Buffer.concat(
    entries.map(e =>
      Buffer.concat([Buffer.from(`${e.mode} ${e.name}\0`), e.hash])
    )
  );

  return writeObject("tree", content);
}

export function writeTree(): void {
  const hash = writeTreeForDir(process.cwd());
  console.log(hash.toString("hex"));
}
