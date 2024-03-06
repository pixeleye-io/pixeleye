---
title: Cross-browser testing
description: Pixeleye supports taking screenshots across multiple browsers. Increase your coverage whilst ensuring a consent user experience
---

# Cross-browser testing

Users surf the web with different browsers and devices. Pixeleye allows you to take screenshots across multiple browsers and devices to ensure a consistent user experience. Our cross-browser testing is powered by [Playwright](https://playwright.dev/).

## Supported browsers

Currently, we support the following browsers:

- Chrome
- Firefox
- Safari

We're planning on adding support for more browsers in the future. If you have a specific browser you would like to see, please let us know.

## How it works

The official Pixeleye sdk's take snapshots of your dom rather than a screenshot. We then take these snapshots and render them in each browser. The pictures are taken in a different process to your tests allowing Pixeleye to seamlessly integrate into your stack without slowing down your tests.

## Usage

Ideally, most of the snapshots you take will be the same across all browsers. Pixeleye is smart enough to group these together during the review process. This means you can easily review the differences between changes without having to review each browser individually. If you're on the cloud platform, each browser screenshot will count towards your monthly usage.


