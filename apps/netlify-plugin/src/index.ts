// Documentation: https://sdk.netlify.com
import { NetlifyIntegration } from "@netlify/sdk";

const integration = new NetlifyIntegration();

integration.onEnable(async (_, { teamId, siteId, client }) => {
  // Build event handlers are disabled by default, so we need to
  // enable them when the integration is enabled.

  siteId && (await client.enableBuildEventHandlers(siteId));

  return {
    statusCode: 200,
  };
});

integration.addBuildEventHandler("onPreBuild", () => {
  console.log("Hello there.");
});

export { integration };
