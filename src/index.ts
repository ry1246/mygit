import { init } from "./commands/init.js";
import { hashObject } from "./commands/hashObject.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    init();
    break;
  case "hashObject":
    hashObject(args);
    break;
  default:
    console.error(`unknown command: ${command}`);
  process.exit(1);
}
