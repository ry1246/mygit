const [, , command, ...args] = process.argv;

switch (command) {
  case "init":
    console.log("TODO: init");
    break;
  default:
    console.error(`unknown command: ${command}`);
  process.exit(1);
}
