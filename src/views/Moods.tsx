import React from 'react';
import { useAppStore } from '../store';
import { SmileIcon as Smile, Add01Icon as Plus } from 'hugeicons-react';

export function Moods() {
  const { moods } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-xl text-white/80">
            <Smile className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Moods</h1>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Log Mood
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {moods.map(mood => (
          <div key={mood.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="text-4xl capitalize">{mood.type === 'rad' ? '🤩' : mood.type === 'good' ? '😊' : mood.type === 'meh' ? '😐' : '😔'}</div>
            <div className="text-xs font-medium text-white/40">{mood.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
