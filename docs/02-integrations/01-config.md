---
title: Config
description: Options available in the Pixeleye config file
---

# Pixeleye.config.{js,ts}

This file can be used to configure Pixeleye. We default to looking at the root of a package (where the `package.json` is located) for this file.

This file should export a `Config` object. It can be a function that returns a `Config` object or a `Config` object itself.

{% tabs %}

{% tab label="TypeScript" %}

```pixeleye.config.ts
import { Config } from "pixeleye";

const config: Config = {
  projectToken: "YOUR_PROJECT_TOKEN",
  // or
  // projectToken: process.env.PIXELEYE_PROJECT_TOKEN,
  // ...
};

export default config;
```

{% /tab %}

{% tab label="JavaScript" %}

```pixeleye.config.js
const config = {
  projectToken: "YOUR_PROJECT_TOKEN",
  // or
  // projectToken: process.env.PIXELEYE_PROJECT_TOKEN,
  // ...
};

export default config;
```

{% /tab %}

{% /tabs %}

## Options

### token

- **Type:** `string`
- **Default:** `undefined`

The project token is used to authenticate your project with Pixeleye. You can get a project token from the Pixeleye dashboard.
You set it to an environment variable such as process.env.PIXELEYE_PROJECT_TOKEN if you want to keep it out of your codebase.

### endpoint

- **Type:** `string`
- **Default:** `https://api.pixeleye.io`

The endpoint where the Pixeleye API is running. This is only required if you are self-hosting Pixeleye.

### boothPort

- **Type:** `string`
- **Default:** `3003`

The port for which the Pixeleye booth will be running on. Pixeleye booth is a local server that runs on your machine and is responsible for capturing the screenshots across different devices. You should only change this if you have a conflict with another service running on the same port.

### devices

- **Type:** `DeviceDescriptor[]`
- **Default:** `[devices["Desktop Chrome"], devices["Desktop Firefox"], devices["Desktop Safari"], devices["Desktop Edge"]]`

The devices that you want to capture screenshots for. Use our built-in devices object (import { devices } from "pixeleye") or pass your own custom devices.

### maskColor

- **Type:** `string`
- **Default:** `#FF00FF (pink)`

The color that you want to use for masking elements. This can be overridden on a per snapshot basis.

### css

- **Type:** `string`
- **Default:** `undefined`

The CSS that you want to inject into the page before capturing the screenshot. This can be overridden on a per snapshot basis. However, css defined per snapshot will be combined with this css but with a higher specificity.

### waitForStatus

- **Type:** `boolean`
- **Default:** `false`

Wait for the build to finish processing before exiting. We will output the status of the build once it has finished processing.

### storybookOptions

- **Type:** `object`
- **Default:** `undefined`

Storybook specific options.

### storybookOptions.variants

- **Type:** `StorybookVariant[]`
- **Default:** `undefined`

An array of variants that you want to capture screenshots for.

## StorybookVariant

### name

- **Type:** `string`
- **Default:** `undefined`

The name of the variant. This will make up part of the snapshots name.

### params

- **Type:** `string`
- **Default:** `undefined`

Optional search params to append to the storybook URL when capturing the screenshot.

#### Example

`[{ name: "Dark", params: "?globals=theme:dark" }, { name: "Light", params: "?globals=theme:light" }]`

This will capture screenshots for both the dark and light theme if using storybooks theme addon.
