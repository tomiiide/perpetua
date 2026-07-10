/** Structured output so UIs can style sign/integer/decimal pieces independently (SPEC.md §Formatting). */
export interface FormattedParts {
  sign: "+" | "-" | "";
  int: string;
  frac: string;
  unit: string;
  text: string;
}
