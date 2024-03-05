<div align="center">
<h1>Pixeleye</h1>
<p>The batteries-included platform for visually testing and reviewing your UI; it's even self-hostable! Connect your codebase with our many integrations and dramatically increase your test coverage in minutes.</p>  
</p>
<div align="center">
  <a href="https://pixeleye.io/home">Homepage</a>
  .
  <a href="https://pixeleye.io/docs">Documentation</a>
  .
  <a href="https://pixeleye.io/playground">Playground</a>
</div>
</div>
<br />

![Pixeleye reviewer](https://raw.githubusercontent.com/pixeleye-io/pixeleye/main/.assets/playground.png)

## Why Pixeleye

Pixeleye provides a seamless experience for visually testing and reviewing your UI. Unlike raw code, UI should be primarily reviewed visually. We built Pixeleye to allow developers, designers, and product managers to review UI changes effectively and efficiently; we'll also detect unintended visual side effects.

### Features

- **Multi-Browser Testing**: We support all major browsers. When capturing screenshots, we run a background process to render and capture across all browsers.

- **Clean git repo**: Unlike alternatives, we don't store your comparisons directly in the git repo. We keep your commits clean and avoid scenarios where failing tests are lazily approved with a hand-wavy command

- **Self-Hostable**: You can host pixeleye on your infrastructure. We provide a docker-compose file to get you started. [read more](https://pixeleye.io/docs/guides/self-hosting)

- **Responsive Testing**: We also support different device sizes and browsers. You can capture screenshots for mobile, tablet, and desktop.

- **Permission syncing**: Already set up your team's permissions in Github? We'll sync and match them in Pixeleye. [learn more](https://pixeleye.io/docs/features/teams-and-permissions)

- **Integration with your codebase**: We provide many official integrations to connect your codebase with Pixeleye, be it Storybook, Cypress, Playwright, Puppeteer or more

- **Light and Dark themes**: Do we need to justify this? 😂 Our founder's first open-source project was a collection of animated [theme toggles](https://github.com/alfiejones/theme-toggles)

- **Simple and powerful review process**: Pixeleye boasts an excellent review experience, from our superb web app to VCS integration. Have a go with our [playground](https://pixeleye.io/playground)


## Why use Pixeleye Cloud? (hint: it's not just our fair pricing)

The best way to use Pixeleye is through our [cloud offering](https://pixeleye.io/home). Plus, by using our service, you'll promote a sustainable open-source ecosystem and support us in developing and improving our open-source offerings.

### Benefits of Pixeleye Cloud:

- **Fiar usage-based pricing** We firmly believe you should only pay for what you use. Checkout our [pricing](https://pixeleye.io/pricing)
- **Minimal setup** Get started in minutes. Why spend time setting up our project when you can be using it instead!
- **High availability, Backups, Security, automatic maintenance** We manage the infrastructure whilst you manage your UI
- **Latest features** Our Cloud follows a rolling release cycle, whereas our official self-hosted releases are more long-term. Enjoy our latest features with Cloud!
- **Premium support** We offer fantastic support for our Cloud customers. While we'll fix any bugs you find self-hosting, we can't help you with onboarding or setup.


Want to get started? Head over [to our](https://pixeleye.io/home) website to begin.

## Self-hosting

The easiest way to self-host Pixeye is with Docker. Check out our [guide](https://pixeleye.io/docs/guides/self-hosting) to get started quickly.

Our Docker images follow a stable release pattern, whereas our Cloud follows a rolling release cycle. The latest features/bug fixes may not yet be present in our docker images. We follow this pattern to reduce the overhead of constantly requiring you to update your infra whilst ensuring we only ship stable products. We don't have dates for our releases, but they typically come after new features are stable or significant security issues arise. 

### Required services

Whilst Pixeleye at its core consists of 2 systems, frontend & backend, we require quite a few other systems to get everything working.

- Rabbitmq
- Ory Kratos
- Postgres
- S3 compatible storage (MinIO recommended)
- SMTP server

We also have our docker image to handle database migrations automatically.

You can find all the relevant files along with a docker-compose file here: [self-hosted docker files](https://github.com/pixeleye-io/pixeleye/tree/main/docker/config). We don't take any responsibility for your data or infrastructure.

## Contributing

We welcome all contributions! Be it fixing a bug, helping with a feature, suggesting ideas or even writing about us in your blog.

For more info, please check out our [contributing guide](https://pixeleye.io/docs/guides/how-to-contribute).

## Disclosing security issues

If you think you've found a security vulnerability, please refrain from posting it publicly on the forums, the chat, or GitHub. You can find all the info for responsible disclosure in our [SECURITY.md](https://github.com/pixeleye-io/pixeleye/blob/main/SECURITY.md)






