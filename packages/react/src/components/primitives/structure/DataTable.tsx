import { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import type {
  ComponentPropsWithoutRef,
  ForwardedRef,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
  render: (row: T) => ReactNode;
}

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableSortState {
  key: string;
  direction: DataTableSortDirection;
}

export interface DataTableProps<T> extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  estimateRowHeight?: number;
  overscan?: number;
  sortState?: DataTableSortState | null;
  onSortChange?: (sortState: DataTableSortState | null) => void;
}

const DEFAULT_COLUMN_WIDTH = 150;
const DEFAULT_MIN_COLUMN_WIDTH = 40;
const DEFAULT_ROW_HEIGHT = 36;

function nextSortState(current: DataTableSortState | null, key: string): DataTableSortState | null {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

interface ResizeDrag {
  columnKey: string;
  startX: number;
  startWidth: number;
  minWidth: number;
}

function DataTableInner<T>(
  {
    columns,
    rows,
    rowKey,
    estimateRowHeight = DEFAULT_ROW_HEIGHT,
    overscan = 8,
    sortState,
    onSortChange,
    ...rest
  }: DataTableProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement {
  // Sorting is uncontrolled (internal useState) unless `sortState` is passed, in which case
  // the parent owns state and must apply the next value via `onSortChange`.
  const [internalSort, setInternalSort] = useState<DataTableSortState | null>(null);
  const isSortControlled = sortState !== undefined;
  const currentSort = isSortControlled ? sortState : internalSort;

  const handleHeaderActivate = useCallback(
    (column: DataTableColumn<T>) => {
      if (!column.sortable) return;
      const next = nextSortState(currentSort, column.key);
      if (!isSortControlled) setInternalSort(next);
      onSortChange?.(next);
    },
    [currentSort, isSortControlled, onSortChange],
  );

  const sortedRows = useMemo(() => {
    if (!currentSort) return rows;
    const column = columns.find((c) => c.key === currentSort.key);
    const accessor = column?.sortAccessor;
    if (!accessor) return rows;
    const dir = currentSort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, currentSort, columns]);

  const [resizedWidths, setResizedWidths] = useState<Record<string, number>>({});
  const widthFor = useCallback(
    (column: DataTableColumn<T>) => resizedWidths[column.key] ?? column.width ?? DEFAULT_COLUMN_WIDTH,
    [resizedWidths],
  );

  const dragRef = useRef<ResizeDrag | null>(null);

  const handleResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, column: DataTableColumn<T>) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        columnKey: column.key,
        startX: e.clientX,
        startWidth: widthFor(column),
        minWidth: column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
      };
    },
    [widthFor],
  );

  const handleResizePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = e.clientX - drag.startX;
    const nextWidth = Math.max(drag.minWidth, drag.startWidth + delta);
    setResizedWidths((prev) => ({ ...prev, [drag.columnKey]: nextWidth }));
  }, []);

  const handleResizePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => bodyScrollRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    getItemKey: (index) => rowKey(sortedRows[index] as T),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  return (
    <div ref={ref} data-datatable {...rest}>
      <div data-datatable-head role="rowgroup">
        <div role="row" data-datatable-row>
          {columns.map((column) => {
            const sortDirection = currentSort?.key === column.key ? currentSort.direction : undefined;
            return (
              <div
                key={column.key}
                role="columnheader"
                data-datatable-header-cell
                data-column={column.key}
                data-sort={sortDirection}
                data-sortable={column.sortable ? "" : undefined}
                aria-sort={
                  !column.sortable
                    ? undefined
                    : sortDirection === "asc"
                      ? "ascending"
                      : sortDirection === "desc"
                        ? "descending"
                        : "none"
                }
                tabIndex={column.sortable ? 0 : undefined}
                style={{ width: widthFor(column), position: "relative" }}
                onClick={column.sortable ? () => handleHeaderActivate(column) : undefined}
                onKeyDown={
                  column.sortable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleHeaderActivate(column);
                        }
                      }
                    : undefined
                }
              >
                {column.header}
                <div
                  data-datatable-resize-handle
                  style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, touchAction: "none" }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => handleResizePointerDown(e, column)}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div data-datatable-body ref={bodyScrollRef} role="rowgroup" style={{ overflow: "auto" }}>
        <div style={{ height: totalSize, position: "relative" }}>
          {virtualItems.map((virtualItem) => {
            const row = sortedRows[virtualItem.index] as T;
            return (
              <div
                key={virtualItem.key}
                role="row"
                data-datatable-row
                data-row-index={virtualItem.index}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    role="cell"
                    data-datatable-cell
                    data-column={column.key}
                    style={{ width: widthFor(column) }}
                  >
                    {column.render(row)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const DataTable = forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: ForwardedRef<HTMLDivElement> },
) => ReactElement;
