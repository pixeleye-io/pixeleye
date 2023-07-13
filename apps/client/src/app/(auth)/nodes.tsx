import { UiNode, UiNodeInputAttributes } from "@ory/client";
import {
  isUiNodeInputAttributes,
  isUiNodeAnchorAttributes,
} from "@ory/integrations/ui";
import { Button, Input } from "@pixeleye/ui";
import { InputHTMLAttributes } from "react";

export const AuthNode = ({ node }: { node: UiNode; }) => {
  // other node types are also supported
  // if (isUiNodeTextAttributes(node.attributes)) {
  // if (isUiNodeImageAttributes(node.attributes)) {
  // if (isUiNodeAnchorAttributes(node.attributes)) {
  //   console.log(node.attributes.href);
  // }

  if (isUiNodeInputAttributes(node.attributes)) {
    const attrs = node.attributes as UiNodeInputAttributes;
    const nodeType = attrs.type;

    switch (nodeType) {
      case "button":
      case "submit":
        return (
          <Button
            type={attrs.type as "submit" | "reset" | "button" | undefined}
            name={attrs.name}
            value={attrs.value}
            full
          >
            {node.meta.label?.text}
          </Button>
        );
      default:
        if (attrs.name === "csrf_token")
          return <input {...node.attributes} key="csrf_token" />;
        return (
          <Input
            name={attrs.name}
            type={attrs.type}
            autoComplete={
              attrs.name === "identifier" ? "email" : attrs.autocomplete
            }
            label={node.meta.label?.text}
            defaultValue={attrs.value}
            required={attrs.required}
            disabled={attrs.disabled}
          />
        );
    }
  }
};
