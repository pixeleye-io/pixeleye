import { Tag, Config, Node } from "@markdoc/markdoc";
import { TabRender, TabsRender } from "./tabs";

export const tab = {
  render: TabRender,
  attributes: {
    label: {
      type: String,
    },
  },
};

export const tabs = {
  render: TabsRender,
  attributes: {},
  transform(node: Node, config: Config) {
    const labels = node
      .transformChildren(config)
      .filter((child) => child && (child as any).name === "Tab")
      .map((tab) =>
        typeof tab === "object" ? (tab as any).attributes.label : null
      );

    return new Tag((this as any).render, { labels }, node.transformChildren(config));
  },
};
