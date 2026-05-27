import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { PropertyType } from '../types';
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
  UserIcon as User,
  Activity01Icon as Activity,
  TextIcon as Text,
  ListViewIcon as List
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker } from '../components/DatePicker';
import { BlockEditor } from '../components/BlockEditor';
import { InnerPageBreadcrumbs } from '../components/InnerPageBreadcrumbs';
import { EmptyState, PrimaryButton, SearchButton, StatusPill, ToolButton, ViewTabs, WorkspaceHeader, WorkspacePage } from '../components/ui/DatabaseSurface';
import { TableView } from '../components/TableView';
import { getPriorityBadgeClasses } from '../utils/badges';
import { PropertyContextMenu } from '../components/PropertyContextMenu';
import { getDefaultPropertyValue, getPropertyTypeIcon, getPropertyTypeLabel, PROPERTY_TYPE_OPTIONS } from '../utils/propertyTypes';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Inbox: Inbox,
  Clock: Clock,
  CheckCircle2: CheckCircle2,
  Target: Target,
  Text,
  Hash: Hashtag,
  Layers,
  CalendarIcon,
  List,
  CheckCircle,
  Users,
  User,
  Attachment,
  Link,
  AtSign,
  Search,
  Plus,
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
  { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'date', label: 'Created Date', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
  { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
];

export function Notes({ onViewChange, selectedNoteId }: { onViewChange?: (view: string) => void, selectedNoteId?: string }) {
  const { notes, updateNote, addNote, reorderNotes, replaceNotes, areas, viewSettings, updateViewSettings, updateSidebarItem, sidebarItems } = useAppStore();
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
  const [columns, setColumns] = useState(() => {
    let initial = shouldUseSavedTemplate && savedNoteSettings.columns ? savedNoteSettings.columns : DEFAULT_NOTE_COLUMNS;

    const ALL_KNOWN_BUILTINS = ['title', 'status', 'priority', 'date', 'deadline', 'progress', 'creator', 'assigned', 'areas'];
    const ALLOWED_BUILTINS = ['title', 'status', 'priority', 'date', 'progress', 'creator', 'assigned'];
    initial = initial.filter((c: any) => !ALL_KNOWN_BUILTINS.includes(c.id) || ALLOWED_BUILTINS.includes(c.id));

    if (!initial.some((c: any) => c.id === 'creator')) {
      initial.push({ id: 'creator', label: 'Creator', icon: 'User', width: '180px' });
    }
    if (!initial.some((c: any) => c.id === 'assigned')) {
      initial.splice(1, 0, { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' });
    }
    return initial;
  });

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
  const getNoteAreaId = (note: any) => {
    const areaIds = Array.isArray(note.areaIds)
      ? note.areaIds
      : note.areaId
        ? [note.areaId]
        : [];
    return areaIds[0] || '';
  };
  const noteDetailProperties = [
    { id: 'assigned', name: 'Assigned', type: 'text' as const, value: '' },
    { id: 'creator', name: 'Creator', type: 'text' as const, value: '' },
    ...notes.flatMap(note => note.customProperties || []),
  ].reduce<Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>>((properties, property) => {
    if (properties.some(existingProperty => existingProperty.id === property.id)) return properties;
    properties.push(property);
    return properties;
  }, []);
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
      isFavorite: note.isFavorite,
      properties: {
        areas: getNoteAreaId(note),
        assigned: note.assignee || 'Unassigned',
        creator: 'Abdola Munir',
        ...Object.fromEntries((note.customProperties || []).map(property => [property.id, property.value])),
      },
    })),
    properties: noteDetailProperties,
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
          const customProperties = updatedPage.properties
            .filter(property => property.id !== 'assigned' && property.id !== 'creator')
            .map(property => {
              const existingProperty = existingNote?.customProperties?.find(candidate => candidate.id === property.id);
              return {
                ...property,
                value: item.properties[property.id] ?? existingProperty?.value ?? property.value ?? getDefaultPropertyValue(property.type),
              };
            });
          const areaValue = String(item.properties.areas || '');
          const areaId = areas.find(area => area.id === areaValue || area.name === areaValue)?.id;
          const assignee = item.properties.assigned && item.properties.assigned !== 'Unassigned'
            ? String(item.properties.assigned)
            : existingNote?.assignee || '';
          return existingNote
            ? { ...existingNote, title: item.title, icon: item.icon, status: item.status, priority: item.priority, progress: item.progress, createdAt: item.date || existingNote.createdAt, areaId, assignee, isFavorite: item.isFavorite, customProperties }
            : {
              id: item.id,
              title: item.title,
              content: '',
              ideaIds: [],
              createdAt: item.date || new Date().toISOString(),
              status: item.status,
              priority: item.priority,
              progress: item.progress,
              assignee,
              areaId,
              icon: item.icon || 'Pencil',
              isFavorite: item.isFavorite,
              customProperties,
            };
        });
        replaceNotes(nextNotes);
      }}
    />
  );}

