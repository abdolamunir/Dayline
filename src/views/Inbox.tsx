import React from 'react';
import {
  InboxIcon,
  CheckmarkCircle02Icon as CheckCircle2,
  CircleIcon as Circle,
  Add01Icon as Plus,
  Target01Icon as Target,
  Folder01Icon as Folder
} from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { DatabasePanel, EmptyState, PrimaryButton, StatusPill, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';
import { Goal, Project, Task } from '../types';

export function Inbox() {
  const { tasks, goals, projects, updateTask, addTask } = useAppStore();
  
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

  const getTaskRelations = (task: Task) => {
    const linkedProjects = new Map<string, Project>();
    const linkedGoals = new Map<string, Goal>();

    projects.forEach((project) => {
      if (project.id === task.projectId || project.taskIds?.includes(task.id)) {
        linkedProjects.set(project.id, project);
      }
    });

    goals.forEach((goal) => {
      const hasDirectGoalLink = goal.id === task.goalId || goal.taskIds?.includes(task.id);
      const hasProjectGoalLink = Array.from(linkedProjects.values()).some((project) => (
        project.goalId === goal.id || goal.projectIds?.includes(project.id)
      ));

      if (hasDirectGoalLink || hasProjectGoalLink) {
        linkedGoals.set(goal.id, goal);
      }
    });

    return {
      goals: Array.from(linkedGoals.values()),
      projects: Array.from(linkedProjects.values()),
    };
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
              <th className="w-[42%] px-3">Name</th>
              <th className="w-[26%] px-3">Linked</th>
              <th className="w-[12%] px-3">Status</th>
              <th className="w-[12%] px-3">Priority</th>
              <th className="w-[8%] px-3">Tags</th>
            </tr>
          </thead>
          <tbody>
          {inboxTasks.length > 0 ? inboxTasks.map(task => {
            const relations = getTaskRelations(task);
            const hasRelations = relations.goals.length > 0 || relations.projects.length > 0;

            return (
              <tr key={task.id}>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleTaskToggle(task)} className="text-white/35 transition-colors hover:text-sky-300">
                      {task.status === 'done' ? <CheckCircle2 className="h-4 w-4 text-sky-300" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <span className={cn("truncate font-medium", task.status === 'done' && "line-through text-white/35")}>{task.title}</span>
                  </div>
                </td>
                <td className="px-3">
                  {hasRelations ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {relations.goals.map((goal) => (
                        <span
                          key={`goal-${goal.id}`}
                          className="inline-flex max-w-[150px] items-center gap-1 rounded-md bg-[rgba(173,141,23,0.16)] px-2 py-0.5 text-[12px] font-medium text-[var(--tokyo-text-muted)]"
                          title={goal.title}
                        >
                          <Target className="h-3.5 w-3.5 shrink-0 text-[var(--tokyo-yellow)]" />
                          <span className="truncate">{goal.title}</span>
                        </span>
                      ))}
                      {relations.projects.map((project) => (
                        <span
                          key={`project-${project.id}`}
                          className="inline-flex max-w-[150px] items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[12px] font-medium text-[var(--tokyo-text-muted)]"
                          title={project.name}
                        >
                          <Folder className="h-3.5 w-3.5 shrink-0 text-[var(--tokyo-text-faint)]" />
                          <span className="truncate">{project.name}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-white/25">-</span>
                  )}
                </td>
                <td className="px-3"><StatusPill tone={task.status === 'done' ? 'green' : task.status === 'doing' ? 'blue' : 'gray'}>{task.status}</StatusPill></td>
                <td className="px-3"><StatusPill tone={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>{task.priority}</StatusPill></td>
                <td className="px-3 text-white/35">{task.tags.slice(0, 2).join(', ') || '-'}</td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5}>
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
