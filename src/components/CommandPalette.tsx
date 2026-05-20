import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Root as VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAppStore } from '../store';
import { Search01Icon as Search, Home01Icon as Home, InboxIcon as Inbox, StarIcon as Star, Calendar02Icon as CalendarDays, Layers01Icon as Layers, Archive01Icon as Archive, Book02Icon as BookCheck, CheckmarkCircle02Icon as CheckCircle2, Folder01Icon as Folder, Target01Icon as Target, Activity01Icon as Activity, Book01Icon as Book, SmileIcon as Smile, FeatherIcon as Feather, Add01Icon as Plus, ClipboardIcon as ClipboardList, Download01Icon as Download, File01Icon as File, PencilEdit01Icon as Pencil, Idea01Icon as Lightbulb, AddCircleIcon as PlusCircle, Notification01Icon as Bell, DashboardSquare01Icon as LayoutDashboard, DeliveryBox01Icon as Box, DatabaseIcon as Database, Plug01Icon as Plug, Clock01Icon as Clock, File02Icon as FileText, LockIcon as Lock, UserGroupIcon as Users, Shield01Icon as Shield, Wallet01Icon as Wallet, Upload01Icon as Upload } from 'hugeicons-react';
import { ViewType } from './Sidebar';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onViewChange: (view: ViewType) => void;
  initialValue?: string;
  mode?: 'default' | 'create';
}

const iconMap: Record<string, React.ElementType> = {
  Home, Inbox, Star, CalendarDays, Layers, Archive, BookCheck,
  CheckCircle2, Folder, Target, Activity, Book, Smile, Feather, Pencil, File,
  Bell, LayoutDashboard, Box, Database, Plug, Clock, FileText, Lock, Users, Shield, Wallet, Download, Upload
};

