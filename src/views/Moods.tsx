import React from 'react';
import { useAppStore } from '../store';
import { SmileIcon as Smile, Add01Icon as Plus } from 'hugeicons-react';

export function Moods() {
  const { moods } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--tokyo-hover)] rounded-xl text-[var(--tokyo-text)]">
            <Smile className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Moods</h1>
        </div>
        <button className="bg-[var(--tokyo-yellow-dim)] hover:bg-[var(--tokyo-yellow)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Mood
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {moods.map(mood => (
          <div key={mood.id} className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-[var(--tokyo-text-faint)]">
              <Smile className="h-5 w-5 [stroke-width:2.1]" />
            </div>
            <div className="text-sm font-medium capitalize text-[var(--tokyo-text)]">{mood.type}</div>
            <div className="text-xs font-medium text-[var(--tokyo-text-faint)]">{mood.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
