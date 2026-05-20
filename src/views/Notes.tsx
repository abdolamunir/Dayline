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
  CheckmarkCircle02Icon as CheckCircle2,
  StarIcon as Star,
  Cancel01Icon as X,
  SmileIcon as Smile,
  AtIcon as AtSign,
  Link01Icon as Link,
  HashtagIcon as Hashtag,
  AttachmentIcon as Attachment,
  UserGroupIcon as Users,
  ZapIcon as Zap,
  UserIcon as User
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker } from '../components/DatePicker';
import { BlockEditor } from '../components/BlockEditor';
import { DatabasePanel, EmptyState, PrimaryButton, SearchButton, StatusPill, ToolButton, ViewTabs, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';
import { TableView } from '../components/TableView';
import { getPriorityBadgeClasses } from '../utils/badges';

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
  const { notes, updateNote, addNote, reorderNotes, replaceNotes, viewSettings, updateViewSettings, updateSidebarItem, sidebarItems } = useAppStore();
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

  const sidebarItem = sidebarItems.find(i => i.id === 'notes');

  const noteDatabasePage = {
    id: 'notes',
    title: sidebarItem?.label || savedNoteSettings.title || 'Notes',
    description: savedNoteSettings.description || 'Documents, outlines, and reference material.',
    icon: sidebarItem?.icon || savedNoteSettings.icon || 'Pencil',
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
  );}

