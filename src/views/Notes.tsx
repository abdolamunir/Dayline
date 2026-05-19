import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  PencilEdit01Icon as Pencil, 
  MoreHorizontalIcon as MoreHorizontal,
  Target01Icon as Target,
  Add01Icon as Plus,
  Calendar01Icon as CalendarIcon,
  DashboardSquare01Icon as LayoutGrid,
  CheckmarkCircle02Icon as CheckCircle,
  FilterIcon,
  Sorting01Icon as Sort,
  FlashIcon as Lightning,
  Search01Icon as Search,
  Settings01Icon as Settings,
  ArrowDown01Icon as ChevronDown,
  Layers01Icon as Layers,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  InboxIcon as Inbox,
  CheckmarkCircle02Icon as CheckCircle2
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { BlockEditor } from '../components/BlockEditor';
import { DatabasePanel, EmptyState, PrimaryButton, SearchButton, StatusPill, ToolButton, ViewTabs, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';
import { TableView } from '../components/TableView';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Inbox: Inbox,
  Clock: Clock,
  CheckCircle2: CheckCircle2,
  Target: Target,
};

const GOALS_TEMPLATE_VERSION = 'goals-database-v1';

const DEFAULT_NOTE_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];

const DEFAULT_NOTE_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'areas', label: 'Areas', icon: 'Layers', width: '180px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
];

