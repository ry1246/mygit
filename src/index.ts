import { init } from "./commands/init.js";

const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    init();
    break;
  default:
    console.error(`unknown command: ${command}`);
  process.exit(1);
}
