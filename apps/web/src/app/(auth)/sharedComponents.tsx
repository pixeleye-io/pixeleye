import { UiNode, UiNodeInputAttributes, UiText } from "@ory/client";
import { isUiNodeInputAttributes } from "@ory/integrations/ui";
import { Button, Input } from "@pixeleye/ui";
import { cx } from "class-variance-authority";

function getNode({
  node,
  fullButton = true,
}: {
  node: UiNode;
  fullButton?: boolean;
}) {
  if (isUiNodeInputAttributes(node.attributes)) {
    const attrs = node.attributes as UiNodeInputAttributes;

    switch (attrs.type) {
      case "button":
      case "submit":
        return (
          <Button
            type={attrs.type as "submit" | "reset" | "button" | undefined}
            name={attrs.name}
            value={attrs.value}
            variant={attrs.name === "method" ? "default" : "outline"}
            full={fullButton}
          >
            {node.meta.label?.text}
          </Button>
        );
      default:
        if (attrs.name === "csrf_token") return <input {...node.attributes} />;

        return (
          <Input
            name={attrs.name}
            type={attrs.type}
            minLength={attrs.type === "password" ? 8 : undefined}
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
}

export const AuthNode = ({
  node,
  fullButton = true,
}: {
  node: UiNode;
  fullButton?: boolean;
}) => {
  const uiNode = getNode({ node, fullButton });

  return (
    <>
      {node.messages && <ErrorsList messages={node.messages} />}
      {uiNode}
    </>
  );
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
