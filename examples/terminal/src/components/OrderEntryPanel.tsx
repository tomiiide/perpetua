import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Market, Prices, Side, Tif } from "@perpetua/core";
import {
  dec,
  decDiv,
  decIsPositive,
  decMul,
  decRoundToStep,
  decToString,
  formatPrice,
  liqPrice,
  marginRequired,
  ZERO,
} from "@perpetua/core";
import {
  Num,
  NumericInput,
  PercentButtonGroup,
  SegmentedControl,
  SideToggle,
  SteppedSlider,
  Switch,
} from "@perpetua/react/components";

export interface OrderEntryPanelProps {
  market: Market;
  prices: Prices | null;
  tifs: Tif[];
}

/** Read-only demo constants — there is no account venue, so these stand in for real margin state. */
const DEMO_EQUITY = "10000";
const MAINTENANCE_MARGIN_RATE = "0.005";

type OrderType = "limit" | "market" | "stopLimit";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "limit", label: "Limit" },
  { value: "market", label: "Market" },
  { value: "stopLimit", label: "Stop" },
];

function leverageSteps(maxLeverage: number | null): number[] {
  const cap = maxLeverage ?? 50;
  return [1, 2, 3, 5, 10, 20, 25, 50, 100].filter((s) => s <= cap).concat(cap).filter((v, i, a) => a.indexOf(v) === i);
}

function Summary({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="entry__summary-row">
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

export function OrderEntryPanel({ market, prices, tifs }: OrderEntryPanelProps) {
  const [side, setSide] = useState<Side>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [tif, setTif] = useState<Tif>(tifs[0] ?? "GTC");
  const [reduceOnly, setReduceOnly] = useState(false);

  const steps = useMemo(() => leverageSteps(market.maxLeverage), [market.maxLeverage]);
  const [leverage, setLeverage] = useState(() => Math.min(10, market.maxLeverage ?? 10));

  const mark = prices?.mark ?? null;
  const isMarket = orderType === "market";
  const refPrice = isMarket ? mark : price || mark;

  const tickDec = dec(market.tickSize);
  const lotDec = dec(market.lotSize);

  const derived = useMemo(() => {
    if (!refPrice || !size) return null;
    const refDec = dec(refPrice);
    const sizeDec = dec(size);
    if (!decIsPositive(sizeDec) || !decIsPositive(refDec)) return null;
    const notional = decMul(refDec, sizeDec);
    const margin = marginRequired({ notional: decToString(notional), leverage });
    const feeRate = orderType === "limit" || tif === "ALO" ? market.makerFee : market.takerFee;
    const fee = decMul(notional, dec(feeRate));
    const liq = liqPrice({
      side: side === "buy" ? "long" : "short",
      entryPrice: decToString(refDec),
      size: decToString(sizeDec),
      margin,
      maintenanceMarginRate: MAINTENANCE_MARGIN_RATE,
    });
    return { notional: decToString(notional), margin, fee: decToString(fee), liq };
  }, [refPrice, size, leverage, orderType, tif, side, market.makerFee, market.takerFee]);

  const setSizeFromPct = (pct: number) => {
    if (!refPrice) return;
    const refDec = dec(refPrice);
    if (!decIsPositive(refDec)) return;
    const maxNotional = decMul(dec(DEMO_EQUITY), dec(leverage));
    const maxSize = decDiv(maxNotional, refDec);
    const target = decMul(maxSize, dec(pct / 100));
    setSize(decToString(decRoundToStep(target, lotDec, "down")));
  };

  return (
    <div className="entry">
      <SideToggle value={side} onValueChange={setSide} className="entry__side" data-side={side} />

      <SegmentedControl
        className="entry__type"
        options={ORDER_TYPES}
        value={orderType}
        onValueChange={(v) => setOrderType(v as OrderType)}
      />

      <label className="entry__field">
        <span className="entry__label">Price ({market.quote})</span>
        <NumericInput
          className="entry__input"
          value={isMarket ? "" : price}
          onChange={setPrice}
          placeholder={isMarket ? "Market" : mark ?? "0"}
          disabled={isMarket}
          step={tickDec}
          roundStep={tickDec}
          min={ZERO}
        />
      </label>

      <label className="entry__field">
        <span className="entry__label">Size ({market.base})</span>
        <NumericInput
          className="entry__input"
          value={size}
          onChange={setSize}
          placeholder="0"
          step={lotDec}
          roundStep={lotDec}
          min={ZERO}
        />
      </label>

      <PercentButtonGroup className="entry__pct" onSelect={setSizeFromPct} />

      <div className="entry__field">
        <span className="entry__label">
          Leverage <strong>{leverage}×</strong>
        </span>
        <SteppedSlider
          className="entry__leverage"
          value={leverage}
          onValueChange={setLeverage}
          min={1}
          max={market.maxLeverage ?? 50}
          steps={steps}
        />
      </div>

      <div className="entry__meta">
        <SegmentedControl
          className="entry__tif"
          options={tifs.map((t) => ({ value: t, label: t }))}
          value={tif}
          onValueChange={(v) => setTif(v as Tif)}
        />
        <Switch label="Reduce-only" checked={reduceOnly} onCheckedChange={(v) => setReduceOnly(Boolean(v))} />
      </div>

      <div className="entry__summary">
        <Summary label="Order Value">
          {derived ? <Num parts={formatPrice(derived.notional, market)} /> : "—"}
        </Summary>
        <Summary label={`Margin (${leverage}×)`}>
          {derived ? <Num parts={formatPrice(derived.margin, market)} /> : "—"}
        </Summary>
        <Summary label="Est. Liq. Price">
          {derived?.liq ? <Num parts={formatPrice(derived.liq, market)} /> : "—"}
        </Summary>
        <Summary label="Est. Fee">
          {derived ? <Num parts={formatPrice(derived.fee, market)} /> : "—"}
        </Summary>
      </div>

      <button type="button" className="entry__submit" data-side={side} disabled>
        {side === "buy" ? "Buy / Long" : "Sell / Short"} {market.base}
      </button>
      <p className="entry__note">
        Market-data-only venue — order submission is disabled in this read-only demo.
      </p>
    </div>
  );
}
