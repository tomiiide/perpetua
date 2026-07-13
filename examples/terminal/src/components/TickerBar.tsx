import type { ReactNode } from "react";
import type { Market } from "@perpetua/core";
import { dec, formatCompact, formatFunding, formatPrice } from "@perpetua/core";
import { CountdownText, Delta, FlashCell, Num, Sparkline } from "@perpetua/react/components";
import type { Ticker } from "../hooks/useTicker";
import { numericCompare } from "../lib/format";

export interface TickerBarProps {
  market: Market;
  ticker: Ticker;
  closes: number[];
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{children}</span>
    </div>
  );
}

export function TickerBar({ market, ticker, closes }: TickerBarProps) {
  const { prices, stats, funding } = ticker;
  const changePct = stats?.change24hPct ?? 0;
  const last = prices?.mark ?? stats?.lastPrice ?? null;

  return (
    <div className="ticker">
      <div className="ticker__price">
        {last ? (
          <FlashCell value={last} compare={numericCompare} className="ticker__last" data-delta={changePct >= 0 ? "up" : "down"}>
            <Num parts={formatPrice(last, market)} />
          </FlashCell>
        ) : (
          <span className="ticker__last ticker__last--pending">—</span>
        )}
        {stats ? <Delta value={dec(String(changePct))} className="ticker__change" aria-label="24h change %" /> : null}
      </div>

      <div className="ticker__stats">
        <Stat label="Mark">{prices?.mark ? <Num parts={formatPrice(prices.mark, market)} /> : "—"}</Stat>
        <Stat label="Oracle">{prices?.oracle ? <Num parts={formatPrice(prices.oracle, market)} /> : "—"}</Stat>
        <Stat label="24h High">{stats ? <Num parts={formatPrice(stats.high24h, market)} /> : "—"}</Stat>
        <Stat label="24h Low">{stats ? <Num parts={formatPrice(stats.low24h, market)} /> : "—"}</Stat>
        <Stat label="24h Vol">{stats ? <Num parts={formatCompact(stats.vol24h)} /> : "—"}</Stat>
        <Stat label="Open Interest">
          {stats?.openInterest ? <Num parts={formatCompact(stats.openInterest)} /> : "—"}
        </Stat>
        <Stat label="Funding">
          {funding ? (
            <span className="ticker__funding" data-delta={Number(funding.rate) >= 0 ? "up" : "down"}>
              <Num parts={formatFunding(funding.rate, "percent")} />
            </span>
          ) : (
            "—"
          )}
        </Stat>
        <Stat label="Next Funding">
          {funding?.nextAt ? <CountdownText target={funding.nextAt} /> : "—"}
        </Stat>
      </div>

      <div className="ticker__spark">
        {closes.length > 1 ? (
          <Sparkline
            values={closes}
            width={132}
            height={34}
            data-delta={closes[closes.length - 1]! >= closes[0]! ? "up" : "down"}
          />
        ) : null}
      </div>
    </div>
  );
}
