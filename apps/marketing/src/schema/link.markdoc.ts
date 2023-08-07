import NextLink from "next/link";
import { nodes } from "@markdoc/markdoc";

const Link = {
  ...nodes.link,
  render: NextLink as any,
  attributes: {
    href: {
      type: String,
    },
  },
};

export default Link;
