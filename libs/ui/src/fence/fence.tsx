import { Code, BrightProps } from "bright";
import { ReactNode } from "react";
import { Copy } from "./title";


export const Title: BrightProps["TitleBarContent"] = (props) => {
  const { title, colors, code } = props
  const { foreground } = colors

  const circle = {
    borderRadius: "100%",
    height: "0.8em",
    width: "0.8em",
    background: foreground,
    opacity: 0.2,
  }


  return (
    <div
      className="flex items-center justify-between w-full text-sm py-1 text-on-surface bg-surface-container"
    >
      <div
        className="flex gap-1 ml-2 w-12"
      >
        <div style={circle} />
        <div style={circle} />
        <div style={circle} />
      </div>
      <span>{title}</span>
      <Copy code={code} />
    </div>
  )
}



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



const titleBar = {
  name: "titleBar",
  TitleBarContent: Title,
}


export default function Fence({ children, language, title, ...rest }: FenceProps) {
  return <Code lang={language} title={title} extensions={[titleBar]}>{children}</Code>;
}
