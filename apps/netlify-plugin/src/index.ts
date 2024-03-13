// Documentation: https://sdk.netlify.com
import { NetlifyIntegration, z } from "@netlify/sdk";
import { snapshotHandler } from "pixeleye";
import { loadConfig } from "@pixeleye/cli-config";

const buildConfigSchema = z.object({
  configPath: z.string().optional(),
});

const integration = new NetlifyIntegration({ buildConfigSchema });

integration.onEnable(async (_, { teamId, siteId, client }) => {
  // Build event handlers are disabled by default, so we need to
  // enable them when the integration is enabled.

  siteId && (await client.enableBuildEventHandlers(siteId));

  return {
    statusCode: 200,
  };
});

integration.addBuildEventHandler(
  "onPreBuild",
  async ({ utils: { build, status, cache, run, git }, buildConfig }) => {
    const config = await loadConfig(buildConfig?.configPath);

    await snapshotHandler([], config);
  }
);

export { integration };
