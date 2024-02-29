export type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "http"
  | "verbose"
  | "debug"
  | "silly";

export function getLogLevel(): LogLevel {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  return (process.env.PIXELEYE_LOG_LEVEL as LogLevel) || "info";
}

export const levels: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

export function setLogLevel(level: LogLevel) {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.PIXELEYE_LOG_LEVEL = level;
}

function shouldLog(level: LogLevel) {
  return levels[level] <= levels[getLogLevel()];
}

function error(message: any, ...optionalParams: any[]) {
  if (shouldLog("error")) console.error(message, ...optionalParams);
}

function warn(message: any, ...optionalParams: any[]) {
  if (shouldLog("warn")) console.warn(message, ...optionalParams);
}

function info(message: any, ...optionalParams: any[]) {
  if (shouldLog("info")) console.info(message, ...optionalParams);
}

function http(message: any, ...optionalParams: any[]) {
  if (shouldLog("http")) console.log(message, ...optionalParams);
}

function verbose(message: any, ...optionalParams: any[]) {
  if (shouldLog("verbose")) console.log(message, ...optionalParams);
}

function debug(message: any, ...optionalParams: any[]) {
  if (shouldLog("debug")) console.log(message, ...optionalParams);
}

function silly(message: any, ...optionalParams: any[]) {
  if (shouldLog("silly")) console.log(message, ...optionalParams);
}

export const logger = {
  error,
  warn,
  info,
  http,
  verbose,
  debug,
  silly,
};
