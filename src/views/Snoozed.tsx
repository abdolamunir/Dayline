import React from 'react';
import { Clock01Icon as Clock, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';

export function Snoozed() {
  const { tasks, updateTask } = useAppStore();
  
  // For demo purposes, let's just show tasks with 'snoozed' status if it existed, 
  // or just an empty state since we don't have a snooze property yet.
  const snoozedTasks = tasks.filter(t => (t as any).isSnoozed);

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2 bg-stone-500/20 rounded-lg text-stone-400">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white/90 tracking-tight">Snoozed</h1>
          <p className="text-white/50 mt-1">Tasks you've pushed to later.</p>
        </div>
      </header>

      <div className="bg-[#202020] rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {snoozedTasks.length > 0 ? snoozedTasks.map(task => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
              <button onClick={() => handleTaskToggle(task)} className="text-white/40 hover:text-stone-500 transition-colors">
                {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-stone-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <span className={cn("text-white/80 font-medium", task.status === 'done' && "line-through text-white/40")}>
                {task.title}
              </span>
            </div>
          )) : (
            <div className="p-12 text-center text-white/40">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No snoozed tasks. You're staying on top of things!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
