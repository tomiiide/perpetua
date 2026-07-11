import { forwardRef, useCallback, useMemo, useRef } from "react";
import type { ComponentPropsWithoutRef, ForwardedRef, ReactElement, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualListProps<T> extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize: number | ((index: number) => number);
  getItemKey?: (item: T, index: number) => string | number;
  overscan?: number;
}

function mergeRefs<T>(...refs: Array<ForwardedRef<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else ref.current = node;
    }
  };
}

function VirtualListInner<T>(
  { items, renderItem, estimateSize, getItemKey, overscan = 5, style, ...rest }: VirtualListProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(scrollElementRef, ref), [ref]);

  const estimateSizeFn = useCallback(
    (index: number) => (typeof estimateSize === "function" ? estimateSize(index) : estimateSize),
    [estimateSize],
  );

  const getItemKeyFn = useMemo(() => {
    if (!getItemKey) return undefined;
    return (index: number) => getItemKey(items[index] as T, index);
  }, [getItemKey, items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: estimateSizeFn,
    overscan,
    ...(getItemKeyFn ? { getItemKey: getItemKeyFn } : {}),
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div ref={mergedRef} data-virtual-list style={{ overflow: "auto", ...style }} {...rest}>
      <div style={{ height: totalSize, width: "100%", position: "relative" }}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index] as T;
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement;
