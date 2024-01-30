---
title: Storybook Integration
description: How to integrate Storybook into Pixeleye and begin visually testing your website. Get setup in minutes with this guide.
---

# Storybook Integration

[Storybook](https://storybook.js.org) is a JavaScript UI Component Development Environment. It is a great tool for testing your website and Pixeleye integrates seamlessly with it.

## Quick start

### Installation

We require the Pixeleye cli tool:

```bash
npm install pixeleye
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

export default config;
```

### Running the Pixeleye CLI

We recommend adding the following to your `package.json` file:

```json
{
  "scripts": {
    "pixeleye": "pixeleye storybook --url http://localhost:6006"
  }
}
```

You should run this command in your ci/cd pipeline.

## Dark/Light, Mobile/Desktop, and more

We support capturing multiple variants of your components. As long as there's a url parameter for it, we can capture it.

#### Dark/Light mode example

Using the official storybook theme addon

```js
  storybookOptions: {
    variants: [
      {
        name: "Dark",
        params: "globals=theme:dark",
      },
      {
        name: "Light",
        params: "globals=theme:light",
      },
    ],
  }
```