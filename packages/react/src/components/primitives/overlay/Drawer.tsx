import { forwardRef } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

export type DrawerSide = "left" | "right" | "top" | "bottom";

export type DrawerOverlayProps = RadixDialog.DialogOverlayProps;

export const DrawerOverlay = forwardRef<HTMLDivElement, DrawerOverlayProps>(
  ({ className, ...rest }, ref) => (
    <RadixDialog.Portal>
      <RadixDialog.Overlay ref={ref} className={className} {...rest} />
    </RadixDialog.Portal>
  ),
);
DrawerOverlay.displayName = "DrawerOverlay";

export interface DrawerContentProps extends RadixDialog.DialogContentProps {
  side?: DrawerSide;
}

// No dedicated Radix "drawer" package exists; built on react-dialog with `side`
// threaded through as data-side so theme CSS can position the slide-in panel.
export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ side = "right", className, ...rest }, ref) => (
    <RadixDialog.Portal>
      <RadixDialog.Content
        ref={ref}
        data-side={side}
        className={className}
        {...rest}
      />
    </RadixDialog.Portal>
  ),
);
DrawerContent.displayName = "DrawerContent";

export const Drawer = {
  Root: RadixDialog.Root,
  Trigger: RadixDialog.Trigger,
  Portal: RadixDialog.Portal,
  Overlay: DrawerOverlay,
  Content: DrawerContent,
  Close: RadixDialog.Close,
};
