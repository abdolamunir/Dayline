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
    <header className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.035] text-white/45">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[22px] font-semibold leading-tight tracking-normal text-[#E9E6DF] md:text-2xl">
              {title}
            </h1>
            {typeof count === 'number' && (
              <span className="rounded-md border border-white/[0.06] bg-white/[0.035] px-1.5 py-0.5 text-[11px] font-medium text-white/35">
                {count}
              </span>
            )}
          </div>
          {description && <p className="mt-1 text-sm text-white/42">{description}</p>}
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
        "inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-transparent px-2.5 text-sm font-medium text-white/45 transition-colors hover:border-white/[0.06] hover:bg-white/[0.045] hover:text-white/80 disabled:pointer-events-none disabled:opacity-40",
        active && "border-white/[0.08] bg-white/[0.07] text-white/85",
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
        "inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#D7CCC0] px-3 text-sm font-semibold text-[#171513] transition-colors hover:bg-[#EEE5D8] active:bg-[#C8BAAC]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DatabasePanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-white/[0.06] bg-[#1C1B19]", className)}>
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
    <div className="mb-3 flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-sm font-medium text-white/42 transition-colors hover:text-white/70",
            activeId === tab.id && "text-[#E9E6DF]"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {typeof tab.count === 'number' && <span className="text-[11px] text-white/28">{tab.count}</span>}
          {activeId === tab.id && <span className="absolute inset-x-0 bottom-[-1px] h-px bg-[#D7CCC0]" />}
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
      {icon && <div className="text-white/18">{icon}</div>}
      <div>
        <h3 className="text-sm font-semibold text-white/62">{title}</h3>
        {description && <p className="mt-1 max-w-sm text-sm text-white/32">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <ToolButton onClick={onAction} className="mt-1 border-white/[0.06] bg-white/[0.035]">
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
    green: "bg-emerald-500/12 text-emerald-300 ring-emerald-400/10",
    blue: "bg-sky-500/12 text-sky-300 ring-sky-400/10",
    orange: "bg-orange-500/12 text-orange-300 ring-orange-400/10",
    red: "bg-rose-500/12 text-rose-300 ring-rose-400/10",
    gray: "bg-white/[0.045] text-white/45 ring-white/[0.06]",
    yellow: "bg-yellow-500/12 text-yellow-200 ring-yellow-300/10",
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-[12px] font-medium ring-1 transition-opacity",
        onClick && "cursor-pointer hover:opacity-80",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