export function Notes({ onViewChange, selectedNoteId }: { onViewChange?: (view: string) => void, selectedNoteId?: string }) {
  const { notes, updateNote, addNote, reorderNotes, replaceNotes, viewSettings, updateViewSettings, updateSidebarItem } = useAppStore();
  const savedNoteSettings = viewSettings.notes || {};
  const [localSelectedNoteId, setLocalSelectedNoteId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const shouldUseSavedTemplate = savedNoteSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSavedTemplate && savedNoteSettings.tabs ? savedNoteSettings.tabs : DEFAULT_NOTE_TABS);

  const [activeTab, setActiveTab] = useState<string>(shouldUseSavedTemplate ? (savedNoteSettings.activeTab || 'planning') : 'planning');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [columns, setColumns] = useState(shouldUseSavedTemplate && savedNoteSettings.columns ? savedNoteSettings.columns : DEFAULT_NOTE_COLUMNS);

  const filteredNotes = notes.filter(note => note.status === activeTab);

  const effectiveSelectedNoteId = selectedNoteId || localSelectedNoteId;
  const selectedNote = effectiveSelectedNoteId ? notes.find(n => n.id === effectiveSelectedNoteId) : null;

  useEffect(() => {
    const settings = viewSettings.notes;
    if (!settings) return;
    if (settings.templateVersion !== GOALS_TEMPLATE_VERSION) return;
    if (settings.tabs) setTabs(settings.tabs);
    if (settings.columns) setColumns(settings.columns);
    if (settings.activeTab) setActiveTab(settings.activeTab);
  }, [viewSettings.notes]);

  useEffect(() => {
    updateViewSettings('notes', {
      tabs,
      columns,
      activeTab,
      templateVersion: GOALS_TEMPLATE_VERSION,
    });
  }, [tabs, columns, activeTab]);

  if (selectedNote) {
    return (
      <NoteDetailsPage 
        note={selectedNote} 
        onBack={() => {
          if (onViewChange) {
            onViewChange('notes');
          } else {
            setLocalSelectedNoteId(null);
          }
        }} 
      />
    );
  }

  const noteDatabasePage = {
    id: 'notes',
    title: savedNoteSettings.title || 'Notes',
    description: savedNoteSettings.description || 'Documents, outlines, and reference material.',
    icon: savedNoteSettings.icon || 'Pencil',
    kind: 'database' as const,
    activeTab,
    tabs,
    columns,
    sortConfigs: shouldUseSavedTemplate ? (savedNoteSettings.sortConfigs || []) : [],
    items: notes.map(note => ({
      id: note.id,
      title: note.title,
      icon: 'Pencil',
      status: note.status === 'in-progress' ? 'active' : note.status === 'inbox' ? 'planning' : note.status,
      priority: note.priority,
      date: note.createdAt,
      progress: note.progress,
      properties: {
        areas: 'No Area',
      },
    })),
    properties: [],
    content: '',
  };

  return (
    <TableView
      page={noteDatabasePage}
      onItemClick={(itemId) => {
        if (onViewChange) onViewChange(`note-details:${itemId}`);
        else setLocalSelectedNoteId(itemId);
      }}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('notes', {
          ...savedNoteSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab || activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
          templateVersion: GOALS_TEMPLATE_VERSION,
        });
        updateSidebarItem('notes', updatedPage.title, updatedPage.icon);
        if (updatedPage.activeTab) setActiveTab(updatedPage.activeTab);

        const nextNotes = updatedPage.items.map(item => {
          const existingNote = notes.find(note => note.id === item.id);
          return existingNote
            ? { ...existingNote, title: item.title, status: item.status, priority: item.priority, progress: item.progress, createdAt: item.date || existingNote.createdAt }
            : {
              id: item.id,
              title: item.title,
              content: '',
              ideaIds: [],
              createdAt: item.date || new Date().toISOString(),
              status: item.status,
              priority: item.priority,
              progress: item.progress,
              assignee: '',
            };
        });
        replaceNotes(nextNotes);
      }}
    />
  );

  return (
    <WorkspacePage>
      <WorkspaceHeader
        icon={<Pencil className="h-4 w-4" />}
        title="Notes"
        description="Documents, outlines, and reference material."
        count={notes.length}
        actions={
          <>
            <SearchButton />
            <ToolButton><FilterIcon className="h-4 w-4" /></ToolButton>
            <PrimaryButton onClick={() => {
              const id = `note-${Date.now()}`;
              addNote({ id, title: 'Untitled note', content: '', ideaIds: [], createdAt: new Date().toISOString(), status: 'inbox', priority: 'medium', progress: 0, assignee: '' });
              if (onViewChange) onViewChange(`note-details:${id}`);
              else setLocalSelectedNoteId(id);
            }}>
              <Plus className="h-4 w-4" /> New
            </PrimaryButton>
          </>
        }
      />

      <ViewTabs
        tabs={tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: React.createElement(iconMap[tab.icon] || Target, { className: "h-4 w-4" }),
          count: notes.filter(note => note.status === tab.id).length,
        }))}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {/* Tabs & Toolbar */}
      <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)] pb-1">
        {/* Mobile/Tablet Dropdown */}
        <div className="sm:hidden relative">
          <button 
            onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 bg-stone-500/10 border border-stone-500/20 rounded-xl text-stone-100 font-medium"
          >
            <div className="flex items-center gap-2">
              {React.createElement(iconMap[tabs.find(t => t.id === activeTab)?.icon || 'Target'] || Target, { className: "w-4 h-4" })}
              {tabs.find(t => t.id === activeTab)?.label}
            </div>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isTabDropdownOpen && "rotate-180")} />
          </button>
          
          <AnimatePresence>
            {isTabDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTabDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsTabDropdownOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors",
                        activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      {React.createElement(iconMap[tab.icon] || Target, { className: "w-4 h-4" })}
                      {tab.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Tabs */}
        <Reorder.Group 
          as="div"
          ref={tabContainerRef}
          axis="x" 
          values={tabs} 
          onReorder={setTabs}
          className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {tabs.map(tab => {
            const Icon = iconMap[tab.icon] || Target;
            return (
              <Reorder.Item 
                key={tab.id}
                value={tab}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:text-white hover:bg-[var(--tokyo-hover)]"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Table Container */}
      <DatabasePanel className="flex-1">
        <div className={cn("w-full h-full", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <table className="database-table min-w-[600px] text-left">
            <thead>
              <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
                {columns.map((col, index) => (
                  <th 
                    key={col.id} 
                    style={{ width: col.width }}
                    className={cn(
                      "py-2 border-b border-[var(--tokyo-border)] group/header whitespace-nowrap",
                      index === 0 ? "pl-0" : "px-4"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="capitalize">{col.label.toLowerCase()}</span>
                    </div>
                  </th>
                ))}
                <th className="py-2 pr-6 border-b border-[var(--tokyo-border)] w-16 whitespace-nowrap text-right">
                  <MoreHorizontal className="w-4 h-4 text-white/10 ml-auto" />
                </th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              values={filteredNotes} 
              onReorder={reorderNotes}
              className="relative"
            >
              {filteredNotes.length > 0 ? filteredNotes.map(note => (
                <Reorder.Item 
                  key={note.id} 
                  value={note}
                  as="tr"
                  layout="position"
                  className={cn(
                    "group transition-colors select-none cursor-grab active:cursor-grabbing border-b border-white/[0.03] hover:bg-white/[0.02] whitespace-nowrap",
                    draggingId === note.id ? "cursor-grabbing bg-white/[0.04]" : ""
                  )}
                >
                  <td 
                    className="py-2 pl-0 pr-4 border-b border-white/[0.01] cursor-pointer rounded-l-lg whitespace-nowrap"
                    onClick={() => {
                      if (onViewChange) {
                        onViewChange(`note-details:${note.id}`);
                      } else {
                        setLocalSelectedNoteId(note.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center text-[var(--tokyo-text-faint)] shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white font-medium text-[14px] tracking-tight w-full cursor-pointer">
                        {note.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b border-white/[0.01] whitespace-nowrap">
                    <StatusPill
                      tone={note.priority === 'high' ? 'red' : note.priority === 'medium' ? 'orange' : 'green'}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCustomDropdown({
                          id: note.id,
                          type: 'priority',
                          pos: { x: rect.left, y: rect.bottom + 8 },
                          currentValue: note.priority
                        });
                      }}
                    >
                      {note.priority}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-2 border-b border-white/[0.01] text-[11px] font-medium text-[var(--tokyo-text-muted)] whitespace-nowrap">
                    {note.createdAt}
                  </td>
                  <td className="py-2 pr-6 border-b border-white/[0.01] text-right whitespace-nowrap">
                    <button className="p-2 text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] rounded-md transition-all cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </Reorder.Item>
              )) : (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={<Pencil className="h-10 w-10" />} title="No notes here" description="Create a note and start typing." />
                  </td>
                </tr>
              )}
            </Reorder.Group>
          </table>
        </div>
      </DatabasePanel>

      {/* Custom Dropdown Popover */}
      <AnimatePresence>
        {customDropdown && (
          <>
            <div 
              className="fixed inset-0 z-[130]" 
              onClick={() => setCustomDropdown(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
              }}
            >
              <div className="px-2.5 py-1.5 text-xs font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Select {customDropdown.type.charAt(0).toUpperCase() + customDropdown.type.slice(1)}
              </div>
              <div className="space-y-0.5">
                {['low', 'medium', 'high'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const note = notes.find(n => n.id === customDropdown.id);
                      if (note) {
                        updateNote({ 
                          ...note, 
                          priority: option as any
                        });
                      }
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group",
                      customDropdown.currentValue === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                    )}
                  >
                    <span className="capitalize">{option}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </WorkspacePage>
  );
}

function NoteDetailsPage({ note, onBack }: { note: any, onBack: () => void }) {
  const { updateNote, deleteNote } = useAppStore();
  
  return (
    <WorkspacePage className="max-w-5xl">
      <button onClick={onBack} className="mb-4 text-sm text-white/45 hover:text-white">Back to notes</button>
      <input 
        type="text"
        value={note.title}
        onChange={(e) => updateNote({ ...note, title: e.target.value })}
        className="mb-4 w-full bg-transparent text-3xl font-semibold text-[var(--tokyo-text-strong)] outline-none placeholder:text-white/18"
      />
      <BlockEditor
        initialContent={note.content}
        onChange={(content) => updateNote({ ...note, content })}
      />
      <button onClick={() => { deleteNote(note.id); onBack(); }} className="mt-6 text-sm text-[var(--tokyo-pink)] hover:text-[var(--tokyo-pink)]">Delete Note</button>
    </WorkspacePage>
  );
}
