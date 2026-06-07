import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const COVERAGE_REPORT_PATH = resolve("coverage/index.html");

function getOpenCommand(filePath) {
  if (process.platform === "win32") {
    return {
      command: "cmd",
      args: ["/c", "start", "", filePath],
    };
  }

  if (process.platform === "darwin") {
    return {
      command: "open",
      args: [filePath],
    };
  }

  return {
    command: "xdg-open",
    args: [filePath],
  };
}

if (!existsSync(COVERAGE_REPORT_PATH)) {
  console.error("Coverage report not found. Run npm run test:coverage first.");
  process.exitCode = 1;
} else {
  const { command, args } = getOpenCommand(COVERAGE_REPORT_PATH);

  execFile(command, args, { windowsHide: true }, (error) => {
    if (error) {
      console.error(`Unable to open coverage report: ${error.message}`);
      process.exitCode = 1;
    }
  });
}
