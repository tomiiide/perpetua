import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import * as RadixSwitch from "@radix-ui/react-switch";

export interface SwitchProps extends ComponentPropsWithoutRef<typeof RadixSwitch.Root> {
  label?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { label, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  const control = (
    <RadixSwitch.Root ref={ref} id={resolvedId} data-switch {...rest}>
      <RadixSwitch.Thumb data-switch-thumb />
    </RadixSwitch.Root>
  );

  if (!label) return control;

  return (
    <div data-switch-field>
      {control}
      <label htmlFor={resolvedId}>{label}</label>
    </div>
  );
});