const renderCommentText = (text: string) => {
  const parts = text.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith('@') && part.length > 1) {
      const match = part.match(/^(@[a-zA-Z0-9_.-]+)(.*)$/);
      if (match) {
        return (
          <React.Fragment key={index}>
            <span className="text-[#38bdf8] hover:underline cursor-pointer font-medium">{match[1]}</span>
            {match[2]}
          </React.Fragment>
        );
      }
    }
    return part;
  });
};

function NoteDetailsPage({ note, onBack }: {
  note: any;
  onBack: () => void;
}) {
  const { updateNote, deleteNote, tasks, addTask, updateTask, deleteTask, user, viewSettings, updateViewSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('To-Dos');
  const noteTasks = tasks.filter(t => t.noteId === note.id);

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({
      id,
      title: '',
      status: 'todo',
      priority: 'medium',
      noteId: note.id,
      tags: []
    });
  };
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      name: 'Stephen Robert',
      avatar: 'https://i.pravatar.cc/150?u=4',
      time: '50m ago',
      text: 'Great notes. Let\'s review the document structure and make sure we cover all edge cases.',
      reactions: [{ emoji: 'Like', count: 1 }]
    },
    {
      id: 2,
      name: 'Raheem Sterling',
      avatar: 'https://i.pravatar.cc/150?u=2',
      time: '25m ago',
      text: 'I will review this today!'
    }
  ]);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    type: 'status' | 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    id?: string;
    pos: { x: number, y: number };
    currentDate?: Date;
  } | null>(null);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number; y: number; id: string; isSystem: boolean } | null>(null);
  const [propertyIconPicker, setPropertyIconPicker] = useState<{ id: string; isSystem: boolean; pos: { x: number; y: number } } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState('');

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

  const handleAddProperty = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPropertyPickerPos({ x: rect.left, y: rect.bottom + 8 });
    setIsPropertyPickerOpen(true);
  };

  const confirmAddProperty = (type: PropertyType) => {
    const newProp = {
      id: `p${Date.now()}`,
      name: getPropertyTypeLabel(type),
      type,
      value: getDefaultPropertyValue(type),
      icon: getPropertyTypeIcon(type),
    };
    handleUpdate({
      customProperties: [...(note.customProperties || []), newProp]
    });
    setIsPropertyPickerOpen(false);
  };

  const handleUpdateProperty = (propId: string, value: any) => {
    handleUpdate({
      customProperties: note.customProperties?.map((property: any) => (
        property.id === propId ? { ...property, value } : property
      ))
    });
  };

  const handleDeleteProperty = (propId: string) => {
    handleUpdate({
      customProperties: note.customProperties?.filter((property: any) => property.id !== propId)
    });
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

  const getPersonAvatarUrl = (name: string) => {
    if (name === 'Abdola Munir' && user?.photoURL) return user.photoURL;
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`;
  };

  const renderPersonValue = (name?: string) => {
    const displayName = name?.trim() || 'Unassigned';
    return (
      <div className="flex min-w-0 items-center gap-2 text-[var(--tokyo-text-faint)]">
        <img
          src={getPersonAvatarUrl(displayName)}
          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/10"
          alt={displayName}
        />
        <span className="whitespace-nowrap text-sm font-medium">{displayName}</span>
      </div>
    );
  };

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "property-label-trigger flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] [&_input]:min-w-0 cursor-pointer";
  const addPropertyClass = "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] leading-none font-medium text-[var(--tokyo-text-faint)] transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap cursor-pointer";
  const noteColumns = viewSettings?.notes?.columns || [];
  const getCol = (id: string, defaultLabel: string, defaultIcon: string) => {
    const col = noteColumns.find((column: any) => column.id === id);
    return { label: col?.label || defaultLabel, icon: col?.icon || defaultIcon, hidden: col?.hidden };
  };
  const updateColumnMeta = (id: string, updates: Partial<{ label: string; icon: string; hidden: boolean }>) => {
    const savedSettings = viewSettings.notes || {};
    const cols = savedSettings.columns || [];
    const existing = cols.find((column: any) => column.id === id);
    const current = getCol(id, id, 'File');
    const updatedColumns = existing
      ? cols.map((column: any) => column.id === id ? { ...column, ...updates } : column)
      : [...cols, { id, label: updates.label || current.label, icon: updates.icon || current.icon, width: '150px', hidden: updates.hidden }];
    updateViewSettings('notes', { ...savedSettings, columns: updatedColumns });
  };
  const handleRenameProperty = (id: string, isSystem: boolean, newName: string) => {
    if (!newName.trim()) return;
    updateColumnMeta(id, { label: newName.trim() });
    if (!isSystem) {
      handleUpdate({
        customProperties: note.customProperties?.map((property: any) => (
          property.id === id ? { ...property, name: newName.trim() } : property
        ))
      });
    }
  };
  const handleUpdatePropertyIcon = (id: string, isSystem: boolean, icon: string) => {
    updateColumnMeta(id, { icon });
    if (!isSystem) {
      handleUpdate({
        customProperties: note.customProperties?.map((property: any) => (
          property.id === id ? { ...property, icon } : property
        ))
      });
    }
  };
  const handleDeletePropertyAction = (id: string, isSystem: boolean) => {
    if (isSystem) {
      updateColumnMeta(id, { hidden: true });
      return;
    }
    handleDeleteProperty(id);
  };
  const renderIcon = (iconName: string, fallback: React.ElementType, className: string) => {
    const IconComponent = ALL_ICONS[iconName] || fallback;
    return <IconComponent className={className} />;
  };
  const renderPropertyLabel = (id: string, isSystem: boolean, label: string, iconName: string | undefined, fallback: React.ElementType) => (
    <div className="w-40 shrink-0 flex items-center">
      <div
        className={propertyLabelClass}
        onClick={(e) => {
          e.stopPropagation();
          if ((e.target as HTMLElement).closest('svg')) {
            setPropertyIconPicker({ id, isSystem, pos: { x: e.clientX, y: e.clientY } });
            return;
          }
          setEditingPropertyId(id);
          setEditingPropertyName(label);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPropertyContextMenu({ x: e.clientX, y: e.clientY, id, isSystem });
        }}
      >
        {renderIcon(iconName || '', fallback, "w-4 h-4")}
        {editingPropertyId === id ? (
          <input
            type="text"
            value={editingPropertyName}
            onChange={(e) => setEditingPropertyName(e.target.value)}
            onBlur={() => {
              handleRenameProperty(id, isSystem, editingPropertyName);
              setEditingPropertyId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameProperty(id, isSystem, editingPropertyName);
                setEditingPropertyId(null);
              }
            }}
            className="w-full bg-transparent border-none p-0 text-sm font-medium text-[var(--tokyo-text-strong)] outline-none focus:ring-0"
            autoFocus
          />
        ) : (
          <span>{label}</span>
        )}
      </div>
    </div>
  );
  const assignedCol = getCol('assigned', 'Assigned', 'Users');
  const dateCol = getCol('date', 'Created Date', 'Calendar');
  const priorityCol = getCol('priority', 'Priority', 'Zap');
  const statusCol = getCol('status', 'Status', 'CheckCircle2');
  const creatorCol = getCol('creator', 'Creator', 'User');
  const progressCol = getCol('progress', 'Progress', 'Circle');

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="inner-detail-layout flex-1">
        <div className="inner-detail-main">
          {/* Header */}
          <div className="inner-detail-header flex-shrink-0 w-full">
            <div className="inner-detail-titlebar mb-5">
              <div className="inner-detail-titlebar-content flex flex-col items-start gap-3">
                <div className="flex w-full items-center gap-3">
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
                    onClick={() => handleUpdate({ isFavorite: !note.isFavorite })}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tokyo-hover)]",
                      note.isFavorite ? "text-[var(--tokyo-yellow)]" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                    )}
                    title="Favorite"
                  >
                    <Star className={cn("h-[18px] w-[18px]", note.isFavorite && "fill-[var(--tokyo-yellow)]")} />
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
                        <div className="dayline-share-menu absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                          <button className="dayline-share-menu-item flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
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
                <InnerPageBreadcrumbs pageId="notes" pageLabel="Notes" itemLabel={note.title} onPageClick={onBack} />
              </div>
            </div>
          </div>

          <div className="inner-detail-document">
            <div className="min-h-[55vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={note.content}
                onChange={(nextContent) => handleUpdate({ content: nextContent })}
              />
            </div>
          </div>
        </div>

        <div className="inner-detail-sidebar">
          {/* Properties - Vertical List */}
          <div className="inner-detail-properties space-y-2">
          {/* Assigned */}
          {!assignedCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('assigned', true, assignedCol.label, assignedCol.icon, Users)}
            {renderPersonValue(note.assignee)}
          </div>
          )}

          {/* Created Date */}
          {!dateCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('date', true, dateCol.label, dateCol.icon, CalendarIcon)}
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: note.createdAt ? new Date(note.createdAt) : undefined
                });
              }}
              className="inner-date-value relative inline-flex items-center gap-0.5 cursor-pointer"
            >
              {note.createdAt ? format(new Date(note.createdAt), 'MMM d, yyyy') : 'Set date...'}
            </div>
          </div>
          )}

          {/* Priority */}
          {!priorityCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('priority', true, priorityCol.label, priorityCol.icon, Zap)}
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
                  "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] h-7 flex items-center",
                  getPriorityBadgeClasses(note.priority || 'medium')
                )}
              >
                {toSentenceCase(note.priority || 'medium')}
              </div>
            </div>
          </div>
          )}

          {/* Status */}
          {!statusCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('status', true, statusCol.label, statusCol.icon, CheckCircle)}
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
                  "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] h-7",
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
          )}

          {/* Creator */}
          {!creatorCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('creator', true, creatorCol.label, creatorCol.icon, User)}
            {renderPersonValue('Abdola Munir')}
          </div>
          )}

          {/* Progress */}
          {!progressCol.hidden && (
          <div className={propertyRowClass}>
            {renderPropertyLabel('progress', true, progressCol.label, progressCol.icon, Circle)}
            <div className="flex items-center rounded-lg h-7 transition-all">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center px-2 py-0.5 min-w-[38px] text-[11px] font-semibold bg-white/[0.04] text-[var(--tokyo-green)] rounded-[6px]">
                  {note.progress || 0}%
                </div>
                <div className="h-1.5 w-20 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--tokyo-green)] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, note.progress || 0))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Custom Properties */}
          {note.customProperties?.map((prop: any) => {
            const PropIcon = {
              text: Text,
              number: Hashtag,
              select: Layers,
              date: CalendarIcon,
              'multi-select': List,
              status: CheckCircle,
              person: Users,
              files: Attachment,
              url: Link,
              email: AtSign,
            }[prop.type as string] || Text;

            return (
              <div key={prop.id} className={propertyRowClass}>
                {renderPropertyLabel(prop.id, false, prop.name, prop.icon, PropIcon)}
                <div className="flex-1 flex items-center gap-4">
                  {prop.type === 'date' ? (
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDatePickerConfig({
                          id: `prop:${prop.id}`,
                          pos: { x: rect.left, y: rect.bottom + 8 },
                          currentDate: prop.value ? new Date(prop.value) : undefined
                        });
                      }}
                      className="inner-date-value relative inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      {prop.value ? format(new Date(prop.value), 'MMM d, yyyy') : 'Empty'}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center hover:bg-white/[0.03] rounded-lg h-7 transition-all group/val">
                      <input
                        type={prop.type === 'number' ? 'number' : 'text'}
                        value={prop.value}
                        onChange={(e) => handleUpdateProperty(prop.id, e.target.value)}
                        placeholder="Empty"
                        className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-sm font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/5"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="opacity-0 group-hover/prop:opacity-100 text-white/20 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add new property */}
          <div className="flex items-center h-8">
            <button
              onClick={handleAddProperty}
              className={`${addPropertyClass} inner-add-property-trigger`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add property</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="inner-detail-tabs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)]">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            {['To-Dos', 'Comments', 'Activity'].map(tabId => (
              <div
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "flex items-center py-2 text-sm font-medium transition-[color,box-shadow] whitespace-nowrap cursor-pointer",
                  activeTab === tabId
                    ? "text-[var(--tokyo-text-strong)] shadow-[inset_0_-3px_0_var(--tokyo-yellow)]"
                    : "text-[var(--tokyo-text-muted)] shadow-[inset_0_-3px_0_transparent] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                {tabId}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="inner-detail-panel-content flex-1 w-full pt-4">
          {activeTab === 'To-Dos' && (
            <div className="inner-todo-list">
              {noteTasks.map((task) => (
                <div key={task.id} className="inner-todo-row group hover:bg-white/[0.03] rounded-md transition-all">
                  <button
                    onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                    className={cn(
                      "inner-todo-checkbox shrink-0 rounded-[4px] border-[2px] flex items-center justify-center transition-all cursor-pointer",
                      task.status === 'done'
                        ? "bg-[var(--tokyo-yellow)] border-[var(--tokyo-yellow)]"
                        : "border-[var(--tokyo-yellow)] bg-transparent hover:bg-[var(--tokyo-yellow)]/10"
                    )}
                  >
                    {task.status === 'done' && (
                      <svg className="w-3 h-3 text-[var(--tokyo-bg)] stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask({ ...task, title: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !task.title) {
                        e.preventDefault();
                        deleteTask(task.id);
                      }
                    }}
                    placeholder="Task description..."
                    className={cn(
                      "inner-todo-input bg-transparent border-none outline-none flex-1 text-sm transition-all placeholder:text-white/10 outline-none focus:outline-none focus:ring-transparent shadow-none",
                      task.status === 'done' ? "text-[var(--tokyo-text-faint)] line-through" : "text-[var(--tokyo-text)]"
                    )}
                  />
                </div>
              ))}
              <button
                onClick={handleAddTask}
                className="flex items-center gap-2 px-1 py-2 text-sm text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-yellow)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="font-medium">Add new task</span>
              </button>
            </div>
          )}

          {activeTab === 'Comments' && (
            <>
              {/* Comment Input */}
              <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-lg p-2 mb-6">
                <div className="flex gap-2 mb-2">
                  <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-6 h-6 rounded-full shrink-0 border border-white/5" alt="me" />
                  <textarea
                    rows={1.5}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your comment..."
                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent focus-visible:ring-0 focus-visible:outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-[11px] resize-none py-0.5 shadow-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[var(--tokyo-text-faint)]">
                    <button className="hover:text-white transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><AtSign className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Link className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Hashtag className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Attachment className="w-3.5 h-3.5" /></button>
                  </div>
                  <button
                    onClick={handleAddComment}
                    className="bg-[var(--tokyo-yellow-dim)] text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-md shadow-black/20 cursor-pointer"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4 pb-20">
                {comments.map((comment, index) => (
                  <div 
                    key={comment.id} 
                    className={`flex gap-2.5 group pb-4 ${
                      index !== comments.length - 1 ? 'border-b border-white/[0.04]' : ''
                    }`}
                  >
                    <img 
                      src={comment.name === 'Abdola Munir' ? (user?.photoURL || comment.avatar) : comment.avatar} 
                      className="w-7 h-7 rounded-full shrink-0 border border-white/5" 
                      alt="avatar" 
                    />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--tokyo-text-strong)] font-semibold text-sm">{comment.name}</span>
                          <span className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors text-xs">•</span>
                          <span className="text-[var(--tokyo-text-faint)] text-xs">{comment.time}</span>
                        </div>
                        <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors cursor-pointer">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[var(--tokyo-text)] text-sm leading-relaxed break-words">
                        {renderCommentText(comment.text)}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors h-4.5 w-4.5 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer">
                          <Smile className="w-3 h-3" />
                        </button>
                        {comment.reactions?.map((reaction, ri) => (
                          <button 
                            key={ri} 
                            className="flex h-4 items-center gap-1 rounded bg-[var(--tokyo-hover)] border border-[var(--tokyo-border)] px-1 text-[8.5px] leading-none text-[var(--tokyo-text-strong)] font-medium hover:bg-white/5 transition-all cursor-pointer"
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-[var(--tokyo-text-faint)]">{reaction.count}</span>
                          </button>
                        ))}
                        <button className="text-[var(--tokyo-text-muted)] text-[9px] leading-none font-medium hover:text-white transition-colors ml-0.5 cursor-pointer">
                          Reply
                        </button>
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
                currentIcon={note.icon || 'Pencil'}
                onSelect={(iconName) => {
                  handleUpdate({ icon: iconName });
                  setIsIconPickerOpen(false);
                }}
                onClose={() => setIsIconPickerOpen(false)}
              />
            </div>
          </>
        )}

        {propertyContextMenu && (
          <PropertyContextMenu
            pos={{ x: propertyContextMenu.x, y: propertyContextMenu.y }}
            onClose={() => setPropertyContextMenu(null)}
            onRename={() => {
              setEditingPropertyId(propertyContextMenu.id);
              setEditingPropertyName(
                propertyContextMenu.isSystem
                  ? getCol(propertyContextMenu.id, propertyContextMenu.id, 'File').label
                  : (note.customProperties?.find((property: any) => property.id === propertyContextMenu.id)?.name || '')
              );
            }}
            onChangeIcon={() => {
              setPropertyIconPicker({
                id: propertyContextMenu.id,
                isSystem: propertyContextMenu.isSystem,
                pos: { x: propertyContextMenu.x, y: propertyContextMenu.y }
              });
            }}
            onHide={propertyContextMenu.isSystem ? () => handleDeletePropertyAction(propertyContextMenu.id, true) : undefined}
            onDelete={!propertyContextMenu.isSystem ? () => handleDeletePropertyAction(propertyContextMenu.id, false) : undefined}
          />
        )}

        {propertyIconPicker && (
          <>
            <div className="fixed inset-0 z-[160]" onClick={() => setPropertyIconPicker(null)} />
            <div
              className="fixed z-[170]"
              style={{
                top: Math.min(propertyIconPicker.pos.y, window.innerHeight - 350),
                left: Math.min(propertyIconPicker.pos.x, window.innerWidth - 280)
              }}
            >
              <IconPicker
                currentIcon={
                  propertyIconPicker.isSystem
                    ? getCol(propertyIconPicker.id, propertyIconPicker.id, 'File').icon
                    : (note.customProperties?.find((property: any) => property.id === propertyIconPicker.id)?.icon || 'File')
                }
                onSelect={(iconName) => {
                  handleUpdatePropertyIcon(propertyIconPicker.id, propertyIconPicker.isSystem, iconName);
                  setPropertyIconPicker(null);
                }}
                onClose={() => setPropertyIconPicker(null)}
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
                  if (datePickerConfig.id?.startsWith('prop:')) {
                    handleUpdateProperty(datePickerConfig.id.replace('prop:', ''), date.toISOString());
                  } else {
                    handleUpdate({ createdAt: date.toISOString() });
                  }
                }}
                onClose={() => setDatePickerConfig(null)}
              />
            </div>
          </>
        )}

        {isPropertyPickerOpen && propertyPickerPos && (
          <>
            <div
              className="fixed inset-0 z-[110]"
              onClick={() => setIsPropertyPickerOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="dayline-dialog fixed z-[120] max-h-[440px] w-72 overflow-auto no-scrollbar rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel)] p-2 shadow-2xl"
              style={{
                top: Math.min(propertyPickerPos.y, window.innerHeight - 300),
                left: Math.min(propertyPickerPos.x, window.innerWidth - 280)
              }}
            >
              <div className="dayline-dialog-heading px-3 py-2 text-xs font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Basic properties
              </div>
              <div className="space-y-0.5">
                {PROPERTY_TYPE_OPTIONS.map((type) => {
                  const TypeIcon = iconMap[type.icon] || Text;
                  return (
                    <button
                      key={type.id}
                      onClick={() => confirmAddProperty(type.id)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-muted)] group-hover:text-white transition-colors">
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--tokyo-text-strong)] group-hover:text-white">{type.label}</div>
                        <div className="text-xs text-[var(--tokyo-text-faint)]">{type.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
