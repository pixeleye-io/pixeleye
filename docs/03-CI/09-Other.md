---
title: Other CI/CD
description: Pixeleye is designed to work with any CI/CD system. This guide will show you how to get setup in minutes.
---

# Other CI/CD

We want to ensure that Pixeleye works with any CI/CD system. We use [env-ci](https://github.com/semantic-release/env-ci) to get our variables for CI/CD systems. It isn't perfect and can cause issues. **Please raise a github issue if you're ci/cd isn't working and we'll provide a solution**

## Manual variables

You can override the variables that are set by env-ci by setting them manually. This is useful if you're using a CI/CD system that isn't supported by env-ci.

- `PIXELEYE_BRANCH` - The branch that the code is being built from. In the case of a pull request, this will be the target branch.
- `PIXELEYE_COMMIT` - The commit hash of the code being built.
- `PIXELEYE_BASE_BRANCH` - Just for pull requests, the branch that the pull request originated from.