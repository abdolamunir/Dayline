import React from 'react';
import { InboxIcon, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';

export function Inbox() {
  const { tasks, updateTask } = useAppStore();
  
  // Tasks without a project or specific date
  const inboxTasks = tasks.filter(t => !t.projectId && !t.dueDate);

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
          <InboxIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-[#E8E6E1] tracking-tight">Inbox</h1>
          <p className="text-white/50 mt-1">Unprocessed tasks and ideas.</p>
        </div>
      </header>

      <div className="bg-[#202020] rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {inboxTasks.length > 0 ? inboxTasks.map(task => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
              <button onClick={() => handleTaskToggle(task)} className="text-white/40 hover:text-blue-500 transition-colors">
                {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <span className={cn("text-white/80 font-medium", task.status === 'done' && "line-through text-white/40")}>
                {task.title}
              </span>
            </div>
          )) : (
            <div className="p-12 text-center text-white/40">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Your inbox is empty. All caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
