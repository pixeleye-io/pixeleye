---
title: Reviewing
description: Pixeleye boasts an awesome review experience. Bulk approve snapshots, itterate on designs and catch issues.
---

# Revewing your snapshots

Any snapshots with detected changes will be surfaced for approval. We aim for the review process to work with your pull-requests rather than against it. When using our offical git integrations, we post comments into the pull requests & commits to ensure you don't miss a detail.

For a more in-depth guide on the feautres of our reviewer, checkout the [docs here](https://pixeleye.io/docs/features/diff-highlighting)

## Auto approvals

To make sure Pixeleye is in sync with your production, you should auto approve your main branches.
Under your project settings, you can write a regex query to match branch names.

E.g `^main$` will auto approve the branch called 'main' and only 'main'

