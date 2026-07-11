import { forwardRef } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";

export type DropdownMenuContentProps = RadixDropdownMenu.DropdownMenuContentProps;

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, ...rest }, ref) => (
  <RadixDropdownMenu.Portal>
    <RadixDropdownMenu.Content ref={ref} className={className} {...rest} />
  </RadixDropdownMenu.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export type DropdownMenuSubContentProps =
  RadixDropdownMenu.DropdownMenuSubContentProps;

export const DropdownMenuSubContent = forwardRef<
  HTMLDivElement,
  DropdownMenuSubContentProps
>(({ className, ...rest }, ref) => (
  <RadixDropdownMenu.Portal>
    <RadixDropdownMenu.SubContent ref={ref} className={className} {...rest} />
  </RadixDropdownMenu.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export const DropdownMenu = {
  Root: RadixDropdownMenu.Root,
  Trigger: RadixDropdownMenu.Trigger,
  Portal: RadixDropdownMenu.Portal,
  Content: DropdownMenuContent,
  Group: RadixDropdownMenu.Group,
  Label: RadixDropdownMenu.Label,
  Item: RadixDropdownMenu.Item,
  CheckboxItem: RadixDropdownMenu.CheckboxItem,
  RadioGroup: RadixDropdownMenu.RadioGroup,
  RadioItem: RadixDropdownMenu.RadioItem,
  ItemIndicator: RadixDropdownMenu.ItemIndicator,
  Separator: RadixDropdownMenu.Separator,
  Arrow: RadixDropdownMenu.Arrow,
  Sub: RadixDropdownMenu.Sub,
  SubTrigger: RadixDropdownMenu.SubTrigger,
  SubContent: DropdownMenuSubContent,
};
