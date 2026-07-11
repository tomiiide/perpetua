import { forwardRef, useRef } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from "react";

export interface SearchInputProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, icon, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  const setRefs = (el: HTMLInputElement | null) => {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = el;
  };

  const handleClear = () => {
    onChange("");
    innerRef.current?.focus();
  };

  return (
    <div data-search-input>
      {icon && <span data-search-icon>{icon}</span>}
      <input
        ref={setRefs}
        type="search"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        {...rest}
      />
      {value && (
        <button type="button" data-search-clear onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
});
