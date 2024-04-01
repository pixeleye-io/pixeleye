declare module "@percy/dom" {
  interface SerializeOptions {
    enableJavaScript?: boolean;
    domTransformation?: (dom: Document) => void;
    disableShadowDOM?: boolean;
    reshuffleInvalidTags?: boolean;
    // stringifyResponse?: boolean;
    dom?: Document;
  }

  interface serializeResult {
    html: string;
    warnings: string[];
    resources: string[];
    hints: string[];
  }

  export function serialize(options: SerializeOptions): serializeResult;
}
