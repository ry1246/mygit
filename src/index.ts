import { init } from "./commands/init.js";
import { hashObject } from "./commands/hashObject.js";
import { catFile } from "./commands/catFile.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    init();
    break;
  case "hashObject":
    hashObject(args);
    break;
  case "catFile":
    catFile(args);
    break;
  default:
    console.error(`unknown command: ${command}`);
  process.exit(1);
}
