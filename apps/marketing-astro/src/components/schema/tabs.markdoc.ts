import Markdoc, { type Config, type Node } from "@markdoc/markdoc";
import Tabs from "./tabs.astro";
import Tab from "./tab.astro";

export const tab = {
  attributes: {},
  transform(node: Node, config: Config) {
    // @ts-ignore
    return new Markdoc.Tag(
      "tab",
      node.attributes,
      node.transformChildren(config)
    );
  },
};

export const tabs = {
  attributes: {},
  transform(node: Node, config: Config) {
    const idSuffix = Math.random().toString(36).substring(2, 6);

    const labels = node
      .transformChildren(config)
      .filter((child) => child && (child as any).name === "tab")
      .map((tab, i) => {
        (tab as any).attributes.id = `tab-${i}--${idSuffix}`;
        if (i === 0) {
          (tab as any).attributes.initial = true;
        }
        (tab as any).attributes.labeledByID = `tab-btn-${i}--${idSuffix}`;
        return typeof tab === "object" ? (tab as any).attributes.label : null;
      });

    return new Markdoc.Tag(
      "tabs",
      { labels, idSuffix },
      node.transformChildren(config)
    );
  },
};
