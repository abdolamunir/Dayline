import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity01Icon as Activity,
  Archive01Icon as Archive,
  Book01Icon as Book,
  Book02Icon as BookCheck,
  Calendar02Icon as CalendarDays,
  CheckmarkCircle02Icon as CheckCircle2,
  ClipboardIcon as ClipboardList,
  DashboardSquare01Icon as LayoutDashboard,
  DatabaseIcon as Database,
  DeliveryBox01Icon as Box,
  Download01Icon as Download,
  FeatherIcon as Feather,
  File01Icon as File,
  File02Icon as FileText,
  Folder01Icon as Folder,
  Home01Icon as Home,
  InboxIcon as Inbox,
  Layers01Icon as Layers,
  LockIcon as Lock,
  PencilEdit01Icon as Pencil,
  Plug01Icon as Plug,
  Search01Icon as Search,
  Shield01Icon as Shield,
  SmileIcon as Smile,
  StarIcon as Star,
  Target01Icon as Target,
  Time02Icon as Clock,
  Upload01Icon as Upload,
  UserGroupIcon as Users,
  Wallet01Icon as Wallet,
} from 'hugeicons-react';
import { useAppStore } from '../store';
import { ViewType } from './Sidebar';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onViewChange: (view: ViewType) => void;
  initialValue?: string;
  mode?: 'default' | 'create';
}

type PaletteGroup = 'Suggestions' | 'Create' | 'Private' | 'Commands';

type PaletteAction = {
  id: string;
  label: string;
  meta: string;
  group: PaletteGroup;
  icon: React.ElementType;
  iconClassName: string;
  run: () => void;
};

const iconMap: Record<string, React.ElementType> = {
  Home,
  Inbox,
  Star,
  CalendarDays,
  Layers,
  Archive,
  BookCheck,
  CheckCircle2,
  Folder,
  Target,
  Activity,
  Book,
  Smile,
  Feather,
  Pencil,
  File,
  LayoutDashboard,
  Box,
  Database,
  Plug,
  Clock,
  FileText,
  Lock,
  Users,
  Shield,
  Wallet,
  Download,
  Upload,
};

const groupOrder: PaletteGroup[] = ['Suggestions', 'Create', 'Private', 'Commands'];

