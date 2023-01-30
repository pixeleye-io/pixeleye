import Button from "./button";

export default {
  title: "general/Button",
  component: Button,
};

export const Primary = {
  render: (args: any) => <Button {...args} />,
  args: {
    children: "Button",
  },
  parameters: {},
};

export const Secondary = {
  render: (args: any) => <Button {...args} />,
  args: {
    children: "Button",
    variant: "secondary",
  },
  parameters: {},
};

export const Danger = {
  render: (args: any) => <Button {...args} />,
  args: {
    children: "Button",
    variant: "danger",
  },
  parameters: {},
};

export const Warning = {
  render: (args: any) => <Button {...args} />,
  args: {
    children: "Button",
    variant: "warning",
  },
  parameters: {},
};

export const Success = {
  render: (args: any) => <Button {...args} />,
  args: {
    children: "Button",
    variant: "success",
  },
  parameters: {},
};
