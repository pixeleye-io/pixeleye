import { Meta } from "@storybook/react";
import { LazyMotion, domMax } from "framer-motion";
import NavTab from "./navTab";

export default {
  title: "navigation/NavTab",
  component: NavTab,
  decorators: [
    (Story) => (
      <LazyMotion features={domMax}>
        <Story />
      </LazyMotion>
    ),
  ],
} as Meta<typeof NavTab>;

export const Default = () => (
  <NavTab.Tabs>
    <NavTab href="#" active>
      Home
    </NavTab>
    <NavTab href="#">Home</NavTab>
  </NavTab.Tabs>
);
