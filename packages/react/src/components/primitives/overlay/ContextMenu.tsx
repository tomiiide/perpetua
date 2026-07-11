import { forwardRef } from "react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";

export type ContextMenuContentProps = RadixContextMenu.ContextMenuContentProps;

export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  ContextMenuContentProps
>(({ className, ...rest }, ref) => (
  <RadixContextMenu.Portal>
    <RadixContextMenu.Content ref={ref} className={className} {...rest} />
  </RadixContextMenu.Portal>
));
ContextMenuContent.displayName = "ContextMenuContent";

export type ContextMenuSubContentProps =
  RadixContextMenu.ContextMenuSubContentProps;

export const ContextMenuSubContent = forwardRef<
  HTMLDivElement,
  ContextMenuSubContentProps
>(({ className, ...rest }, ref) => (
  <RadixContextMenu.Portal>
    <RadixContextMenu.SubContent ref={ref} className={className} {...rest} />
  </RadixContextMenu.Portal>
));
ContextMenuSubContent.displayName = "ContextMenuSubContent";

export const ContextMenu = {
  Root: RadixContextMenu.Root,
  Trigger: RadixContextMenu.Trigger,
  Portal: RadixContextMenu.Portal,
  Content: ContextMenuContent,
  Group: RadixContextMenu.Group,
  Label: RadixContextMenu.Label,
  Item: RadixContextMenu.Item,
  CheckboxItem: RadixContextMenu.CheckboxItem,
  RadioGroup: RadixContextMenu.RadioGroup,
  RadioItem: RadixContextMenu.RadioItem,
  ItemIndicator: RadixContextMenu.ItemIndicator,
  Separator: RadixContextMenu.Separator,
  Arrow: RadixContextMenu.Arrow,
  Sub: RadixContextMenu.Sub,
  SubTrigger: RadixContextMenu.SubTrigger,
  SubContent: ContextMenuSubContent,
};
