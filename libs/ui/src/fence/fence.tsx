import { Code } from "bright";
import { ReactNode } from "react";

export interface FenceProps {
  children: ReactNode;
  language?: string;
}

Code.theme = {
  dark: "dark-plus",
  light: "light-plus",
  lightSelector: "html.light",
};

export default function Fence({ children, language }: FenceProps) {
  return <Code lang={language}>{children}</Code>;
}
