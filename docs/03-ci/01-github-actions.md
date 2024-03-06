---
title: Github actions
description: Run Pixeleye in your GitHub Actions workflow.
---

# GitHub Actions

Pixeleye offers official support for GitHub Actions. In fact, we use it ourselves. This guide will show you how to get setup in minutes.

## Quick Start

```yaml
name: "Pixeleye"

on:
  push:
    branches: ["main"]
  pull_request:
    types: [opened, synchronize]

jobs:
  pixeleye:
    runs-on: ubuntu-latest
    env:
      PIXELEYE_PROJECT_TOKEN: ${{ secrets.PIXELEYE_PROJECT_TOKEN }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Use Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Capture stories with Pixeleye CLI
        # Running Pixeleye against your storybook
        run: npm run storybook & npm run pixeleye storybook
```

## Notes

- Please ensure you have an adequate fetch depth. We recommend setting it to 0. Pixeleye needs to be able to access your git history to determine which builds we want to compare.
