---
title: Sitemaps and URLs
description: How to integrate Pixeleye into your website by providing a sitemap or a list of URLs.
---

# Sitemaps and URLs

Pixeleye can crawl your sitemaps & provided URLs to automatically capture screenshots of your website. This is a really quick way to get started with Pixeleye.

## Prerequisites

- [You have a Pixeleye account](https://pixeleye.io/registration)
- [You've created a project and obtained a project token](https://pixeleye.io/docs/getting-started/quickstart#create-a-new-project)

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

### Capture your sitemap

{% tabs %}

{% tab label="NPM" %}

```bash
npm run pixeleye snapshot --sitemaps https://example.com/sitemap.xml
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn pixeleye snapshot --sitemaps https://example.com/sitemap.xml
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm pixeleye snapshot --sitemaps https://example.com/sitemap.xml
```

{% /tab %}

{% /tabs %}

### Capture a list of URLs

{% tabs %}

{% tab label="NPM" %}

```bash
npm run pixeleye snapshot --urls https://example.com/page1 https://example.com/page2
```

{% /tab %}

{% tab label="Yarn" %}

```bash
yarn pixeleye snapshot --urls https://example.com/page1 https://example.com/page2
```

{% /tab %}

{% tab label="PNPM" %}

```bash
pnpm pixeleye snapshot --urls https://example.com/page1 https://example.com/page2
```

{% /tab %}

{% /tabs %}

## Defining URLs in a configuration file

If you want to have per-page options or a more organized way to define your URLs, you can use a configuration file.

### Create a pixeleye.config.{js,ts} file

```snaps.pixeleye.ts
import {SnapshotDefinition} from "pixeleye";

const urls: SnapshotDefinition[] = [
  {
    url: "https://example.com/page1",
    // options
  },
  {
    url: "https://example.com/page2",
    // options
  },
  // ...
];

export default urls;
```

> There is no requirement to use a specific name. But we recommend using `*.pixeleye.ts` to make it clear that this file is for Pixeleye.

### Adding file to `config.pixeleye.ts`

> You can also declare the snapshot files as the main argument in `pixeleye snapshot <files>` command.

```config.pixeleye.ts
import { Config } from "pixeleye";

const config: Config = {
  ...
  snapshotFiles: ["./**/*.pixeleye.ts"],
};

export default config;
```

> We accept globs in the `snapshotFiles` array. This means you can use `./**/*.pixeleye.ts` to include all files with the `.pixeleye.ts` extension.

## Dynamic URLs

We support providing a function that returns an array of URLs. This is useful if you have a dynamic list of URLs that you want to capture.

### Create a pixeleye.config.{js,ts} file

```config.pixeleye.ts
import { Config, ConfigWithoutSnapshotFiles } from "pixeleye";

const config: Config = {
  ...
  snapshotFiles: (config: ConfigWithoutSnapshotFiles) => {
    return [
      {
        url: "https://example.com/page1",
        // options
      },
      {
        url: "https://example.com/page2",
        // options
      },
      // ...
    ];
  },
};

export default config;
```
