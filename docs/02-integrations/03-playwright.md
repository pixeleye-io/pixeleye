---
title: Playwright Integration
description: How to integrate Playwright into Pixeleye and begin visually testing your website. Get setup in minutes with this guide.
---

# Playwright Integration

[Playwright](https://playwright.dev) is a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. Playwright & Pixeleye integrate seamlessly together.

## Quick start

### Installation

We require the Pixeleye cli tool and Playwright tool

{% tabs %}

{% tab label="NPM" %}

```bash
npm install pixeleye @pixeleye/playwright --save-dev
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn add pixeleye @pixeleye/playwright --dev
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm add pixeleye @pixeleye/playwright --save-dev
```

{% /tab %}

{% /tabs %}

### Get a project token

You can get a project token from the Pixeleye dashboard. You will need this to authenticate your project with Pixeleye.

See [Getting Started](/docs/01-getting-started/02-setup.md) for more information.

### Create a pixeleye.config.{js,ts} file

{% tabs %}

{% tab label="TypeScript" %}

```pixeleye.config.ts
import { Config } from "pixeleye";

const config: Config = {
  token: "YOUR_PROJECT_TOKEN",
  // or
  // token: process.env.PIXELEYE_PROJECT_TOKEN!,
  // ...
};

export default config;
```

{% /tab %}

{% tab label="JavaScript" %}

```pixeleye.config.js
/** @type {import('pixeleye').Config} */
const config = {
  token: "YOUR_PROJECT_TOKEN",
  // or
  // token: process.env.PIXELEYE_PROJECT_TOKEN,
  // ...
};

export default config;
```

{% /tab %}

{% /tabs %}

### Adding to your tests

```some.spec.ts
import { pixeleyeSnapshot } from "@pixeleye/playwright";

test("Some test", async ({ page }) => {
  // ...
  await pixeleyeSnapshot(page, {
    name: "button",
  });
  // ...
});
```

### Running the Pixeleye CLI

{% tabs %}

{% tab label="NPM" %}

```bash
npm run pixeleye exec -- <your test command>
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn pixeleye exec -- <your test command>
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm pixeleye exec -- <your test command>
```

{% /tab %}

{% /tabs %}

## API Reference

### `fn pixeleyeSnapshot(page, options)`

Captures a snapshot of the current page.

#### Page

- **Type:** `Page`

The page to capture the snapshot on.

#### Options - name (required)

- **Type:** `string`

The name of the snapshot. This helps us identity which snapshots to compare with as well as giving a nice name in our dashboard.

#### Options - variant

- **Type:** `string`
- **Default:** `undefined`

The variant of the snapshot. It's up to you how you use this, but it's useful for capturing different states of the same component. E.g., a collection of snapshots with the name `button` could have variants of `primary`, `secondary`, etc.

#### Options - fullPage

- **Type:** `boolean`
- **Default:** `false`

Whether to capture the full page. If set to `true`, the entire page will be captured. If set to `false`, only the current viewport will be captured.

#### Options - selector

- **Type:** `string`
- **Default:** `undefined`

The selector of the element to capture. If set, only the element matching the selector will be captured. If not set, the entire page will be captured.

#### Options - waitForSelectors

- **Type:** `string[]`
- **Default:** `[]`

The selectors to wait for before capturing the snapshot. If set, we will wait for all the selectors to appear before capturing the snapshot. If not set, we will not wait for any selectors. This doesn't effect the `selector` option.

#### Options - devices

- **Type:** `DeviceDescriptor[]`
- **Default:** `Defined in pixeleye.config.ts`

The devices to capture the snapshot on. If set, the snapshot will be captured on each device. If not set, the snapshot will be captured on the current viewport.

This will override the `devices` option set in `pixeleye.config.ts`.

#### Options - waitForStatus

- **Type:** `boolean`
- **Default:** `false`

If set to `true`, we will wait for the build to finish processing and return the status of the build to stdout.
This is useful for CI/CD environments where you want to capture the status of the build.

#### Options - maskSelectors

- **Type:** `string[]`
- **Default:** `[]`

The selectors to mask. If set, the selectors will be masked with the color defined in `maskColor`. If not set, no selectors will be masked.

#### Options - maskColor

- **Type:** `string`
- **Default:** `#FF00FF (pink)`

The color to mask the selectors with. This can be any valid CSS color. We recommend using a color that is not used anywhere else on the page.

#### Options - css

- **Type:** `string`
- **Default:** `undefined`

The CSS to inject into the page. This can be used to hide elements that you don't want to capture. For example, you may want to hide a cookie banner that appears on the page.

This css is append to the css defined in `pixeleye.config.ts`. Anything which needs overriding there should be overridden via css here.
