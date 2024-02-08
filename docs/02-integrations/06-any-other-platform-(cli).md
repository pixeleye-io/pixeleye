---
title: Any other platform
description: How to integrate any website into Pixeleye. With our CLI you can effortlessly fit visual testing into your workflow.
---

# Any other platform

Don't see your platform listed? No problem! We have a CLI tool which offers multiple other ways to integrate Pixeleye into your workflow.

Our CLI supports the following methods:

- **directory upload** - Upload a directory of images to Pixeleye, e.g. screenshots from your e2e tests
- **storybook** - Run a Storybook server and upload the stories to Pixeleye
- **exec** - Run a command and upload the output to Pixeleye

## Installing the CLI

{% tabs %}

{% tab label="NPM" %}

```bash
npm install pixeleye --save-dev
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn add pixeleye --dev
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm add pixeleye --save-dev
```

{% /tab %}

{% /tabs %}

## Get a project token

You can get a project token from the Pixeleye dashboard. You will need this to authenticate your project with Pixeleye.

See [Getting Started](/docs/01-getting-started/02-setup.md) for more information.

## Create a pixeleye.config.{js,ts} file

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
/** @type {import('pixeleye').Config} */
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

## Upload a directory of images

Most e2e frameworks include their own screenshot functionality. You can use this to take screenshots of your application and upload them to Pixeleye.

We only support PNG images at the moment.

### Run the CLI

```bash
pixeleye upload ./path/to/screenshots
```

### Snapshot metadata

By naming your screenshots with the format `{name}--{variant}.png` you can add metadata to your snapshots.

You can escape the `--` by using `\-\-` in the name.

> Note: We don't currently support any other meta data like viewport size or device type.
