import React from 'react';
import { useAppStore } from '../store';
import { Dumbbell01Icon as Dumbbell, Add01Icon as Plus } from 'hugeicons-react';

export function Habits() {
  const { habits } = useAppStore();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--tokyo-hover)] rounded-xl text-[var(--tokyo-text)]">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Habits</h1>
        </div>
        <button className="bg-[var(--tokyo-yellow-dim)] hover:bg-[var(--tokyo-yellow)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Habit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map(habit => (
          <div key={habit.id} className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
              <span className="text-xs font-medium text-[var(--tokyo-text-faint)]">{habit.frequency}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-[var(--tokyo-purple)]">{habit.streak}</div>
              <div className="text-xs font-medium text-[var(--tokyo-text-faint)]">Day Streak</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
