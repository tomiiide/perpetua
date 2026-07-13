import type { Candle } from "@perpetua/core";

export interface ChartProps {
  candles: Candle[];
}

const W = 1000;
const H = 320;
const PAD_Y = 18;

export function Chart({ candles }: ChartProps) {
  if (candles.length < 2) {
    return <div className="chart chart--empty">Loading chart…</div>;
  }

  const lows = candles.map((c) => Number(c.low));
  const highs = candles.map((c) => Number(c.high));
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;
  const colW = W / candles.length;
  const y = (p: number) => PAD_Y + (H - 2 * PAD_Y) * (1 - (p - min) / range);

  const last = candles[candles.length - 1]!;
  const lastClose = Number(last.close);
  const lastUp = lastClose >= Number(last.open);
  const axis = [max, (max + min) / 2, min];

  return (
    <div className="chart">
      <svg className="chart__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {candles.map((c, i) => {
          const up = Number(c.close) >= Number(c.open);
          const cx = i * colW + colW / 2;
          const bw = Math.max(1.2, colW * 0.62);
          const openY = y(Number(c.open));
          const closeY = y(Number(c.close));
          const top = Math.min(openY, closeY);
          const h = Math.max(0.6, Math.abs(closeY - openY));
          return (
            <g key={c.ts} className={up ? "candle candle--up" : "candle candle--down"}>
              <line
                x1={cx}
                x2={cx}
                y1={y(Number(c.high))}
                y2={y(Number(c.low))}
                vectorEffect="non-scaling-stroke"
              />
              <rect x={cx - bw / 2} y={top} width={bw} height={h} />
            </g>
          );
        })}
        <line
          className="chart__last"
          x1={0}
          x2={W}
          y1={y(lastClose)}
          y2={y(lastClose)}
          vectorEffect="non-scaling-stroke"
          data-delta={lastUp ? "up" : "down"}
        />
      </svg>
      <div className="chart__axis">
        {axis.map((p, i) => (
          <span key={i} style={{ top: `${(y(p) / H) * 100}%` }}>
            {p.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        ))}
      </div>
    </div>
  );
}
