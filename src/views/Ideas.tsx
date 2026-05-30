import React from 'react';
import { useAppStore } from '../store';
import { ZapIcon as Zap, Add01Icon as Plus } from 'hugeicons-react';
import { cn } from '../utils/cn';

export function Ideas() {
  const { ideas } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--tokyo-hover)] rounded-xl text-[var(--tokyo-text)]">
            <Zap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ideas</h1>
        </div>
        <button className="bg-[var(--tokyo-yellow-dim)] hover:bg-[var(--tokyo-yellow)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Idea
        </button>
      </header>

      <div className="grid items-start gap-3 overflow-auto no-scrollbar pb-4 sm:grid-cols-2 xl:grid-cols-3">
        {ideas.map(idea => (
          <button
            key={idea.id}
            type="button"
            className="group relative w-full overflow-hidden rounded-lg border border-[var(--tokyo-border)] bg-[linear-gradient(180deg,rgba(31,23,38,0.78),rgba(17,10,23,0.88))] p-4 text-left shadow-[0_18px_46px_rgba(0,0,0,0.18)] transition-[border-color,background-color] duration-150 hover:border-[var(--tokyo-border-strong)] hover:bg-[var(--tokyo-panel-2)]"
          >
            <div className="relative flex min-h-full flex-col">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[var(--tokyo-text-muted)] transition-colors group-hover:text-[var(--tokyo-text)]">
                  <Zap className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[17px] font-semibold leading-snug text-[var(--tokyo-text-strong)]">
                    {idea.title}
                  </div>
                </div>
              </div>

              <div className="mb-4 mt-3">
                {idea.description ? (
                  <p className="line-clamp-2 text-[13px] font-medium leading-6 text-[var(--tokyo-text-muted)]">
                    {idea.description}
                  </p>
                ) : (
                  <p className="line-clamp-2 text-[13px] font-medium leading-6 text-[var(--tokyo-text-faint)]">
                    Add notes or a description to show card content here.
                  </p>
                )}
              </div>

              <div className="pt-1">
                {idea.tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {idea.tags.map(tag => (
                      <span key={tag} className="flex h-6 items-center rounded-md bg-white/[0.035] px-2 text-[12px] font-semibold leading-[1] text-[var(--tokyo-text)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="h-5" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
