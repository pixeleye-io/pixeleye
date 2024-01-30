---
title: Quick-start
description: How to get started with Pixeleye
---

# Get started with Pixeleye

Get started with Pixeleye in just a few minutes. This guide will walk you through the steps to get up and running with Pixeleye from scratch.

## Register a new Pixeleye account

Head over to [Pixeleye](https://pixeleye.io/registration) (or equivalent if self-hosting) and register a new account. You will receive an email with a confirmation code to verify your email address. Once you have verified your email address, you can log in to your Pixeleye account.

> Note: If you signed up with a vcs provider like Github, you should see any teams with access to Pixeleye. Find out more about [teams and permissions](/docs/features/teams-and-permissions).

### Install relevant vcs tools

If you want to use a vcs integration which wasn't installed automatically, you'll need to set it up first.

#### Github

For github, we just require that our app is installed in your organization/account and that you have given it access to the relevant repositories. You can do this by going to the https://github.com/apps/pixeleye-io/installations/new

#### Other

You can add any git repo even if we don't officially support it. You can do this by selecting a generic git project.

## Create a new project

From the dashboard, click the `New project` button. Depending on the team you're currently in, you may be asked to select a type of project, github, custom etc.

After creating the project you'll be taken to the project page. From here you are given a project token. **Make sure to keep this token safe**. You will need it to authenticate your CI/CD with Pixeleye.

## Integrate with your project

We have separate guides for each integration. Pick the one that best suits your needs and follow the instructions there.

We currently support the following official integrations:

- [storybook](/docs/integrations/storybook)
- [cypress](/docs/integrations/cypress)
- [puppeteer](/docs/integrations/puppeteer)
- [playwright](/docs/integrations/playwright)
- [any other platform](/docs/integrations/any-other-platform)

> Note: If you want to use another tool, you can use our CLI tool directly.


## Start coding

You're all set! Now you can start coding and Pixeleye will automatically run your tests and report back to you. You can view the results on the project page.