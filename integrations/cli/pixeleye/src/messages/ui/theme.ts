import chalk from "chalk";
import dedent from "dedent";

export function errMsg(strings: TemplateStringsArray, ...args: any[]) {
  const str = strings.reduce(
    (acc, curr, i) => acc + curr + (args[i] || ""),
    ""
  );
  return dedent(chalk.bold.red(str));
}

export function errStr(str: string | object) {
  try {
    const json = JSON.stringify(str, null, 2);
    return chalk.bold.red(json);
  } catch {
    return chalk.bold.red(str);
  }
}

export function warnMsg(strings: TemplateStringsArray, ...args: any[]) {
  const str = strings.reduce(
    (acc, curr, i) => acc + curr + (args[i] || ""),
    ""
  );
  return dedent(chalk.hex("FFA500")(str));
}

export function infoMsg(strings: TemplateStringsArray, ...args: any[]) {
  const str = strings.reduce(
    (acc, curr, i) => acc + curr + (args[i] || ""),
    ""
  );
  return dedent(chalk.hex("00BFFF")(str));
}

export function infoPrefix(prefix: string, content: string) {
  return chalk.hex("00BFFF")(prefix) + chalk.white(content);
}
