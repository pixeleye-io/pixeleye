import chalk from "chalk";
import dedent from "dedent";

export function errMsg(strings: TemplateStringsArray, ...args: any[]) {
  const str = strings.reduce(
    (acc, curr, i) => acc + curr + (args[i] || ""),
    ""
  );
  return dedent(chalk.bold.red(str));
}

export function warnMsg(strings: TemplateStringsArray, ...args: any[]) {
  const str = strings.reduce(
    (acc, curr, i) => acc + curr + (args[i] || ""),
    ""
  );
  return dedent(chalk.hex("FFA500")(str));
}
