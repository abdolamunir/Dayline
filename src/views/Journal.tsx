import React from 'react';
import { useAppStore } from '../store';
import { Book01Icon as Book, Add01Icon as Plus } from 'hugeicons-react';

export function Journal() {
  const { journal } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--tokyo-hover)] rounded-xl text-[var(--tokyo-text)]">
            <Book className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Journal</h1>
        </div>
        <button className="bg-[var(--tokyo-yellow-dim)] hover:bg-[var(--tokyo-yellow)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </header>

      <div className="space-y-6">
        {journal.map(entry => (
          <div key={entry.id} className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-2xl p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">{entry.title}</h3>
              <span className="text-sm text-[var(--tokyo-text-faint)]">{entry.date}</span>
            </div>
            <p className="text-white/70 text-lg leading-relaxed">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
