import React from 'react';
import { Calendar01Icon as CalendarIcon, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle, Clock01Icon as Clock, Add01Icon as Plus } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { DatabasePanel, EmptyState, PrimaryButton, StatusPill, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';

export function Today() {
  const { tasks, updateTask, addTask } = useAppStore();
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

  const handleNewTodayTask = () => {
    addTask({
      id: `task-${Date.now()}`,
      title: 'Untitled task',
      status: 'todo',
      priority: 'medium',
      dueDate: todayStr,
      tags: [],
    });
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        icon={<CalendarIcon className="h-4 w-4 text-[var(--tokyo-green)]" />}
        title="Today"
        description={format(new Date(), 'EEEE, MMMM do')}
        count={todayTasks.length}
        actions={<PrimaryButton onClick={handleNewTodayTask}><Plus className="h-4 w-4" /> New</PrimaryButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DatabasePanel>
          <table className="database-table">
            <thead>
              <tr>
                <th className="w-[52%] px-3">Task</th>
                <th className="w-[16%] px-3">Time</th>
                <th className="w-[16%] px-3">Status</th>
                <th className="w-[16%] px-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {todayTasks.length > 0 ? todayTasks.map(task => (
                <tr key={task.id}>
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTaskToggle(task)} className="text-white/35 transition-colors hover:text-[var(--tokyo-green)]">
                        {task.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-[var(--tokyo-green)]" /> : <Circle className="h-4 w-4" />}
                      </button>
                      <span className={cn("truncate font-medium", task.status === 'done' && "line-through text-white/35")}>{task.title}</span>
                    </div>
                  </td>
                  <td className="px-3 text-white/38">{task.startTime ? `${task.startTime}${task.endTime ? `-${task.endTime}` : ''}` : 'Anytime'}</td>
                  <td className="px-3"><StatusPill tone={task.status === 'done' ? 'green' : task.status === 'doing' ? 'blue' : 'gray'}>{task.status}</StatusPill></td>
                  <td className="px-3"><StatusPill tone={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>{task.priority}</StatusPill></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={<CalendarIcon className="h-10 w-10" />} title="No tasks for today" description="Add one to shape the day." actionLabel="New task" onAction={handleNewTodayTask} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </DatabasePanel>

        <DatabasePanel className="p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--tokyo-text-muted)]">
            <Clock className="h-4 w-4 text-[var(--tokyo-green)]" /> Agenda
          </div>
            {sortedTasks.length > 0 ? (
              <div className="relative ml-2 space-y-5 border-l border-white/[0.08] py-1">
                {sortedTasks.map(task => (
                  <div key={`agenda-${task.id}`} className="relative pl-5">
                    <div className={cn(
                      "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--tokyo-panel)]",
                      task.status === 'done' ? "bg-[rgba(166,227,125,0.35)]" : "bg-[var(--tokyo-green)]"
                    )} />
                    <div className="mb-1 text-xs font-medium text-[var(--tokyo-green)]/70">
                      {task.startTime ? `${task.startTime} ${task.endTime ? `- ${task.endTime}` : ''}` : 'Anytime'}
                    </div>
                    <div className={cn("text-sm font-medium text-white/70", task.status === 'done' && "line-through text-[var(--tokyo-text-faint)]")}>{task.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-white/35">
                <p>No agenda for today.</p>
              </div>
            )}
        </DatabasePanel>
      </div>
    </WorkspacePage>
  );
}
