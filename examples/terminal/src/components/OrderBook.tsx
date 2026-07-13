import type { BookLevel, BookState, Market, Side } from "@perpetua/core";
import { formatPrice, formatSize } from "@perpetua/core";
import { FlashCell, Num, SegmentedControl, StatusDot } from "@perpetua/react/components";
import { numericCompare } from "../lib/format";

export interface OrderBookProps {
  book: BookState | null;
  market: Market;
  grouping: string;
  groupings: string[];
  onGrouping: (g: string) => void;
}

function cumulative(levels: BookLevel[]): number[] {
  let acc = 0;
  return levels.map((l) => (acc += Number(l.size)));
}

interface RowProps {
  level: BookLevel;
  cum: number;
  max: number;
  side: Side;
  market: Market;
}

function Row({ level, cum, max, side, market }: RowProps) {
  const pct = max > 0 ? Math.min(100, (cum / max) * 100) : 0;
  return (
    <div className="book__row" data-side={side}>
      <div className="book__depth" style={{ width: `${pct}%` }} />
      <FlashCell value={level.size} compare={numericCompare} className="book__size">
        <Num parts={formatSize(level.size, market)} />
      </FlashCell>
      <span className="book__price">
        <Num parts={formatPrice(level.price, market)} />
      </span>
    </div>
  );
}

export function OrderBook({ book, market, grouping, groupings, onGrouping }: OrderBookProps) {
  const asks = book?.asks ?? [];
  const bids = book?.bids ?? [];
  const cumAsks = cumulative(asks);
  const cumBids = cumulative(bids);
  const max = Math.max(cumAsks[cumAsks.length - 1] ?? 0, cumBids[cumBids.length - 1] ?? 0, 1);

  const groupingOptions = groupings.map((g) => ({ value: g, label: g }));

  return (
    <div className="book">
      <div className="book__toolbar">
        <SegmentedControl
          className="book__grouping"
          options={groupingOptions}
          value={grouping}
          onValueChange={onGrouping}
        />
        <StatusDot status={book?.status ?? "connecting"} label={book?.status ?? "connecting"} className="book__status" />
      </div>

      <div className="book__colhead">
        <span>Size ({market.base})</span>
        <span>Price ({market.quote})</span>
      </div>

      <div className="book__side book__side--asks">
        {asks
          .map((level, i) => ({ level, cum: cumAsks[i] ?? 0 }))
          .reverse()
          .map(({ level, cum }) => (
            <Row key={`a-${level.price}`} level={level} cum={cum} max={max} side="sell" market={market} />
          ))}
      </div>

      <div className="book__mid">
        <FlashCell value={book?.mid ?? ""} compare={numericCompare} className="book__mid-price">
          {book?.mid ? <Num parts={formatPrice(book.mid, market)} /> : <span>—</span>}
        </FlashCell>
        <span className="book__spread">
          {book?.spread ? (
            <>
              <Num parts={formatPrice(book.spread, market)} />
              <span className="book__spread-pct">
                {book.spreadPct != null ? ` ${(book.spreadPct * 100).toFixed(3)}%` : ""}
              </span>
            </>
          ) : (
            "spread —"
          )}
        </span>
      </div>

      <div className="book__side book__side--bids">
        {bids.map((level, i) => (
          <Row key={`b-${level.price}`} level={level} cum={cumBids[i] ?? 0} max={max} side="buy" market={market} />
        ))}
      </div>
    </div>
  );
}
