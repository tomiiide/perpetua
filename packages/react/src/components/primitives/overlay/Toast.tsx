import { forwardRef } from "react";
import * as RadixToast from "@radix-ui/react-toast";

export type ToastViewportProps = RadixToast.ToastViewportProps;

export const ToastViewport = forwardRef<HTMLOListElement, ToastViewportProps>(
  ({ className, ...rest }, ref) => (
    <RadixToast.Viewport ref={ref} className={className} {...rest} />
  ),
);
ToastViewport.displayName = "ToastViewport";

export const Toast = {
  Provider: RadixToast.Provider,
  Viewport: ToastViewport,
  Root: RadixToast.Root,
  Title: RadixToast.Title,
  Description: RadixToast.Description,
  Action: RadixToast.Action,
  Close: RadixToast.Close,
};
