import type { Meta } from "@storybook/react";

import Input from "./input";

const meta: Meta = {
    component: Input,
    title: "UI/Input",
};

export const Primary = () => <Input label="Primary" placeholder="primary" />;

export default meta;