function NoteDetailsPage({ note, onBack }: { 
  note: any;
  onBack: () => void;
}) {
  const { updateNote, deleteNote, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('Document');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      name: 'Stephen Robert',
      avatar: 'https://i.pravatar.cc/150?u=4',
      time: '50m ago',
      text: 'Great notes. Let\'s review the document structure and make sure we cover all edge cases.',
      reactions: [{ emoji: '👍', count: 1 }]
    },
    {
      id: 2,
      name: 'Raheem Sterling',
      avatar: 'https://i.pravatar.cc/150?u=2',
      time: '25m ago',
      text: 'I will review this today!'
    }
  ]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    type: 'status' | 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    pos: { x: number, y: number };
    currentDate?: Date;
  } | null>(null);

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    const formatted = str.replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };

  const handleUpdate = (updates: any) => {
    updateNote({ ...note, ...updates });
  };

  const handleDelete = () => {
    deleteNote(note.id);
    onBack();
  };

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#note-details:${note.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    setComments([
      {
        id: Date.now(),
        name: 'Abdola Munir',
        avatar: user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff',
        time: 'Just now',
        text: commentText.trim()
      },
      ...comments
    ]);
    setCommentText('');
  };

  const propertyRowClass = "flex items-center h-9 -mx-3 px-3 group";

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full w-full flex-1">
        {/* Header */}
        <div className="flex-shrink-0 w-full">
          <div className="mb-5 flex items-center gap-3">
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                setIsIconPickerOpen(true);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
            >
              {React.createElement(ALL_ICONS[note.icon] || Pencil, { className: "w-6 h-6" })}
            </div>
            <div className="min-w-0 flex-1">
              <input 
                type="text"
                value={note.title}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                placeholder="Untitled Note"
              />
            </div>
            <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
              <button
                onClick={() => void handleCopyLink()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                title="Copy link"
              >
                <Link className="h-[18px] w-[18px]" />
              </button>
              <button
                onClick={() => setIsFavorite((favorite) => !favorite)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tokyo-hover)]",
                  isFavorite ? "text-[var(--tokyo-yellow)]" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                )}
                title="Favorite"
              >
                <Star className={cn("h-[18px] w-[18px]", isFavorite && "fill-[var(--tokyo-yellow)]")} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsShareMenuOpen((open) => !open)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                  title="Invite people"
                >
                  <Users className="h-[18px] w-[18px]" />
                </button>
                {isShareMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsShareMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                      <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
                        <Users className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                        Invite people
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={onBack}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                title="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Properties - Vertical List */}
        <div className="space-y-2 mb-12 max-w-3xl pl-2.5">
          {/* Assigned */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>Assigned</span>
              </div>
            </div>
            <div className="flex -space-x-2">
              {[
                'https://i.pravatar.cc/150?u=5',
                'https://i.pravatar.cc/150?u=4',
                'https://i.pravatar.cc/150?u=6'
              ].map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-[var(--tokyo-bg)] ring-white/5" alt="avatar" />
              ))}
            </div>
          </div>

          {/* Created Date */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                <span>Created Date</span>
              </div>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: note.createdAt ? new Date(note.createdAt) : undefined
                });
              }}
              className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white"
            >
              {note.createdAt ? format(new Date(note.createdAt), 'MMM d, yyyy') : 'Set date...'}
            </div>
          </div>

          {/* Priority */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Priority</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    type: 'priority',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: note.priority || 'medium'
                  });
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7 flex items-center",
                  getPriorityBadgeClasses(note.priority || 'medium')
                )}
              >
                {toSentenceCase(note.priority || 'medium')}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Status</span>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    type: 'status',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: note.status || 'planning'
                  });
                }}
                className={cn(
                  "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7",
                  (note.status === 'completed' || note.status === 'done') ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                  (note.status === 'active' || note.status === 'in-progress') ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                  note.status === 'planning' ? "bg-stone-500/20 text-stone-400" :
                  "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                )}
              >
                <span>{toSentenceCase(note.status === 'in-progress' ? 'active' : note.status === 'planning' ? 'planning' : note.status)}</span>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <User className="w-4 h-4" />
                <span>Creator</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-5 h-5 rounded-full ring-white/10" alt="creator" />
              <span className="text-[var(--tokyo-text)] text-sm font-medium">Abdola Munir</span>
            </div>
          </div>

          {/* Progress */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <Circle className="w-4 h-4" />
                <span>Progress</span>
              </div>
            </div>
            <div className="flex items-center px-2.5 -ml-2.5 rounded-lg h-7 transition-all">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center px-2 py-0.5 min-w-[38px] text-[11px] font-semibold bg-white/[0.04] text-[var(--tokyo-green)] rounded-[6px]">
                  {note.progress || 0}%
                </div>
                <div className="h-1.5 w-36 bg-white/[0.06] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--tokyo-green)] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, note.progress || 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)]">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pl-2.5">
            {['Document', 'Comments', 'Activity'].map(tabId => (
              <div
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "-mb-px flex items-center py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                  activeTab === tabId
                    ? "border-b-[3px] border-[var(--tokyo-yellow)] text-[var(--tokyo-text-strong)]"
                    : "border-b-[3px] border-transparent text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                {tabId}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full pl-2.5 pt-4">
          {activeTab === 'Document' && (
            <div className="min-h-[55vh] py-2 text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={note.content}
                onChange={(nextContent) => handleUpdate({ content: nextContent })}
              />
            </div>
          )}

          {activeTab === 'Comments' && (
            <>
              {/* Comment Input */}
              <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-xl p-3 mb-8">
                <div className="flex gap-2.5 mb-2.5">
                  <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-7 h-7 rounded-full shrink-0 border border-white/5" alt="me" />
                  <textarea 
                    rows={1.5}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your comment..." 
                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent focus-visible:ring-0 focus-visible:outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-xs resize-none py-0.5 shadow-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 text-[var(--tokyo-text-faint)]">
                    <button className="hover:text-white transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><AtSign className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Link className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Hashtag className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Attachment className="w-3.5 h-3.5" /></button>
                  </div>
                  <button 
                    onClick={handleAddComment}
                    className="bg-[var(--tokyo-yellow-dim)] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-lg shadow-black/20 cursor-pointer"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4 pb-20">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group bg-white/[0.01] border border-[var(--tokyo-border)] rounded-xl p-3.5 hover:bg-white/[0.02] transition-all">
                    <img src={comment.avatar} className="w-7 h-7 rounded-full shrink-0 border border-white/5" alt="avatar" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--tokyo-text-strong)] font-semibold text-xs">{comment.name}</span>
                          <span className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors text-[10px]">•</span>
                          <span className="text-[var(--tokyo-text-faint)] text-[10px]">{comment.time}</span>
                        </div>
                        <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[var(--tokyo-text)] text-xs leading-relaxed break-words">
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors h-5 w-5 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                        {comment.reactions?.map((reaction, ri) => (
                          <button key={ri} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--tokyo-yellow-soft)] border border-[var(--tokyo-yellow-dim)] text-[10px] text-[var(--tokyo-yellow)] font-medium hover:bg-[var(--tokyo-yellow-dim)]/20 transition-all h-5 cursor-pointer">
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                        <button className="text-[var(--tokyo-text-muted)] text-[11px] font-medium hover:text-white transition-colors ml-1 cursor-pointer">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'Activity' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-[13px] text-[var(--tokyo-text-faint)]">
                <Activity className="w-3.5 h-3.5" />
                <span>No recent activity</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Popovers */}
      <AnimatePresence>
        {isIconPickerOpen && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsIconPickerOpen(false)} />
            <div 
              className="fixed z-[120]"
              style={{ top: iconPickerPos.y, left: iconPickerPos.x }}
            >
              <IconPicker 
                selectedIcon={note.icon || 'Pencil'}
                onSelect={(iconName) => {
                  handleUpdate({ icon: iconName });
                  setIsIconPickerOpen(false);
                }}
                onClose={() => setIsIconPickerOpen(false)}
              />
            </div>
          </>
        )}

        {customDropdown && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setCustomDropdown(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="property-popover fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
              }}
            >
              <div className="property-popover-heading px-2.5 py-1 font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Select {toSentenceCase(customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? ['planning', 'active', 'completed', 'paused'] : 
                  ['low', 'medium', 'high']
                ).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      handleUpdate({ [customDropdown.type]: option });
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left group cursor-pointer",
                      customDropdown.currentValue === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                    )}
                  >
                    <span>{toSentenceCase(option)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {datePickerConfig && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setDatePickerConfig(null)} />
            <div 
              className="fixed z-[120]"
              style={{ 
                top: Math.min(datePickerConfig.pos.y, window.innerHeight - 450), 
                left: Math.min(datePickerConfig.pos.x, window.innerWidth - 300) 
              }}
            >
              <DatePicker 
                selectedDate={datePickerConfig.currentDate}
                onSelect={(date) => {
                  handleUpdate({ createdAt: date.toISOString() });
                }}
                onClose={() => setDatePickerConfig(null)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
