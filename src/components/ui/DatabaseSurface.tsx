import React from 'react';
import { Add01Icon as Plus, Search01Icon as Search } from 'hugeicons-react';
import { cn } from '../../utils/cn';

export function WorkspacePage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-4 md:px-7 md:py-6", className)}>
      {children}
    </div>
  );
}

export function WorkspaceHeader({
  icon,
  title,
  description,
  count,
  actions,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-col gap-3 border-b border-[var(--tokyo-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)] text-[var(--tokyo-yellow)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[22px] font-extrabold leading-tight tracking-normal text-[var(--tokyo-text-strong)] md:text-2xl">
              {title}
            </h1>
            {typeof count === 'number' && (
              <span className="rounded border border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--tokyo-text-faint)]">
                {count}
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm font-medium text-[var(--tokyo-text-faint)]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

export function ToolButton({
  children,
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-transparent px-2.5 text-sm font-bold text-[var(--tokyo-text-muted)] transition-colors hover:border-[var(--tokyo-border)] hover:bg-[var(--tokyo-panel-2)] hover:text-[var(--tokyo-text-strong)] disabled:pointer-events-none disabled:opacity-40",
        active && "border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-3)] text-[var(--tokyo-text-strong)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-2 rounded-md bg-[var(--tokyo-yellow-dim)] px-3 text-sm font-extrabold text-[var(--tokyo-text-strong)] transition-colors hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] active:bg-[var(--tokyo-yellow-dim)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DatabasePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-md border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)]", className)}>
      {children}
    </div>
  );
}

export function ViewTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode; count?: number }>;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-[var(--tokyo-border)] pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-sm font-bold text-[var(--tokyo-text-muted)] transition-colors hover:text-[var(--tokyo-text-strong)]",
            activeId === tab.id && "text-[var(--tokyo-text-strong)]"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {typeof tab.count === 'number' && <span className="text-[11px] text-[var(--tokyo-text-faint)]">{tab.count}</span>}
          {activeId === tab.id && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[var(--tokyo-yellow)]" />}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
      {icon && <div className="text-[var(--tokyo-text-faint)]">{icon}</div>}
      <div>
        <h3 className="text-sm font-bold text-[var(--tokyo-text)]">{title}</h3>
        {description && <p className="mt-1 max-w-sm text-sm text-[var(--tokyo-text-faint)]">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <ToolButton onClick={onAction} className="mt-1 border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)]">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </ToolButton>
      )}
    </div>
  );
}

export function SearchButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ToolButton {...props} title={props.title || 'Search'}>
      <Search className="h-4 w-4" />
    </ToolButton>
  );
}

export function StatusPill({ tone, children, onClick }: { tone: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'yellow'; children: React.ReactNode; onClick?: React.MouseEventHandler }) {
  const tones = {
    green: "bg-[rgba(44,88,64,0.48)] text-[#9fddb4]",
    blue: "bg-[rgba(117,83,147,0.32)] text-[#bda3d2]",
    orange: "bg-[rgba(112,88,26,0.52)] text-[#ead66c]",
    red: "bg-[rgba(112,31,45,0.54)] text-[#f0a0a8]",
    gray: "bg-[var(--tokyo-panel-2)] text-[var(--tokyo-text-muted)]",
    yellow: "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]",
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center rounded px-2 text-[12px] font-bold transition-opacity",
        onClick && "cursor-pointer hover:opacity-80",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
