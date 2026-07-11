import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export interface EmptyStateProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title"> {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon, title, description, action, ...rest },
  ref,
) {
  return (
    <div ref={ref} data-empty-state {...rest}>
      {icon !== undefined && <div data-part="icon">{icon}</div>}
      <div data-part="title">{title}</div>
      {description !== undefined && <div data-part="description">{description}</div>}
      {action !== undefined && <div data-part="action">{action}</div>}
    </div>
  );
});
