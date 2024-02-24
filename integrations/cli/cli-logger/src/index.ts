export function debugLog(message?: any, ...optionalParams: any[]) {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.PIXELEYE_VERBOSE === "true")
    console.log(message, ...optionalParams);
}
