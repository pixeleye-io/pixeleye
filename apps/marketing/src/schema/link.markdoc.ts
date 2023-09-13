import NextLink from "next/link";
import { nodes } from "@markdoc/markdoc";

const Link = {
  ...nodes.link,
  render: NextLink,
  attributes: {
    href: {
      type: String,
    },
  },
};

export default Link;
