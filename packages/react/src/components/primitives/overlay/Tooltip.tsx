import { forwardRef } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

export type TooltipContentProps = RadixTooltip.TooltipContentProps;

export const TooltipContent = forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, ...rest }, ref) => (
    <RadixTooltip.Portal>
      <RadixTooltip.Content ref={ref} className={className} {...rest} />
    </RadixTooltip.Portal>
  ),
);
TooltipContent.displayName = "TooltipContent";

export const Tooltip = {
  Provider: RadixTooltip.Provider,
  Root: RadixTooltip.Root,
  Trigger: RadixTooltip.Trigger,
  Portal: RadixTooltip.Portal,
  Content: TooltipContent,
  Arrow: RadixTooltip.Arrow,
};
