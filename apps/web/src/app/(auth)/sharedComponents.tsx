import { UiNode, UiNodeInputAttributes, UiText } from "@ory/client";
import { isUiNodeInputAttributes } from "@ory/integrations/ui";
import { Button, Input } from "@pixeleye/ui";
import { cx } from "class-variance-authority";

export const AuthNode = ({
  node,
  errors,
}: {
  node: UiNode;
  errors?: Record<string, string>;
}) => {
  // other node types are also supported
  // if (isUiNodeTextAttributes(node.attributes)) {
  // if (isUiNodeImageAttributes(node.attributes)) {
  // if (isUiNodeAnchorAttributes(node.attributes)) {
  //   console.log(node);
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
            variant={attrs.name === 'method' ? "secondary" : "default"}
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

export function ErrorsList({
  messages,
  className,
}: {
  messages?: UiText[];
  className?: string;
}) {
  const filteredMessages = messages?.filter(({ type }) => type === "error");

  if (!filteredMessages || filteredMessages.length === 0) return;

  return (
    <ul className={cx("flex flex-col mt-4 space-y-2")}>
      {filteredMessages?.map(({ text }, i) => (
        <li key={i} className="text-sm text-error">
          {text}
        </li>
      ))}
    </ul>
  );
}
