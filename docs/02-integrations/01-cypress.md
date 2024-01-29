---
title: Cypress Integration
description: How to integrate Cypress into Pixeleye and begin visually testing your website. Get setup in minutes with this guide.
---

# Cypress Integration

[Cypress](https://cypress.io) is a JavaScript End to End Testing Framework. It is a great tool for testing your website and Pixeleye integrates seamlessly with it.

## Quick start

### Installation

We require the Pixeleye cli tool and Cypress tool

```bash
npm install pixeleye @pixeleye/cypress
```

### Get a project token

You can get a project token from the Pixeleye dashboard. You will need this to authenticate your project with Pixeleye.

See [Getting Started](/docs/01-getting-started/02-setup.md) for more information.

### Create a `pixeleye.config.{js,ts}` file

```ts
import { Config } from "pixeleye";

const config: Config = {
  projectToken: "YOUR_PROJECT_TOKEN",
  // ...
};
```

### Adding to your tests

export default config;

```ts
import { pixeleyeSnapshot } from "@pixeleye/cypress";

// ...

await pixeleyeSnapshot(app.page, {
  name: "landing-header",
});

// ...
```

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
