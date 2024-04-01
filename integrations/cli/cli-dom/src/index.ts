import { serialize as PercySerialize } from "@percy/dom";

export interface Resource {
  url: string;
  content: string;
  mimeType: string;
}

export interface SerializeResult {
  html: string;
  warnings: string[];
  resources: Resource[];
  hints: string[];
}

// TODO - get proper types for Document

export interface SerializeOptions {
  enableJavaScript?: boolean;
  domTransformation?: (dom: any) => void;
  disableShadowDOM?: boolean;
  reshuffleInvalidTags?: boolean;
  stringifyResponse?: boolean;
  dom?: any;
}

export const serialize = (options: SerializeOptions): SerializeResult =>
  PercySerialize(options);

declare module "@percy/dom" {
  export function serialize(options: any): any;
}
