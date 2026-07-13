import type { Market, Trade } from "@perpetua/core";
import { formatPrice, formatSize } from "@perpetua/core";
import { Num } from "@perpetua/react/components";
import { fmtTime } from "../lib/format";

export interface TradesFeedProps {
  trades: Trade[];
  market: Market;
}

export function TradesFeed({ trades, market }: TradesFeedProps) {
  return (
    <div className="tape">
      <div className="tape__colhead">
        <span>Price ({market.quote})</span>
        <span>Size ({market.base})</span>
        <span>Time</span>
      </div>
      <div className="tape__rows">
        {trades.map((t) => (
          <div key={t.id} className="tape__row" data-side={t.side ?? "buy"}>
            <span className="tape__price">
              <Num parts={formatPrice(t.price, market)} />
            </span>
            <span className="tape__size">
              <Num parts={formatSize(t.size, market)} />
            </span>
            <span className="tape__time">{fmtTime(t.ts)}</span>
          </div>
        ))}
        {trades.length === 0 ? <div className="tape__pending">Waiting for trades…</div> : null}
      </div>
    </div>
  );
}
