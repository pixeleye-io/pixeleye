import { Code } from "bright";
import { ReactNode } from "react";

export interface FenceProps {
  children: ReactNode;
  language?: string;
  title?: string;
}

Code.theme = {
  dark: "dark-plus",
  light: "light-plus",
  lightSelector: "html.light",
};

export default function Fence({ children, language, title, ...rest }: FenceProps) {
  console.log(rest, title)
  return <Code lang={language} title={title}>{children}</Code>;
}
