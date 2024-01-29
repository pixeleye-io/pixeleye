---
title: Puppeteer Integration
description: How to integrate Puppeteer into Pixeleye and begin visually testing your website. Get setup in minutes with this guide.
---

# Puppeteer Integration

[Puppeteer](https://pptr.dev) is a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. Puppeteer & Pixeleye integrate seamlessly together.

## Quick start

### Installation

We require the Pixeleye cli tool and Puppeteer tool

```bash
npm install pixeleye @pixeleye/puppeteer
```

### Get a project token

You can get a project token from the Pixeleye dashboard. You will need this to authenticate your project with Pixeleye.

See [Getting Started](/docs/01-getting-started/02-setup.md) for more information.

### Create a `pixeleye.config.{js,ts}` file

````ts
import { Config } from "pixeleye";

const config: Config = {
  projectToken: "YOUR_PROJECT_TOKEN",
  // ...
};

### Adding to your tests

export default config;
```ts
import { pixeleyeSnapshot } from "@pixeleye/puppeteer";


// ...

    await pixeleyeSnapshot(app.page, {
        name: "landing-header",
        selector: "header.sticky",
    });

// ...

````

## Options

| Options         | Type               | Default   | Description                             |
| --------------- | ------------------ | --------- | --------------------------------------- |
| name (required) | string             | N/A       | The name of the snapshot.               |
| variant         | string             | undefined | The variant of the snapshot.            |
| fullPage        | boolean            | false     | Whether to capture the full page.       |
| selector        | string             | undefined | The selector of the element to capture. |
| devices         | DeviceDescriptor[] | []        | The devices to capture the snapshot on. |
| maskSelectors   | string[]           | []        | The selectors to mask.                  |
| maskColor       | string             | pink      | The color to mask the selectors with.   |
| css             | string             | undefined | The CSS to inject into the page.        |
