import { forwardRef } from "react";
import * as RadixPopover from "@radix-ui/react-popover";

export type PopoverContentProps = RadixPopover.PopoverContentProps;

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, ...rest }, ref) => (
    <RadixPopover.Portal>
      <RadixPopover.Content ref={ref} className={className} {...rest} />
    </RadixPopover.Portal>
  ),
);
PopoverContent.displayName = "PopoverContent";

export const Popover = {
  Root: RadixPopover.Root,
  Trigger: RadixPopover.Trigger,
  Anchor: RadixPopover.Anchor,
  Portal: RadixPopover.Portal,
  Content: PopoverContent,
  Close: RadixPopover.Close,
  Arrow: RadixPopover.Arrow,
};
