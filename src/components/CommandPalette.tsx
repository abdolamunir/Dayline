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
    addGoal 
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
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div 
        className="w-full max-w-[640px] bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <VisuallyHidden>
          <DialogTitle>Global Command Menu</DialogTitle>
        </VisuallyHidden>
        <div className="flex items-center px-4 border-b border-white/5">
          <Command.Input 
            value={search}
            onValueChange={setSearch}
            placeholder={mode === 'create' ? "What would you like to create?" : "Search for apps and commands..."}
            className="flex-1 bg-transparent border-none outline-none text-white/90 px-1 py-4 text-[15px] placeholder:text-white/40"
          />
        </div>

        <Command.List className="max-h-[340px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-6 text-center text-sm text-white/40">
            No results found.
          </Command.Empty>

          {mode === 'default' && (
            <Command.Group heading="Suggestions" className="text-xs font-medium text-white/40 px-2 py-2 [&_[cmdk-group-items]]:mt-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-1">
              <Command.Item 
                onSelect={() => runCommand(() => onViewChange('dashboard'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <Home className="w-4 h-4 text-blue-400 stroke-[1.5]" />
              <span className="flex-1">Dashboard</span>
              <span className="text-xs text-white/30">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('inbox'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <Inbox className="w-4 h-4 text-blue-400 stroke-[1.5]" />
              <span className="flex-1">Inbox</span>
              <span className="text-xs text-white/30">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('today'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 stroke-[1.5]" />
              <span className="flex-1">Today</span>
              <span className="text-xs text-white/30">Application</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => onViewChange('upcoming'))}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-rose-400 stroke-[1.5]" />
              <span className="flex-1">Upcoming</span>
                <span className="text-xs text-white/30">Application</span>
              </Command.Item>
            </Command.Group>
          )}

          <Command.Group heading="Create" className="text-xs font-medium text-white/40 px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-1">
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `note-${Date.now()}`;
                addNote({ id, title: 'New Note', content: '', ideaIds: [], createdAt: new Date().toISOString(), status: 'inbox', priority: 'medium', progress: 0, assignee: '' });
                onViewChange('notes');
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <Pencil className="w-4 h-4 text-blue-400 stroke-[1.5]" />
              <span className="flex-1">New Note</span>
              <span className="text-xs text-white/30">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `task-${Date.now()}`;
                addTask({ id, title: 'New Task', status: 'todo', priority: 'medium', tags: [] });
                onViewChange('tasks');
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
              <span className="flex-1">New Task</span>
              <span className="text-xs text-white/30">Action</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => {
                const id = `goal-${Date.now()}`;
                addGoal({ id, title: 'New Goal', description: '', progress: 0, projectIds: [], taskIds: [], status: 'inbox', priority: 'medium', assignee: '' });
                onViewChange('goals');
              })}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
            >
              <Target className="w-4 h-4 text-rose-400 stroke-[1.5]" />
              <span className="flex-1">New Goal</span>
              <span className="text-xs text-white/30">Action</span>
            </Command.Item>
          </Command.Group>

          {mode === 'default' && (
            <>
              <Command.Group heading="Private" className="text-xs font-medium text-white/40 px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-1">
                {sidebarItems.map((item) => {
                  const Icon = iconMap[item.icon] || File;
                  return (
                    <Command.Item 
                      key={item.id}
                      onSelect={() => runCommand(() => onViewChange(item.id))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                    >
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-white/30">Page</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>

              <Command.Group heading="Commands" className="text-xs font-medium text-white/40 px-2 py-2 mt-1 [&_[cmdk-group-items]]:mt-1.5 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:px-1">
                <Command.Item 
                  onSelect={() => runCommand(() => {})}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                >
                  <ClipboardList className="w-4 h-4 text-rose-400" />
                  <span className="flex-1">Clipboard History</span>
                  <span className="text-xs text-white/30">Command</span>
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => {})}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm text-white/80 aria-selected:bg-white/10 aria-selected:text-white transition-colors"
                >
                  <Download className="w-4 h-4 text-teal-400" />
                  <span className="flex-1">Import Extension</span>
                  <span className="text-xs text-white/30">Command</span>
                </Command.Item>
              </Command.Group>
            </>
          )}
        </Command.List>

        <div className="flex items-center justify-between px-4 py-3 bg-[#161616] border-t border-white/5 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="font-medium">Open Application</span>
            <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-sans">↵</kbd>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">Actions</span>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-sans">⌘ K</kbd>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
