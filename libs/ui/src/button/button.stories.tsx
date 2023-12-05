// import type { Meta } from "@storybook/react";

import Button from "./button";

const meta = {
  component: Button,
  title: "UI/Button",
};

export const Primary = () => <Button>Primary</Button>;

export const Secondary = () => <Button variant="secondary">Secondary</Button>;

export const Outline = () => <Button variant="outline">Outline</Button>;

export const Destructive = () => (
  <Button variant="destructive">Destructive</Button>
);

export const Affirmative = () => (
  <Button variant="affirmative">Affirmative</Button>
);

export const Ghost = () => <Button variant="ghost">Ghost</Button>;


export const Link = () => <Button variant="link">Link</Button>;

export default meta;
