import React from 'react';
import { PackageOpenIcon as PackageOpen, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { DatabasePanel, EmptyState, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';

export function Someday() {
  const { tasks, updateTask } = useAppStore();
  
  // Tasks with no due date but assigned to a project (or explicitly marked someday - we'll just use no due date for now)
  const somedayTasks = tasks.filter(t => !t.dueDate && t.projectId);

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        icon={<PackageOpen className="text-amber-400" />}
        title="Someday"
        description="Things you want to do, eventually."
        count={somedayTasks.length}
      />

      <DatabasePanel>
        <div className="divide-y divide-white/5">
          {somedayTasks.length > 0 ? somedayTasks.map(task => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-[var(--tokyo-hover)] transition-colors group">
              <button onClick={() => handleTaskToggle(task)} className="text-[var(--tokyo-text-faint)] hover:text-amber-500 transition-colors">
                {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-amber-500" /> : <Circle className="w-5 h-5" />}
              </button>
              <span className={cn("text-[var(--tokyo-text)] font-medium", task.status === 'done' && "line-through text-[var(--tokyo-text-faint)]")}>
                {task.title}
              </span>
            </div>
          )) : (
            <EmptyState icon={<PackageOpen className="h-10 w-10" />} title="Nothing saved for someday yet" />
          )}
        </div>
      </DatabasePanel>
    </WorkspacePage>
  );
}
