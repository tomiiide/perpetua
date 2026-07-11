import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { NumericInput } from "./NumericInput.js";
import type { NumericInputProps } from "./NumericInput.js";

export interface TokenAmountInputProps
  extends Omit<NumericInputProps, "className">,
    Pick<ComponentPropsWithoutRef<"div">, "className" | "style"> {
  asset: string;
  onAssetClick?: () => void;
}

export const TokenAmountInput = forwardRef<HTMLDivElement, TokenAmountInputProps>(function TokenAmountInput(
  { asset, onAssetClick, className, style, ...inputProps },
  ref,
) {
  return (
    <div ref={ref} data-token-amount-input className={className} style={style}>
      <button type="button" data-asset-button onClick={onAssetClick}>
        {asset}
      </button>
      <NumericInput {...inputProps} />
    </div>
  );
});
