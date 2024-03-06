---
title: Snapshots
description: What are pixeleye snapshots and how to use them
---

# Snapshots

Every picture of a component, page, or story is a snapshot. Pixeleye compares the baseline snapshot with the current snapshot and reports any differences. We can then use our UI to review the changes and decide whether to accept them or not.

## Snapshot identification

Each snapshot has 4 identifiers which are combined to create a unique identifier for the snapshot.

- **Name** - The name of the component, page, or story. E.g. button, home, login, etc.
- **Variant** - The variant of the component, page, or story. E.g. primary, dark, primary-light, etc.
- **Viewport** - The viewport of the snapshot. E.g. 1920x1080, 1024x768, etc.
- **Target** - The target of the snapshot. E.g. chrome, firefox, etc.

## Grouping

We will group all snapshots with the same name, variant and viewport together whilst reviewing. This helps streamline the review process given that browsers will often render the same component more or less the same way.

We choose to not group viewports together as we believe that the differences between viewports are often significant enough to warrant a separate review. A mobile view will often look drastically different from a desktop view.
