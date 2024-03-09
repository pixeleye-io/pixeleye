import { DeviceDescriptor } from "@pixeleye/cli-devices";

export type SnapshotDefinition = {
  /**
   * The URL that you want to capture a screenshot of.
   */
  url: string;
  /**
   * The name of the snapshot.
   * We default to the URL if no name is provided.
   */
  name?: string;
  /**
   * The variant of the snapshot.
   * This will make up part of the snapshots name.
   * @example "Dark"
   */
  variant?: string;
  /**
   * Provide a css selector and we will wait for it before capturing the screenshot.
   * Unlike `selector`, we won't only capture this selector. We just wait for it.
   * `waitForSelector` is waited for before `selector`.
   */
  waitForSelector?: string;
  /**
   * Provide a css selector and we wait for it and only capture the screenshot of the element.
   * `waitForSelector` is waited for before `selector`.
   */
  selector?: string;

  /**
   * A list of css selectors that you want to mask.
   * We will mask these elements with the color defined in the config.
   */
  maskSelectors?: string[];

  /**
   * Should we capture the full page? If true, we will capture the entire page.
   *
   * @default false
   */
  fullPage?: boolean;

  /**
   * The css that you want to inject into the page before capturing the screenshot.
   * This will be combined with the css defined in the config.
   * @example "body { background-color: red; }"
   */
  css?: string;
};

export type StorybookVariant = {
  /**
   * The name of the variant.
   * This will make up part of the snapshots name.
   * @example "Dark"
   */
  name: string;
  /**
   * Optional search params to append to the storybook URL when capturing the screenshot.
   * @example "?globals=theme:dark"
   */
  params?: string;
};

// Type definitions for pixeleye.config.[ts|js]
export type Config = {
  /**
   * Your Pixeleye Project Token.
   * Once you have created a project in the Pixeleye Dashboard, you'll receive a token.
   */
  token: string;

  /**
   * Only required if self-hosting Pixeleye.
   * The endpoint where the Pixeleye API is running.
   * @default https://api.pixeleye.io
   */
  endpoint?: string;

  /**
   * The port for which the Pixeleye booth will be running on.
   * Pixeleye booth is a local server that runs on your machine and is responsible for capturing the screenshots across different devices.
   * You should only change this if you have a conflict with another service running on the same port.
   * @default 3003
   */
  boothPort?: string;

  /**
   * The devices that you want to capture screenshots for.
   * Use our built-in devices object (import { devices } from "pixeleye") or pass your own custom devices.
   * @default [devices["Desktop Chrome"], devices["Desktop Firefox"], devices["Desktop Safari"], devices["Desktop Edge"]]
   */
  devices?: DeviceDescriptor[];

  /**
   * The color that you want to use for masking elements.
   * This can be overridden on a per snapshot basis.
   * @default "#FF00FF"
   */
  maskColor?: string;

  /**
   * The CSS that you want to inject into the page before capturing the screenshot.
   * This can be overridden on a per snapshot basis. However, css defined per snapshot will be combined with this css but with a higher specificity.
   * @example "body { background-color: red; }"
   */
  css?: string;

  /**
   * Wait for the build to finish processing before exiting.
   * We will output the status of the build once it has finished processing.
   *
   * @default false
   */
  waitForStatus?: boolean;

  /**
   * Storybook specific options.
   */
  storybookOptions?: {
    /**
     * An array of variants that you want to capture screenshots for.
     * @example [{ name: "Dark", params: "?globals=theme:dark" }, { name: "Light", params: "?globals=theme:light" }] // This will capture screenshots for both the dark and light theme if using storybooks theme addon.
     */
    variants: StorybookVariant[];
  };

  /**
   * An array of file matchers which contain snapshot definition files
   *
   * @example ['./snaps.pixeleye.ts', './src/*.pixeleye.ts']
   */
  snapshotFiles?:
    | string[]
    | ((config: ConfigWithoutSnapshotFiles) => Promise<string[]>);
};

export type ConfigWithoutSnapshotFiles = Omit<Config, "snapshotFiles">;
