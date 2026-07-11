import { forwardRef } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

export type DialogOverlayProps = RadixDialog.DialogOverlayProps;

export const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...rest }, ref) => (
    <RadixDialog.Portal>
      <RadixDialog.Overlay ref={ref} className={className} {...rest} />
    </RadixDialog.Portal>
  ),
);
DialogOverlay.displayName = "DialogOverlay";

export type DialogContentProps = RadixDialog.DialogContentProps;

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, ...rest }, ref) => (
    <RadixDialog.Portal>
      <RadixDialog.Content ref={ref} className={className} {...rest} />
    </RadixDialog.Portal>
  ),
);
DialogContent.displayName = "DialogContent";

export const Dialog = {
  Root: RadixDialog.Root,
  Trigger: RadixDialog.Trigger,
  Portal: RadixDialog.Portal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: RadixDialog.Title,
  Description: RadixDialog.Description,
  Close: RadixDialog.Close,
};
