declare module "@percy/dom" {
  export interface Resource {
    url: string;
    content: string;
    mimeType: string;
  }

  export interface SerializeOptions {
    enableJavaScript?: boolean;
    domTransformation?: (dom: any) => void;
    disableShadowDOM?: boolean;
    reshuffleInvalidTags?: boolean;
    stringifyResponse?: boolean;
    dom?: any;
  }

  export interface SerializedDom {
    html: string;
    warnings: string[];
    resources: Resource[];
    hints: string[];
  }

  export function serialize(options: SerializeOptions): SerializedDom;
}
