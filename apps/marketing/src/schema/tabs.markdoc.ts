import { Tag, Config, Node } from "@markdoc/markdoc";

export const tab = {
  render: "Tab",
  attributes: {
    label: {
      type: String,
    },
  },
};

export const tabs = {
  render: "Tabs",
  attributes: {},
  transform(node: Node, config: Config) {
    const labels = node
      .transformChildren(config)
      .filter((child) => child && (child as any).name === "Tab")
      .map((tab) =>
        typeof tab === "object" ? (tab as any).attributes.label : null
      );

    return new Tag(
      (this as any).render,
      { labels },
      node.transformChildren(config)
    );
  },
};
