import { forwardRef, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";

export interface CheckboxProps extends ComponentPropsWithoutRef<typeof RadixCheckbox.Root> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;

  const control = (
    <RadixCheckbox.Root ref={ref} id={resolvedId} data-checkbox {...rest}>
      <RadixCheckbox.Indicator data-checkbox-indicator />
    </RadixCheckbox.Root>
  );

  if (!label) return control;

  return (
    <div data-checkbox-field>
      {control}
      <label htmlFor={resolvedId}>{label}</label>
    </div>
  );
});
