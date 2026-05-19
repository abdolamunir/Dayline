import React from 'react';
import { Add01Icon as Plus, Search01Icon as Search } from 'hugeicons-react';
import { cn } from '../../utils/cn';

export function WorkspacePage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 p-4 pt-7 md:px-8 md:pb-8 md:pt-10", className)}>
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
    <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-5">
        {icon && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] transition-colors">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <h1 className="min-w-0 truncate text-2xl font-semibold leading-tight tracking-tight text-[var(--tokyo-text-strong)] md:text-[28px]">
              {title}
            </h1>
            {typeof count === 'number' && (
              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-hover)] px-2 text-[13px] font-semibold text-[var(--tokyo-text-faint)]">
                {count}
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm leading-normal text-[var(--tokyo-text-muted)] md:text-[15px]">{description}</p>}
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
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--tokyo-yellow-dim)] px-3 text-[12px] font-medium text-[var(--tokyo-text-strong)] transition-all hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] active:scale-95 active:bg-[var(--tokyo-yellow-dim)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DatabasePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-visible bg-transparent", className)}>
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
    <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--tokyo-border)] pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 rounded-lg py-1.5 pl-[5px] pr-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            activeId === tab.id
              ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]"
              : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
          )}
        >
          {tab.icon && <span className="flex h-6 w-6 items-center justify-center rounded">{tab.icon}</span>}
          <span>{tab.label}</span>
          {typeof tab.count === 'number' && <span className="text-[11px] text-[var(--tokyo-text-faint)]">{tab.count}</span>}
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
