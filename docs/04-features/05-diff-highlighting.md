---
title: Diff highlighting
description: Pixeleye highlights exactly what's changed screenshot to screenshot. We offer multiple different views allow you to easily review your changes.
---

# Diff highlighting

Pixeleye flaunts an awesome review experience. We highlight exactly what's changed screenshot to screenshot. Checkout our [playground](https://pixeleye.io/playground) to see it in action.

## View modes

We have two different view modes:

### Side-by-side

Side-by-side mode shows the before and after screenshot next to one another. We highlight the differences between the two screenshots, making it easy to see what's changed. The differences are highlighted in red and can be toggled on/off.

### Stacked

Stacked mode shows the before and after screenshot on top of each other. You can click on the screenshots to toggle between the before and after screenshot. We highlight the differences between the two screenshots, making it easy to see what's changed. The differences are highlighted in red and can also be toggled on/off.

### Controls

Our review experience comes with a number of controls to help you review your changes:

- Drag the screenshots around by clicking and dragging on the screenshot.
- Zoom in and out by scrolling on the screenshot.
- Holding alt and scrolling will move the screenshots up/down or left/right.

## Sidebar

We have a vscode inspired sidebar which can be resized by hovering and dragging the edge of the sidebar. Switch between panels via the icons (clicking an active icon will toggle the panels visibility).

### Batch changes

The sidebar is home to our batch changes menu. This allows you to quickly accept or reject all changes in the current build.

## Threshold

When comparing screenshots, we use a threshold to determine if a pixel has changed. This threshold is configurable under each projects manage page. The default threshold is 0.2. A lower threshold will result in more pixels being highlighted as changed. Depending on your project, you may want to adjust this threshold to suit your needs. Gradients and anti-aliasing can cause a lot of pixels to be highlighted as changed. If you're seeing a lot of false positives, try increasing the threshold.

## Blur

We can temporarily blur the snapshots during comparison. This helps to reduce the number of false positives caused by anti-aliasing. You can toggle this on/off via the sidebar. We recommend leaving this on. The blur is only applied during comparison, the original screenshots are not modified.

## Feedback

The review experience is a core part of Pixeleye. We are always looking to improve it. If you have any feedback, please let us know. Checkout our [Github Discussions](https://github.com/pixeleye-io/pixeleye/discussions) to see what we're working on and to share your ideas.
