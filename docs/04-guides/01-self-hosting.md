---
title: Getting started with self-hosting
description: Run and manage Pixeleye on your own infrastructure.
---

# Get started with self-hosting

> The best and fastest way to get started with Pixeleye is to use our cloud service. However, if you want to run and manage Pixeleye on your own infrastructure, you can do so by self-hosting Pixeleye. Since Pixeleye is open-source, we would appreciate any donations to help us maintain and improve the project. [Sponsor us](https://github.com/sponsors/pixeleye-io)

## Prerequisites

We **recommend** running Pixeleye behind in your internal network or behind a reverse proxy. Whilst our Pixeleye backend is designed to be secure, and what we're using in our cloud service, we use multiple services (db, rabbitmq) which can easily be unsecured if not properly configured.

If you're exposing Pixeleye to the internet, ensure you have properly setup your firewall and have generated sufficient api keys and secrets.

We aren't responsible for any security breaches or data loss if you're self-hosting Pixeleye. We will try to assist you as much as possible, but being an open-source project, we can't guarantee any support for our self-hosted users.

## Docker compose

We publish three docker image for Pixeleye, our backend, frontend and database migrations.

We maintain this docker compose file to help you get started with Pixeleye. You can find the latest version of the docker compose file in our [Github repository](https://github.com/pixeleye-io/pixeleye/blob/main/docker/docker-compose-self-hosting.yml).

This docker file requires the files found in this [config folder](https://github.com/pixeleye-io/pixeleye/tree/main/docker/config). These files are mostly there to configure our auth.

### Quick start

1. Copy [`docker-compose-self-hosting.yml`](https://github.com/pixeleye-io/pixeleye/tree/main/docker/docker-compose-self-hosting.yml) & everything from [`./config`](https://github.com/pixeleye-io/pixeleye/tree/main/docker/config) to your server.
2. run `docker compose -f docker-compose-self-hosting.yml up`
3. After docker has started, you can access Pixeleye at `http://localhost:3000`.

> Make sure you have the [./config folder](https://github.com/pixeleye-io/pixeleye/tree/main/docker/config) folder in the same directory as the docker-compose file.

### Changing secrets

Our rabbitmq and database require passwords to be set. By default they're set to `CHANGEME`. You **must** change these passwords to something secure.

### Email

We're using mailslurper to capture emails. You can access the mailslurper web interface at `http://localhost:4437`.

If you actually want to send emails, you'll need to change the `SMTP_*` environment variables for the pixeleye backend and update `kratos.yml`.

## Github app setup (optional)

Pixeleye has awesome integration with Github. If you want to use this feature, you need to create a Github app. You can still use github repos with Pixeleye without creating a Github app, but features like permission syncing, github commit statuses, and more won't work.

### Create a Github app

Follow the instructions on the [Github documentation](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app).

The auth callback URL should be `http(s)://<domain-of-ory-kratos>:<public-port>/self-service/methods/oidc/callback/github`.

The post installation url should be `http(s)://<domain-of-pixeleye-backend>:<public-port>/add/github`. You should also redirect on update.

We recommend restricting the app to just your organization.

#### Permissions

Pixeleye requires the following permissions:

Repository permissions:

- `checks:write`
- `commit_status:write`
- `pull_requests:write`

Organization permissions:

- `members:read`

Account permissions:

- `email:read`

#### Environment variables

Once you've created the Github app, you'll need to set the `GITHUB_*` perms in the compose file.

#### Auth setup

You'll need to update the `config/kratos.yml` file to include the Github app client id and secret.

## Release cycle

We are regularly realizing new versions of Pixeleye, often multiple times each day! Our cloud platform follows a rolling release cycle, meaning that we are continuously deploying new versions of Pixeleye. Since people using our self-hosted version probably don't want to be frequently updating their instance, we only release new versions of Pixeleye once new features are stable and tested, or when security updates are necessary.

This means you may come across features in our cloud platform that are not yet available in the self-hosted version. If you want to use these features, you can always switch to our cloud platform.

> Since Pixeleye is currently in beta, we are pushing updates more frequently than we will in the future. We are working hard to get Pixeleye to a stable release, and we appreciate your patience and support.
