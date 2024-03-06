---
title: Monorepo Setup
description: Pixeleye is designed to work with monorepos. This guide will show you how to get setup in minutes.
---

# Monorepos with Pixeleye

Pixeleye is designed to work with monorepos, in fact, we use it [ourselves](https://github.com/pixeleye-io/pixeleye). This guide will show you how to get setup in minutes.


## Solutions


There are two main solutions for monorepos, each with their own pros and cons. The solution you choose will depend on your specific needs.


### 1. Multiple Root Projects (Recommended)

This is the recommended solution. You have a pixeleye project for each package in your monorepo. This solution scales well and allows you to run tests for a single package at a time. Permissions can be fine tuned for each package as well. This is the solution we use at Pixeleye.


### 2. Single Root Project

This is the easiest solution to setup. You simply have a single pixeleye project which contains all the tests for your monorepo. Unfortunately, this solution does not scale well. As your monorepo grows, so will your pixeleye project. Monorepo management tools don't work well with this solution either since it requires all tests to be run every time.