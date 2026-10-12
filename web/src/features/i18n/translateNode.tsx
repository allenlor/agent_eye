import { cloneElement, Fragment, isValidElement, type ReactNode } from "react";
import { t } from "@/src/features/i18n";

export function translateNode(node: ReactNode, deep = false): ReactNode {
  if (typeof node === "string") return t(node);
  if (Array.isArray(node)) {
    return node.map((child, index) => (
      <Fragment key={index}>{translateNode(child, deep)}</Fragment>
    ));
  }
  if (
    deep &&
    isValidElement<{ children?: ReactNode }>(node) &&
    node.props.children != null
  ) {
    return cloneElement(
      node,
      undefined,
      translateNode(node.props.children, true),
    );
  }
  return node;
}