export function CommandPalette({ open, setOpen, onViewChange, initialValue = '', mode = 'default' }: CommandPaletteProps) {
  const {
    sidebarItems,
    addTask,
    addNote,
    addGoal,
    addProject,
    addCustomPage,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setSearch(initialValue);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, initialValue]);

  const actions = useMemo<PaletteAction[]>(() => {
    const nextActions: PaletteAction[] = [];

    if (mode === 'default') {
      nextActions.push(
        {
          id: 'view-dashboard',
          label: 'Dashboard',
          meta: 'Application',
          group: 'Suggestions',
          icon: Home,
          iconClassName: 'text-[var(--tokyo-purple)]',
          run: () => onViewChange('dashboard'),
        },
        {
          id: 'view-inbox',
          label: 'Inbox',
          meta: 'Application',
          group: 'Suggestions',
          icon: Inbox,
          iconClassName: 'text-[#45aaff]',
          run: () => onViewChange('inbox'),
        },
        {
          id: 'view-today',
          label: 'Today',
          meta: 'Application',
          group: 'Suggestions',
          icon: Star,
          iconClassName: 'fill-[var(--tokyo-yellow)] text-[var(--tokyo-yellow)]',
          run: () => onViewChange('today'),
        },
        {
          id: 'view-upcoming',
          label: 'Upcoming',
          meta: 'Application',
          group: 'Suggestions',
          icon: CalendarDays,
          iconClassName: 'text-[var(--tokyo-pink)]',
          run: () => onViewChange('upcoming'),
        },
      );
    }

    nextActions.push(
      {
        id: 'create-note',
        label: 'New Note',
        meta: 'Action',
        group: 'Create',
        icon: Pencil,
        iconClassName: 'text-[var(--tokyo-purple)]',
        run: () => {
          const id = `note-${Date.now()}`;
          addNote({ id, title: 'New Note', content: '', ideaIds: [], createdAt: new Date().toISOString(), status: 'inbox', priority: 'medium', progress: 0, assignee: '' });
          onViewChange(`note-details:${id}`);
        },
      },
      {
        id: 'create-task',
        label: 'New Task',
        meta: 'Action',
        group: 'Create',
        icon: CheckCircle2,
        iconClassName: 'text-[var(--tokyo-green)]',
        run: () => {
          const id = `task-${Date.now()}`;
          addTask({ id, title: 'New Task', status: 'todo', priority: 'medium', tags: [] });
          onViewChange('tasks');
        },
      },
      {
        id: 'create-goal',
        label: 'New Goal',
        meta: 'Action',
        group: 'Create',
        icon: Target,
        iconClassName: 'text-[var(--tokyo-pink)]',
        run: () => {
          const id = `goal-${Date.now()}`;
          addGoal({ id, title: 'New Goal', description: '', progress: 0, projectIds: [], taskIds: [], status: 'inbox', priority: 'medium', assignee: '' });
          onViewChange(`goal-details:${id}`);
        },
      },
      {
        id: 'create-project',
        label: 'New Project',
        meta: 'Action',
        group: 'Create',
        icon: Folder,
        iconClassName: 'text-[var(--tokyo-yellow)]',
        run: () => {
          const id = `project-${Date.now()}`;
          addProject({ id, name: 'New Project', description: '', status: 'planning', taskIds: [], priority: 'medium', icon: 'Folder' });
          onViewChange('projects');
        },
      },
      {
        id: 'create-database',
        label: 'New Database',
        meta: 'Action',
        group: 'Create',
        icon: Database,
        iconClassName: 'text-teal-300',
        run: () => {
          const id = `page-${Date.now()}`;
          addCustomPage({
            id,
            title: 'Untitled database',
            icon: 'Database',
            kind: 'database',
            tabs: [
              { id: 'inbox', label: 'Inbox', icon: 'Inbox' },
              { id: 'in-progress', label: 'In Progress', icon: 'Clock' },
              { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
            ],
            columns: [
              { id: 'title', label: 'Name', icon: 'SettingsGear', width: '280px' },
              { id: 'status', label: 'Status', icon: 'CheckCircle', width: '140px' },
              { id: 'priority', label: 'Priority', icon: 'Clock', width: '120px' },
              { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '140px' },
              { id: 'progress', label: 'Progress', icon: 'Circle', width: '150px' },
            ],
            items: [],
            properties: [],
            content: '',
          });
          onViewChange(id);
        },
      },
      {
        id: 'create-document',
        label: 'New Document',
        meta: 'Action',
        group: 'Create',
        icon: FileText,
        iconClassName: 'text-stone-300',
        run: () => {
          const id = `page-${Date.now()}`;
          addCustomPage({
            id,
            title: 'Untitled doc',
            icon: 'FileText',
            kind: 'document',
            tabs: [],
            columns: [],
            items: [],
            properties: [],
            content: '',
          });
          onViewChange(id);
        },
      },
    );

    if (mode === 'default') {
      sidebarItems.forEach((item) => {
        nextActions.push({
          id: `page-${item.id}`,
          label: item.label,
          meta: 'Page',
          group: 'Private',
          icon: iconMap[item.icon] || File,
          iconClassName: 'text-[var(--tokyo-text-muted)]',
          run: () => onViewChange(item.id),
        });
      });

      nextActions.push(
        {
          id: 'clipboard-history',
          label: 'Clipboard History',
          meta: 'Command',
          group: 'Commands',
          icon: ClipboardList,
          iconClassName: 'text-[var(--tokyo-pink)]',
          run: () => {},
        },
        {
          id: 'import-extension',
          label: 'Import Extension',
          meta: 'Command',
          group: 'Commands',
          icon: Download,
          iconClassName: 'text-teal-400',
          run: () => {},
        },
      );
    }

    return nextActions;
  }, [addCustomPage, addGoal, addNote, addProject, addTask, mode, onViewChange, sidebarItems]);

  const visibleActions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return actions;

    return actions.filter(action => (
      action.label.toLowerCase().includes(query) ||
      action.meta.toLowerCase().includes(query) ||
      action.group.toLowerCase().includes(query)
    ));
  }, [actions, search]);

  const runCommand = (action: PaletteAction) => {
    setOpen(false);
    action.run();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'Enter' && visibleActions[0]) {
      event.preventDefault();
      runCommand(visibleActions[0]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 px-6 pt-[13vh] backdrop-blur-sm"
      role="presentation"
      onMouseDown={() => setOpen(false)}
    >
      <section
        aria-label="Global Command Menu"
        aria-modal="true"
        className="dayline-command-palette flex max-h-[72vh] w-full max-w-[660px] flex-col overflow-hidden rounded-xl border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] font-sans shadow-2xl"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--tokyo-border)] px-4">
          <Search className="h-5 w-5 shrink-0 text-[var(--tokyo-text-faint)]" />
          <input
            ref={inputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'create' ? 'What would you like to create?' : 'Search for apps and commands...'}
            className="min-w-0 flex-1 border-none bg-transparent px-1 py-5 text-xl leading-6 text-[var(--tokyo-text-strong)] outline-none placeholder:text-[var(--tokyo-text-faint)]"
          />
        </div>

        <div className="dayline-command-list min-h-[160px] overflow-y-auto p-2 custom-scrollbar">
          {visibleActions.length === 0 && (
            <div className="py-6 text-center text-[15px] text-[var(--tokyo-text-faint)]">
              No results found.
            </div>
          )}

          {groupOrder.map((group) => {
            const groupActions = visibleActions.filter(action => action.group === group);
            if (groupActions.length === 0) return null;

            return (
              <div key={group} className="px-2 py-2 text-[15px] font-medium text-[var(--tokyo-text-faint)]">
                <div className="mb-1.5 px-1">{group}</div>
                <div className="mt-1">
                  {groupActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => runCommand(action)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-left text-base leading-6 text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] focus-visible:bg-[var(--tokyo-hover)] focus-visible:text-[var(--tokyo-text-strong)] focus-visible:outline-none"
                      >
                        <Icon className={`h-[22px] w-[22px] shrink-0 stroke-[1.5] ${action.iconClassName}`} />
                        <span className="min-w-0 flex-1 truncate">{action.label}</span>
                        <span className="shrink-0 text-sm text-[var(--tokyo-text-faint)]">{action.meta}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--tokyo-border)] bg-[var(--tokyo-bg-deep)] px-4 py-3 text-[15px] text-[var(--tokyo-text-faint)]">
          <div className="flex items-center gap-2">
            <span className="font-medium">Open Application</span>
            <kbd className="rounded bg-[var(--tokyo-yellow-dim)] px-2 py-1 font-sans text-xs text-[var(--tokyo-text-strong)]">↵</kbd>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Actions</span>
            <kbd className="rounded bg-[var(--tokyo-yellow-dim)] px-2 py-1 font-sans text-xs text-[var(--tokyo-text-strong)]">⌘ K</kbd>
          </div>
        </div>
      </section>
    </div>
  );
}
