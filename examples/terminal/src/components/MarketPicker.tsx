import { useEffect, useMemo, useRef, useState } from "react";
import type { Market, MarketId } from "@perpetua/core";
import { SearchInput } from "@perpetua/react/components";

export interface MarketPickerProps {
  markets: Market[];
  value: Market | null;
  onSelect: (id: MarketId) => void;
}

export function MarketPicker({ markets, value, onSelect }: MarketPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q ? markets.filter((m) => m.symbol.toLowerCase().includes(q)) : markets;
    return rows.slice(0, 80);
  }, [markets, query]);

  return (
    <div className="picker" ref={ref}>
      <button
        type="button"
        className="picker__trigger"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="picker__symbol">{value ? value.symbol : "Select market"}</span>
        <span className="picker__caret" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="picker__menu">
          <SearchInput value={query} onChange={setQuery} placeholder="Search markets…" autoFocus />
          <ul className="picker__list">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  data-active={value?.id === m.id ? "" : undefined}
                  onClick={() => {
                    onSelect(m.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span>{m.symbol}</span>
                  <span className="picker__lev">{m.maxLeverage ? `${m.maxLeverage}×` : ""}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? <li className="picker__empty">No markets</li> : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
