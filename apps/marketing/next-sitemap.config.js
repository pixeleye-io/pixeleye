/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  siteUrl: process.env.SITE_URL || "https://pixeleye.io",
  generateRobotsTxt: true,
};
