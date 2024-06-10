import { component } from "@astrojs/markdoc/config";

const Callout = {
  render: component("./src/components/callout.astro"),
  children: ["paragraph", "tag", "list"],
  attributes: {
    type: {
      type: String,
      default: "note",
      matches: ["check", "error", "note", "warning"],
    },
  },
};

export default Callout;
