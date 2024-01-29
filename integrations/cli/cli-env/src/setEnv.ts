export function setEnv(name: string, value: string) {
  process.env[name] = value;
  // Cypress will read this variables https://docs.cypress.io/guides/guides/environment-variables#Option-3-CYPRESS_
  process.env[`CYPRESS_${name}`] = value;
}
