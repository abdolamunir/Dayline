import React from 'react';
import { InboxIcon, CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle, Add01Icon as Plus } from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { DatabasePanel, EmptyState, PrimaryButton, StatusPill, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';

export function Inbox() {
  const { tasks, updateTask, addTask } = useAppStore();
  
  // Tasks without a project or specific date
  const inboxTasks = tasks.filter(t => !t.projectId && !t.dueDate);

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleNewInboxTask = () => {
    addTask({
      id: `task-${Date.now()}`,
      title: 'Untitled task',
      status: 'todo',
      priority: 'medium',
      tags: [],
    });
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        icon={<InboxIcon className="h-4 w-4 text-sky-300" />}
        title="Inbox"
        description="Unprocessed tasks and ideas."
        count={inboxTasks.length}
        actions={<PrimaryButton onClick={handleNewInboxTask}><Plus className="h-4 w-4" /> New</PrimaryButton>}
      />

      <DatabasePanel>
        <table className="database-table">
          <thead>
            <tr>
              <th className="w-[56%] px-3">Name</th>
              <th className="w-[16%] px-3">Status</th>
              <th className="w-[16%] px-3">Priority</th>
              <th className="w-[12%] px-3">Tags</th>
            </tr>
          </thead>
          <tbody>
          {inboxTasks.length > 0 ? inboxTasks.map(task => (
            <tr key={task.id}>
              <td className="px-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleTaskToggle(task)} className="text-white/35 transition-colors hover:text-sky-300">
                    {task.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-sky-300" /> : <Circle className="h-4 w-4" />}
                  </button>
                  <span className={cn("truncate font-medium", task.status === 'done' && "line-through text-white/35")}>{task.title}</span>
                </div>
              </td>
              <td className="px-3"><StatusPill tone={task.status === 'done' ? 'green' : task.status === 'doing' ? 'blue' : 'gray'}>{task.status}</StatusPill></td>
              <td className="px-3"><StatusPill tone={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>{task.priority}</StatusPill></td>
              <td className="px-3 text-white/35">{task.tags.slice(0, 2).join(', ') || '-'}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan={4}>
                <EmptyState icon={<InboxIcon className="h-10 w-10" />} title="Inbox is clear" description="Create a task here and process it later." actionLabel="New task" onAction={handleNewInboxTask} />
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </DatabasePanel>
    </WorkspacePage>
  );
}
