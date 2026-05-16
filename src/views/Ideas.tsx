import React from 'react';
import { useAppStore } from '../store';
import { ZapIcon as Zap, Add01Icon as Plus } from 'hugeicons-react';

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map(idea => (
          <div key={idea.id} className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">{idea.title}</h3>
            <p className="text-[var(--tokyo-text-muted)] text-sm leading-relaxed">{idea.description}</p>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-[var(--tokyo-hover)] rounded text-xs font-medium text-[var(--tokyo-text-faint)]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
