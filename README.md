# Pixeleye

## Quick Start

To get it running, follow the steps below:

### Setup dependencies

```diff
# Install dependencies
pnpm i

# Configure environment variables.
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Prisma schema to your database
pnpm db:generate
```

### Running client

```bash
pnpm dev
```

### Running storybook

```bash
pnpm storybook
```

## License

All work is licensed under the AGPL-3.0-or-later (sepcified in the LICENSE file at the root). When specified (by an LICENSE file), work in a directory and sub directories operate under both LICENSES. In these cases, the licneseing is either MIT or AGPL-3.0-or-later, you can choose between one of them if you use this work.