export function CommandPalette({ open, setOpen, onViewChange, initialValue = '', mode = 'default' }: CommandPaletteProps) {
  const { 
    sidebarItems, 
    addTask, 
    addNote, 
    addGoal,
    addProject,
    addCustomPage
  } = useAppStore();

  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setSearch(initialValue);
    }
  }, [open, initialValue]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[13vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div 
        className="dayline-command-palette w-[calc(100vw-3rem)] max-w-[660px] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <VisuallyHidden>
          <DialogTitle>Global Command Menu</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center px-3 border-b border-[var(--tokyo-border)]">
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            placeholder={mode === 'create' ? "What would you like to create?" : "Search for apps and commands..."}
            className="flex-1 bg-transparent border-none outline-none text-[var(--tokyo-text-strong)] px-3 py-5 text-xl leading-6 placeholder:text-[var(--tokyo-text-faint)]"
          />
        </div>

        <Command.List className="dayline-command-list max-h-[380px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-[15px] text-[var(--tokyo-text-faint)]">
            No results found.
          </Command.Empty>

          {mode === 'default' && (
            <Command.Group heading="Suggestions" className="text-sm font-medium text-[var(--tokyo-text-faint)] px-2 py-2 [&_[cmdk-group-items]]:mt-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:px-1">
              <Command.Item 
                onSelect={() => runCommand(() => onViewChange('dashboard'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Home className="w-[22px] h-[22px] text-[var(--tokyo-purple)] stroke-[1.5]" />
              <span className="flex-1">Dashboard</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('inbox'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Inbox className="w-[22px] h-[22px] text-[#45aaff] stroke-[1.5]" />
              <span className="flex-1">Inbox</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('today'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Star className="w-[22px] h-[22px] text-[var(--tokyo-yellow)] fill-yellow-400 stroke-[1.5]" />
              <span className="flex-1">Today</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('upcoming'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <CalendarDays className="w-[22px] h-[22px] text-[var(--tokyo-pink)] stroke-[1.5]" />
              <span className="flex-1">Upcoming</span>
                <span className="text-sm text-[var(--tokyo-text-faint)]">Application</span>
              </Command.Item>
            </Command.Group>
          )}

          <Command.Group heading="Create" className="text-[15px] font-medium text-[var(--tokyo-text-faint)] px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:px-1">
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `note-${Date.now()}`;
                addNote({ id, title: 'New Note', content: '', ideaIds: [], createdAt: new Date().toISOString(), status: 'inbox', priority: 'medium', progress: 0, assignee: '' });
                onViewChange(`note-details:${id}`);
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Pencil className="w-[22px] h-[22px] text-[var(--tokyo-purple)] stroke-[1.5]" />
              <span className="flex-1">New Note</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `task-${Date.now()}`;
                addTask({ id, title: 'New Task', status: 'todo', priority: 'medium', tags: [] });
                onViewChange('tasks');
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <CheckCircle2 className="w-[22px] h-[22px] text-[var(--tokyo-green)] stroke-[1.5]" />
              <span className="flex-1">New Task</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `goal-${Date.now()}`;
                addGoal({ id, title: 'New Goal', description: '', progress: 0, projectIds: [], taskIds: [], status: 'inbox', priority: 'medium', assignee: '' });
                onViewChange(`goal-details:${id}`);
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Target className="w-[22px] h-[22px] text-[var(--tokyo-pink)] stroke-[1.5]" />
              <span className="flex-1">New Goal</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `project-${Date.now()}`;
                addProject({ id, name: 'New Project', description: '', status: 'planning', taskIds: [], priority: 'medium', icon: 'Folder' });
                onViewChange('projects');
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Folder className="w-[22px] h-[22px] text-[var(--tokyo-yellow)] stroke-[1.5]" />
              <span className="flex-1">New Project</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
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
                  content: ''
                });
                onViewChange(id);
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <Database className="w-[22px] h-[22px] text-teal-300 stroke-[1.5]" />
              <span className="flex-1">New Database</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
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
                  content: ''
                });
                onViewChange(id);
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
            >
              <FileText className="w-[22px] h-[22px] text-stone-300 stroke-[1.5]" />
              <span className="flex-1">New Document</span>
              <span className="text-sm text-[var(--tokyo-text-faint)]">Action</span>
            </Command.Item>
          </Command.Group>

          {mode === 'default' && (
            <>
              <Command.Group heading="Private" className="text-[15px] font-medium text-[var(--tokyo-text-faint)] px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:px-1">
                {sidebarItems.map((item) => {
                  const Icon = iconMap[item.icon] || File;
                  return (
                    <Command.Item 
                      key={item.id}
                      onSelect={() => runCommand(() => onViewChange(item.id))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
                    >
                      <Icon className="w-[22px] h-[22px] text-[var(--tokyo-text-muted)]" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-sm text-[var(--tokyo-text-faint)]">Page</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Commands" className="text-[15px] font-medium text-[var(--tokyo-text-faint)] px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1 [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:px-1">
                <Command.Item 
                  onSelect={() => runCommand(() => {})}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
                >
                  <ClipboardList className="w-[22px] h-[22px] text-[var(--tokyo-pink)]" />
                  <span className="flex-1">Clipboard History</span>
                  <span className="text-sm text-[var(--tokyo-text-faint)]">Command</span>
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => {})}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer text-base leading-6 text-[var(--tokyo-text)] aria-selected:bg-[var(--tokyo-yellow-dim)] aria-selected:text-white transition-colors"
                >
                  <Download className="w-[22px] h-[22px] text-teal-400" />
                  <span className="flex-1">Import Extension</span>
                  <span className="text-sm text-[var(--tokyo-text-faint)]">Command</span>
                </Command.Item>
              </Command.Group>
            </>
          )}
        </Command.List>

        <div className="flex items-center justify-between px-4 py-3 bg-[var(--tokyo-bg-deep)] border-t border-[var(--tokyo-border)] text-[15px] text-[var(--tokyo-text-faint)]">
          <div className="flex items-center gap-2">
            <span className="font-medium">Open Application</span>
            <kbd className="bg-[var(--tokyo-yellow-dim)] px-2 py-1 rounded text-xs font-sans text-[var(--tokyo-text-strong)]">↵</kbd>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Actions</span>
              <kbd className="bg-[var(--tokyo-yellow-dim)] px-2 py-1 rounded text-xs font-sans text-[var(--tokyo-text-strong)]">⌘ K</kbd>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
