import { useEffect, useMemo, useState } from "react";
import type { MarketId, Resolution } from "@perpetua/core";
import { SegmentedControl, StatusDot } from "@perpetua/react/components";
import { capabilities } from "./lib/perpetua";
import { groupingPresets } from "./lib/format";
import { useMarkets } from "./hooks/useMarkets";
import { useOrderBook } from "./hooks/useOrderBook";
import { useTrades } from "./hooks/useTrades";
import { useTicker } from "./hooks/useTicker";
import { useCandles } from "./hooks/useCandles";
import { Panel } from "./components/Panel";
import { MarketPicker } from "./components/MarketPicker";
import { TickerBar } from "./components/TickerBar";
import { Chart } from "./components/Chart";
import { OrderBook } from "./components/OrderBook";
import { TradesFeed } from "./components/TradesFeed";
import { OrderEntryPanel } from "./components/OrderEntryPanel";
import { Blotter } from "./components/Blotter";

const RESOLUTIONS: Resolution[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function App() {
  const markets = useMarkets();
  const [marketId, setMarketId] = useState<MarketId | null>(null);
  const [resolution, setResolution] = useState<Resolution>("15m");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");

  useEffect(() => {
    if (marketId || markets.length === 0) return;
    const preferred = markets.find((m) => m.symbol.startsWith("BTC")) ?? markets[0];
    if (preferred) setMarketId(preferred.id);
  }, [markets, marketId]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);

  const market = useMemo(() => markets.find((m) => m.id === marketId) ?? null, [markets, marketId]);

  const groupings = useMemo(() => (market ? groupingPresets(market.tickSize) : []), [market]);
  const [grouping, setGrouping] = useState<string | null>(null);
  useEffect(() => {
    setGrouping(groupings[1] ?? groupings[0] ?? null);
  }, [market?.id, groupings]);

  const book = useOrderBook(marketId, grouping ?? undefined);
  const trades = useTrades(marketId);
  const ticker = useTicker(marketId);
  const candles = useCandles(marketId, resolution);
  const closes = useMemo(() => candles.map((c) => Number(c.close)), [candles]);

  return (
    <div className="app">
      <header className="app__topbar">
        <div className="app__brand">
          <span className="app__logo">◆</span>
          <span className="app__wordmark">PERPETUA</span>
          <span className="app__tag">terminal</span>
        </div>
        <MarketPicker markets={markets} value={market} onSelect={setMarketId} />
        <div className="app__spacer" />
        <div className="app__controls">
          <StatusDot
            status={book?.status ?? (marketId ? "connecting" : "error")}
            label={book?.status ?? "connecting"}
          />
          <button
            type="button"
            className="app__toggle"
            onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
          >
            {density === "compact" ? "Compact" : "Comfortable"}
          </button>
          <button
            type="button"
            className="app__toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      {market ? <TickerBar market={market} ticker={ticker} closes={closes} /> : null}

      {market ? (
        <main className="workspace">
          <Panel
            className="panel--chart"
            title={`${market.symbol} · ${resolution}`}
            actions={
              <SegmentedControl
                options={RESOLUTIONS.map((r) => ({ value: r, label: r }))}
                value={resolution}
                onValueChange={(v) => setResolution(v as Resolution)}
              />
            }
          >
            <Chart candles={candles} />
          </Panel>

          <Panel className="panel--book" title="Order Book">
            {grouping ? (
              <OrderBook
                book={book}
                market={market}
                grouping={grouping}
                groupings={groupings}
                onGrouping={setGrouping}
              />
            ) : null}
          </Panel>

          <Panel className="panel--trades" title="Trades">
            <TradesFeed trades={trades} market={market} />
          </Panel>

          <Panel className="panel--entry" title="Order Entry">
            <OrderEntryPanel market={market} prices={ticker.prices} tifs={capabilities.tifs} />
          </Panel>

          <Panel className="panel--blotter" title="Account">
            <Blotter />
          </Panel>
        </main>
      ) : (
        <div className="app__loading">Connecting to Hyperliquid…</div>
      )}
    </div>
  );
}
