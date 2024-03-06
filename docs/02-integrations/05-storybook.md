---
title: Storybook Integration
description: How to integrate Storybook into Pixeleye and begin visually testing your website. Get setup in minutes with this guide.
---

# Storybook Integration

[Storybook](https://storybook.js.org) is a JavaScript UI Component Development Environment. It is a great tool for testing your website and Pixeleye integrates seamlessly with it.

## Quick start

### Installation

We require the Pixeleye cli tool:

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

### Running the Pixeleye CLI

{% tabs %}

{% tab label="NPM" %}

```bash
npm run storybook & pixeleye storybook http://localhost:6006
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn storybook & pixeleye storybook http://localhost:6006
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm run storybook & pixeleye storybook http://localhost:6006
```

{% /tab %}

{% /tabs %}

We recommend adding the something like this to your `package.json` file:

```package.json
{
  "scripts": {
    "storybook": "start-storybook -p 6006",
    "pixeleye": "npm run storybook & pixeleye storybook http://localhost:6006"
  }
}
```

You should run this command in your ci/cd pipeline.

## Dark/Light, Mobile/Desktop, and more

We support capturing multiple variants of your components. As long as there's a url parameter for it, we can capture it.

#### Dark/Light mode example

Using the official storybook theme addon

{% tabs %}

{% tab label="TypeScript" %}

```pixeleye.config.ts
import { Config } from "pixeleye";

const config: Config = {
  token: "YOUR_PROJECT_TOKEN",
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
}
```

{% /tab %}

{% tab label="JavaScript" %}

```pixeleye.config.js
/** @type {import('pixeleye').Config}*/
const config = {
  token: "YOUR_PROJECT_TOKEN",
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
}
```

{% /tab %}

{% /tabs %}

## Specific story config

You can also specify specific config options for stores.

In your story file add a `pixeleye` object to the `parameters` object.

```tsx
import type { Meta } from "@storybook/react";
import type { StoryParams } from "pixeleye";
import Button from "./button";

const meta: Meta<typeof Button> & StoryParams = {
  component: Button,
  title: "UI/Button",
  parameters: {
    pixeleye: {
      skip: true,
    },
  },
};
```

You can also define this on a global level in your `.storybook/preview.js` or on a per component level in the `parameters` object.

### Config options

- `skip` - Skip capturing this story
- `selector` - A CSS selector to capture a specific element in the story. If you want to just capture the story, try `#storybook-root > *`
