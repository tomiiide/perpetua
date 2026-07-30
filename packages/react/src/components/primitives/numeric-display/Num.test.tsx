import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { formatPrice } from "@perpetua/core";
import type { FormattedParts } from "@perpetua/core";
import { Num as ExportedNum } from "../../index.js";
import { Num } from "./Num.js";

describe("Num", () => {
  it("is exported from the components surface", () => {
    expect(ExportedNum).toBe(Num);
  });

  it("renders formatter parts into addressable spans", () => {
    const parts: FormattedParts = { sign: "-", int: "1,234", frac: "56", unit: "USD", text: "-1,234.56 USD" };
    const html = renderToStaticMarkup(<Num parts={parts} />);
    expect(html).toContain('<span data-part="sign">-</span>');
    expect(html).toContain('<span data-part="int">1,234</span>');
    expect(html).toContain('<span data-part="frac">.56</span>');
    expect(html).toContain('<span data-part="unit">USD</span>');
  });

  it("renders core formatPrice output with tick-derived precision", () => {
    const html = renderToStaticMarkup(<Num parts={formatPrice("50123.5", { tickSize: "0.5" })} />);
    expect(html).toContain('<span data-part="int">50,123</span>');
    expect(html).toContain('<span data-part="frac">.5</span>');
  });

  it("omits the frac span when there are no decimals", () => {
    const html = renderToStaticMarkup(<Num parts={formatPrice("42", { tickSize: "1" })} />);
    expect(html).toContain('<span data-part="int">42</span>');
    expect(html).not.toContain('data-part="frac"');
  });

  it("throws without parts or a value/format pair", () => {
    expect(() => renderToStaticMarkup(<Num />)).toThrow(/parts/);
  });
});
