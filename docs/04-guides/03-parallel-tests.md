---
title: Parallel tests
description: How to run your Pixeleye tests across multiple nodes with sharding
---

# Parallel tests

Many E2E testing frameworks support test sharding, which allows you to run your tests across multiple nodes.

Sharding won't speed up Pixeleye's image processing since we already do this in parallel, but it can help speed up your e2e tests.

Pixeleye also supports test sharding. This guide will show you how to get started with test sharding in Pixeleye.

## Requirements

### A unique identifier for the run

For Pixeleye to identity and group up each run, we need to each instance to have the same unique identifier.

We'll attempt to set this automatically, but if you're running into issues, you can set it manually with the `PIXELEYE_SHARD_ID` environment variable or the `--shard` flag.

### Test count

You need to know the total number of shards you're running. This is usually the number of nodes you're running your tests on.

## Running tests

```bash
pixeleye exec --count <count> --shard <shardID> -- <test command>
```

- `count` - The total number of shards
- `shard (optional)` - The shard ID of the current instance, if not set, we'll attempt to set it automatically

### Playwright example

```bash
pixeleye exec --count 3 --shard 1 -- npx playwright test --shard=1/3
```
