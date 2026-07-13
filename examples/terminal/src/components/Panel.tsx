import type { ReactNode } from "react";

export interface PanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, actions, children, className }: PanelProps) {
  return (
    <section className={`panel${className ? ` ${className}` : ""}`}>
      <header className="panel__head">
        <span className="panel__title">{title}</span>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </header>
      <div className="panel__body">{children}</div>
    </section>
  );
}
