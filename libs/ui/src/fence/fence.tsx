import { Code, BrightProps, Extension } from "bright";
import { ReactNode } from "react";
import { Copy } from "./title";
import { darkTheme, lightTheme } from "./themes";


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
      className="flex items-center justify-between w-full text-sm py-1 text-on-surface bg-surface-container-high"
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

export const Root: BrightProps["Root"] = ({ style, ...props }) => {

  const newStyle = {
    ...style,
    background: "red"
  }


  return (
    <pre style={newStyle} {...props} />
  )
}


export interface FenceProps {
  children: ReactNode;
  language?: string;
  title?: string;
}



const titleBar: Extension = {
  name: "titleBar",
  TitleBarContent: Title,
}

const pre: Extension = {
  name: "root",
  Root,
}


export default function Fence({ children, language, title, ...rest }: FenceProps) {
  return <Code
    theme={{
      dark: darkTheme,
      light: lightTheme,
      lightSelector: "html.light",

    }}
    lang={language}
    title={title}
    extensions={[titleBar]}
  >
    {children}
  </Code>;
}



