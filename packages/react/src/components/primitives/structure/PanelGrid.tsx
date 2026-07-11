import { Fragment, forwardRef, useCallback, useRef, useState } from "react";
import type { ForwardedRef, ComponentPropsWithoutRef, PointerEvent as ReactPointerEvent, ReactNode } from "react";

export type PanelGridNode =
  | { type: "panel"; id: string; content: ReactNode }
  | { type: "split"; direction: "row" | "column"; size?: number; children: PanelGridNode[] };

export interface PanelGridProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  layout: PanelGridNode;
  sizes?: Record<string, number>;
  onSizesChange?: (sizes: Record<string, number>) => void;
  minSizePercent?: number;
}

type SizesUpdater = (updater: (prev: Record<string, number>) => Record<string, number>) => void;

interface DividerProps {
  direction: "row" | "column";
  leftKey: string;
  rightKey: string;
  leftPercent: number;
  rightPercent: number;
  minSizePercent: number;
  updateSizes: SizesUpdater;
}

function PanelGridDivider({
  direction,
  leftKey,
  rightKey,
  leftPercent,
  rightPercent,
  minSizePercent,
  updateSizes,
}: DividerProps) {
  const dragRef = useRef<{
    startPos: number;
    containerSize: number;
    startLeft: number;
    startRight: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const container = e.currentTarget.parentElement;
      const rect = container?.getBoundingClientRect();
      const containerSize = direction === "row" ? (rect?.width ?? 1) : (rect?.height ?? 1);
      dragRef.current = {
        startPos: direction === "row" ? e.clientX : e.clientY,
        containerSize,
        startLeft: leftPercent,
        startRight: rightPercent,
      };
    },
    [direction, leftPercent, rightPercent],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const pos = direction === "row" ? e.clientX : e.clientY;
      const deltaPercent = ((pos - drag.startPos) / drag.containerSize) * 100;
      const pairTotal = drag.startLeft + drag.startRight;
      const nextLeft = Math.min(
        pairTotal - minSizePercent,
        Math.max(minSizePercent, drag.startLeft + deltaPercent),
      );
      const nextRight = pairTotal - nextLeft;
      updateSizes((prev) => ({ ...prev, [leftKey]: nextLeft, [rightKey]: nextRight }));
    },
    [direction, leftKey, rightKey, minSizePercent, updateSizes],
  );

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  return (
    <div
      data-panel-divider
      data-direction={direction}
      style={{
        touchAction: "none",
        flex: "0 0 auto",
        width: direction === "row" ? 4 : "100%",
        height: direction === "row" ? "100%" : 4,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}

function renderNode(
  node: PanelGridNode,
  path: string,
  sizes: Record<string, number>,
  updateSizes: SizesUpdater,
  minSizePercent: number,
): ReactNode {
  if (node.type === "panel") {
    return (
      <div key={path} data-panel-id={node.id} style={{ width: "100%", height: "100%" }}>
        {node.content}
      </div>
    );
  }

  const { direction, children } = node;
  const keys = children.map((_, i) => `${path}.${i}`);
  const defaultShare = 100 / children.length;
  const rawPercents = children.map((child, i) => {
    const key = keys[i] as string;
    const hint = child.type === "split" ? child.size : undefined;
    return sizes[key] ?? hint ?? defaultShare;
  });
  const total = rawPercents.reduce((sum, p) => sum + p, 0);
  const percents = rawPercents.map((p) => (total > 0 ? (p / total) * 100 : defaultShare));

  return (
    <div
      key={path}
      data-panel-split
      data-direction={direction}
      style={{ display: "flex", flexDirection: direction, width: "100%", height: "100%" }}
    >
      {children.map((child, i) => {
        const key = keys[i] as string;
        const percent = percents[i] as number;
        return (
          <Fragment key={key}>
            <div style={{ flex: `${percent} 1 0%`, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
              {renderNode(child, key, sizes, updateSizes, minSizePercent)}
            </div>
            {i < children.length - 1 && (
              <PanelGridDivider
                direction={direction}
                leftKey={key}
                rightKey={keys[i + 1] as string}
                leftPercent={percent}
                rightPercent={percents[i + 1] as number}
                minSizePercent={minSizePercent}
                updateSizes={updateSizes}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// Scope cut: resize-only split panes. No drag-to-rearrange, docking, or tabs (golden-layout
// territory) — that's explicitly out of scope here.
export const PanelGrid = forwardRef<HTMLDivElement, PanelGridProps>(function PanelGrid(
  { layout, sizes, onSizesChange, minSizePercent = 10, style, ...rest },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [internalSizes, setInternalSizes] = useState<Record<string, number>>({});
  const isControlled = sizes !== undefined;
  const effectiveSizes = isControlled ? sizes : internalSizes;

  const updateSizes = useCallback<SizesUpdater>(
    (updater) => {
      if (isControlled) {
        onSizesChange?.(updater(sizes));
      } else {
        setInternalSizes((prev) => {
          const next = updater(prev);
          onSizesChange?.(next);
          return next;
        });
      }
    },
    [isControlled, sizes, onSizesChange],
  );

  return (
    <div ref={ref} data-panel-grid style={{ width: "100%", height: "100%", ...style }} {...rest}>
      {renderNode(layout, "root", effectiveSizes, updateSizes, minSizePercent)}
    </div>
  );
});
