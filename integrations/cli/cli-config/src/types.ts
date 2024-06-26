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
   * Provide an array of css selectors and we will wait for it before capturing the screenshot.
   * Unlike `selector`, we won't only capture this selector. We just wait for it.
   * `waitForSelectors` is waited for before `selector`.
   */
  waitForSelectors?: string[];
  /**
   * Provide a css selector and we wait for it and only capture the screenshot of the element.
   * `waitForSelectors` is waited for before `selector`.
   */
  selector?: string;

  /**
   * The time in milliseconds to wait before capturing the screenshot.
   * We recommend using `waitForSelectors` or `selector` instead of `wait` as it's more reliable.
   */
  wait?: number;

  /**
   * A list of css selectors that you want to mask.
   * We will mask these elements with the color defined in the config.
   */
  maskSelectors?: string[];

  /**
   * Mask color for this snapshot.
   * This will override the mask color defined in the config.
   */
  maskColor?: string;

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

  /**
   * The scaling for the screenshot.
   * When set to "css", screenshot will have a single pixel per each css pixel on the page. For high-dpi devices, this will keep screenshots small. Using "device" option will produce a single pixel per each device pixel, so screenshots of high-dpi devices will be twice as large or even larger.
   *
   * @default "device"
   */
  scale?: "device" | "css";
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
   * Defines how many browser pages we run at the same time.
   * This can be useful if you have a more powerful machine and want to speed up the process.
   * @default 6
   */
  boothConcurrency?: number;

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

  /**
   * The scaling for the screenshot.
   * When set to "css", screenshot will have a single pixel per each css pixel on the page. For high-dpi devices, this will keep screenshots small. Using "device" option will produce a single pixel per each device pixel, so screenshots of high-dpi devices will be twice as large or even larger.
   *
   * You can override this on a per snapshot basis.
   *
   * @default "device"
   */
  scale?: "device" | "css";
};

export type ConfigWithoutSnapshotFiles = Omit<Config, "snapshotFiles">;
