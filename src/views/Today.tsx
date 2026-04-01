import React from 'react';
import { Calendar01Icon as CalendarIcon, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle, Clock01Icon as Clock } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

export function Today() {
  const { tasks, updateTask } = useAppStore();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const sortedTasks = [...todayTasks].sort((a, b) => {
    if (!a.startTime && !b.startTime) return 0;
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
          <CalendarIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-white/90 tracking-tight">Today</h1>
          <p className="text-white/50 mt-1">{format(new Date(), 'EEEE, MMMM do')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-medium text-white/80 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Tasks
          </h2>
          <div className="bg-[#202020] rounded-2xl border border-white/5 overflow-hidden">
            <div className="divide-y divide-white/5">
              {todayTasks.length > 0 ? todayTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                  <button onClick={() => handleTaskToggle(task)} className="text-white/40 hover:text-emerald-500 transition-colors">
                    {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <span className={cn("text-white/80 font-medium", task.status === 'done' && "line-through text-white/40")}>
                    {task.title}
                  </span>
                </div>
              )) : (
                <div className="p-12 text-center text-white/40">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No tasks scheduled for today. Enjoy your free time!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-medium text-white/80 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" /> Agenda
          </h2>
          <div className="bg-[#202020] rounded-2xl border border-white/5 p-6">
            {sortedTasks.length > 0 ? (
              <div className="relative border-l border-white/10 ml-3 space-y-8 py-2">
                {sortedTasks.map(task => (
                  <div key={`agenda-${task.id}`} className="relative pl-6">
                    <div className={cn(
                      "absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#202020]",
                      task.status === 'done' ? "bg-emerald-500/50" : "bg-emerald-500"
                    )} />
                    <div className={cn(
                      "text-sm font-medium mb-2",
                      task.status === 'done' ? "text-emerald-500/50" : "text-emerald-400"
                    )}>
                      {task.startTime ? `${task.startTime} ${task.endTime ? `- ${task.endTime}` : ''}` : 'Anytime'}
                    </div>
                    <div className={cn(
                      "bg-white/5 rounded-xl p-4 border border-white/5 transition-colors",
                      task.status === 'done' && "opacity-50"
                    )}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTaskToggle(task)} className="text-white/40 hover:text-emerald-500 transition-colors shrink-0">
                          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                        </button>
                        <span className={cn("text-white/80 font-medium text-sm", task.status === 'done' && "line-through text-white/40")}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/40 py-8">
                <p>No agenda for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
