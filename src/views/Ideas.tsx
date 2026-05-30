import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Idea, PropertyType, Task } from '../types';
import {
  Calendar01Icon as CalendarIcon,
  CheckmarkCircle02Icon as CheckCircle,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  SmileIcon as Smile,
  Add01Icon as Plus,
  StarIcon as Star,
  UserGroupIcon as Users,
  Link01Icon as Link,
  Cancel01Icon as X,
  MoreHorizontalIcon as MoreHorizontal,
  Activity01Icon as Activity,
  AtIcon as AtSign,
  HashtagIcon as Hash,
  AttachmentIcon as Attachment,
  Target01Icon as Target,
  UserIcon as User,
  Layers01Icon as Layers,
  TextIcon as Text,
  ListViewIcon as List,
  ZapIcon as Zap,
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableView } from '../components/TableView';
import { BlockEditor } from '../components/BlockEditor';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { InnerPageBreadcrumbs } from '../components/InnerPageBreadcrumbs';
import { PropertyContextMenu } from '../components/PropertyContextMenu';
import { DatePicker } from '../components/DatePicker';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { getDefaultPropertyValue, getPropertyTypeIcon, getPropertyTypeLabel, PROPERTY_TYPE_OPTIONS } from '../utils/propertyTypes';
import { format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Smile: Smile,
  Clock: Clock,
  Circle: Circle,
  CheckCircle: CheckCircle,
  CalendarIcon: CalendarIcon,
  List: List,
};

const DEFAULT_IDEA_TABS = [
  { id: 'active', label: 'Active', icon: 'Smile' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'archived', label: 'Archived', icon: 'Circle' },
];

const DEFAULT_IDEA_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'date', label: 'Created', icon: 'CalendarIcon', width: '180px' },
];

const IDEA_STATUS_OPTIONS = ['active', 'completed', 'archived'];

const toSentenceCase = (str: string) => {
  if (!str) return '';
  const formatted = str.replace(/-/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};

function IdeasList({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const { ideas, viewSettings, updateViewSettings, replaceIdeas, sidebarItems, reorderSidebarItems } = useAppStore();
  const savedSettings = viewSettings.ideas || {};

  const [tabs, setTabs] = useState(savedSettings.tabs || DEFAULT_IDEA_TABS);
  const [activeTab, setActiveTab] = useState<string>(savedSettings.activeTab || 'active');
  const [columns, setColumns] = useState(savedSettings.columns || DEFAULT_IDEA_COLUMNS);

  useEffect(() => {
    const settings = viewSettings.ideas;
    if (!settings) return;
    if (settings.tabs) setTabs(settings.tabs);
    if (settings.columns) setColumns(settings.columns);
    if (settings.activeTab) setActiveTab(settings.activeTab);
  }, [viewSettings.ideas]);

  useEffect(() => {
    updateViewSettings('ideas', { tabs, columns, activeTab });
  }, [tabs, columns, activeTab]);

  const sidebarItem = sidebarItems.find(i => i.id === 'ideas');
  const ideaDatabasePage = {
    id: 'ideas',
    title: sidebarItem?.label || savedSettings.title || 'Ideas',
    description: savedSettings.description || 'Capture and organise your ideas.',
    icon: sidebarItem?.icon || savedSettings.icon || 'Smile',
    kind: 'database' as const,
    isFavorite: Boolean(sidebarItem?.isFavorite),
    activeTab,
    tabs,
    columns,
    sortConfigs: savedSettings.sortConfigs || [],
    items: ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      icon: idea.icon || 'Smile',
      status: idea.status || 'active',
      priority: idea.priority || 'medium',
      date: idea.createdAt,
      progress: 0,
      isFavorite: Boolean(idea.isFavorite),
      properties: {
        description: idea.description,
        tags: idea.tags,
        assigned: idea.assignee || 'Unassigned',
        creator: 'Abdola Munir',
      },
    })),
    properties: [],
    content: '',
  };

  return (
    <TableView
      page={ideaDatabasePage}
      onItemClick={(itemId) => {
        if (onViewChange) onViewChange(`idea-details:${itemId}`);
      }}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('ideas', {
          ...savedSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab || activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
        });
        reorderSidebarItems(sidebarItems.map(item => (
          item.id === 'ideas'
            ? {
              ...item,
              label: updatedPage.title,
              icon: updatedPage.icon || item.icon,
              isFavorite: Boolean(updatedPage.isFavorite),
            }
            : item
        )));
        if (updatedPage.activeTab) setActiveTab(updatedPage.activeTab);

        const nextIdeas = updatedPage.items.map(item => {
          const existingIdea = ideas.find(idea => idea.id === item.id);
          return existingIdea
            ? {
              ...existingIdea,
              title: item.title,
              icon: item.icon,
              status: item.status,
              priority: item.priority as Idea['priority'],
              createdAt: item.date || existingIdea.createdAt,
              isFavorite: item.isFavorite,
              description: String(item.properties?.description ?? ''),
              tags: (item.properties?.tags as string[]) || [],
              assignee: item.properties?.assigned && String(item.properties.assigned) !== 'Unassigned' ? String(item.properties.assigned) : existingIdea.assignee || '',
            }
            : {
              id: item.id,
              title: item.title,
              description: '',
              tags: [],
              createdAt: item.date || new Date().toISOString(),
              status: item.status,
              priority: item.priority as Idea['priority'],
              icon: item.icon || 'Smile',
              isFavorite: item.isFavorite,
              assignee: String(item.properties?.assigned ?? ''),
            };
        });
        replaceIdeas(nextIdeas);
      }}
    />
  );
}

function IdeaDetailsPage({ idea, onBack }: { idea: Idea; onBack: () => void }) {
  const { ideas, updateIdea, deleteIdea, tasks, addTask, updateTask, deleteTask, user, viewSettings, updateViewSettings, replaceIdeas } = useAppStore();
  const [activeTab, setActiveTab] = useState('To-Dos');
  const [commentText, setCommentText] = useState('');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [customDropdown, setCustomDropdown] = useState<{
    type: 'status' | 'priority';
    pos: { x: number; y: number };
    currentValue: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    id: string;
    pos: { x: number; y: number };
    currentDate?: Date;
  } | null>(null);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [propertyIconPicker, setPropertyIconPicker] = useState<{ id: string; isSystem: boolean; pos: { x: number; y: number } } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number; y: number; id: string; isSystem: boolean } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState<string>('');
  const [comments, setComments] = useState([
    { id: '1', name: 'Abdola Munir', time: 'Just now', text: 'This idea has potential. Let\'s explore it further.', avatar: '' },
  ]);

  const priorities = ['low', 'medium', 'high'];
  const statuses = IDEA_STATUS_OPTIONS;

  const handleUpdate = (updates: Partial<Idea>) => {
    updateIdea({ ...idea, ...updates });
  };

  const handleDelete = () => {
    deleteIdea(idea.id);
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
      customProperties: [...(idea.customProperties || []), newProp],
    });
    setIsPropertyPickerOpen(false);
  };

  const columns = viewSettings?.ideas?.columns || [];
  const getCol = (id: string, defaultLabel: string, defaultIcon: string) => {
    const col = columns.find((c: any) => c.id === id);
    return { label: col?.label || defaultLabel, icon: col?.icon || defaultIcon, hidden: col?.hidden };
  };
  const inferPropertyTypeFromColumn = (column: any): PropertyType => {
    const label = String(column?.label || '').toLowerCase();
    const icon = String(column?.icon || '').toLowerCase();
    if (label.includes('people') || label.includes('person') || icon.includes('user')) return 'person';
    if (label.includes('date') || icon.includes('calendar')) return 'date';
    if (icon.includes('hash') || label.includes('number')) return 'number';
    if (icon.includes('layers') || label.includes('select')) return 'select';
    return 'text';
  };
  const detailSystemPropertyIds = new Set(['title', 'status', 'priority', 'date', 'progress', 'creator', 'assigned', 'tags']);
  const ideaDetailCustomProperties = [
    ...(idea.customProperties || []).filter((property) => {
      const column = columns.find((c: any) => c.id === property.id);
      return !column?.hidden;
    }),
    ...columns
      .filter((column: any) => !detailSystemPropertyIds.has(column.id) && !column.hidden)
      .filter((column: any) => !(idea.customProperties || []).some(property => property.id === column.id))
      .map((column: any) => ({
        id: column.id,
        name: column.label || column.id,
        type: inferPropertyTypeFromColumn(column),
        value: getDefaultPropertyValue(inferPropertyTypeFromColumn(column)),
        icon: column.icon,
      })),
  ];

  const handleRenameProperty = (id: string, isSystem: boolean, newName: string) => {
    if (!newName.trim()) return;
    if (isSystem) {
      const settings = viewSettings.ideas || {};
      const cols = settings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, label: newName.trim() } : c)
        : [...cols, { id, label: newName.trim(), icon: getCol(id, id, 'Text').icon, width: '150px' }];
      updateViewSettings('ideas', { ...settings, columns: updatedCols });
    } else {
      const settings = viewSettings.ideas || {};
      const cols = settings.columns || [];
      const existingCol = cols.find((c: any) => c.id === id);
      const updatedCols = existingCol
        ? cols.map((c: any) => c.id === id ? { ...c, label: newName.trim() } : c)
        : [...cols, { id, label: newName.trim(), icon: idea.customProperties?.find(p => p.id === id)?.icon || 'Text', width: '180px' }];
      updateViewSettings('ideas', { ...settings, columns: updatedCols });
      handleUpdate({
        customProperties: idea.customProperties?.map(p =>
          p.id === id ? { ...p, name: newName.trim() } : p
        ),
      });
    }
  };

  const handleUpdatePropertyIcon = (id: string, isSystem: boolean, newIcon: string) => {
    if (isSystem) {
      const settings = viewSettings.ideas || {};
      const cols = settings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, icon: newIcon } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: newIcon, width: '150px' }];
      updateViewSettings('ideas', { ...settings, columns: updatedCols });
    } else {
      const settings = viewSettings.ideas || {};
      const cols = settings.columns || [];
      const existingProperty = idea.customProperties?.find(p => p.id === id);
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, icon: newIcon } : c)
        : [...cols, { id, label: existingProperty?.name || id, icon: newIcon, width: '180px' }];
      updateViewSettings('ideas', { ...settings, columns: updatedCols });
      handleUpdate({
        customProperties: idea.customProperties?.map(p =>
          p.id === id ? { ...p, icon: newIcon } : p
        ),
      });
    }
  };

  const handleDeletePropertyAction = (id: string, isSystem: boolean) => {
    if (isSystem) {
      const settings = viewSettings.ideas || {};
      const cols = settings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, hidden: true } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: getCol(id, id, 'Text').icon, width: '150px', hidden: true }];
      updateViewSettings('ideas', { ...settings, columns: updatedCols });
    } else {
      handleDeleteProperty(id);
    }
  };

  const handleUpdateProperty = (propId: string, value: any) => {
    const existingProperty = idea.customProperties?.find(p => p.id === propId);
    if (!existingProperty) {
      const column = columns.find((c: any) => c.id === propId);
      const type = inferPropertyTypeFromColumn(column);
      handleUpdate({
        customProperties: [
          ...(idea.customProperties || []),
          {
            id: propId,
            name: column?.label || propId,
            type,
            value,
            icon: column?.icon || getPropertyTypeIcon(type),
          },
        ],
      });
      return;
    }
    handleUpdate({
      customProperties: idea.customProperties?.map(p => p.id === propId ? { ...p, value } : p),
    });
  };

  const handleDeleteProperty = (propId: string) => {
    const settings = viewSettings.ideas || {};
    updateViewSettings('ideas', {
      ...settings,
      columns: (settings.columns || []).filter((c: any) => c.id !== propId),
      sortConfigs: (settings.sortConfigs || []).filter((s: any) => s.columnId !== propId),
    });
    const updatedIdeas = ideas.map(existingIdea => ({
      ...existingIdea,
      customProperties: (existingIdea.customProperties || []).filter(p => p.id !== propId),
    }));
    replaceIdeas(updatedIdeas);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments([
      {
        id: `c${Date.now()}`,
        name: 'Abdola Munir',
        time: 'Just now',
        text: commentText.trim(),
        avatar: user?.photoURL || '',
      },
      ...comments,
    ]);
    setCommentText('');
  };

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#idea-details:${idea.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
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

  const ideaTasks = tasks.filter(t => t.ideaId === idea.id);

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({
      id,
      title: '',
      status: 'todo',
      priority: 'medium',
      ideaId: idea.id,
      tags: [],
    });
  };

  const statusCol = getCol('status', 'Status', 'CheckCircle');
  const creatorCol = getCol('creator', 'Creator', 'User');
  const priorityCol = getCol('priority', 'Priority', 'Zap');
  const dateCol = getCol('date', 'Created', 'CalendarIcon');
  const assignedCol = getCol('assigned', 'Assigned', 'Users');
  const tagsCol = getCol('tags', 'Tags', 'Hash');

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "property-label-trigger flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] [&_input]:min-w-0 cursor-pointer";
  const addPropertyClass = "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] leading-none font-medium text-[var(--tokyo-text-faint)] transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap cursor-pointer";

  const renderIcon = (iconName: string, fallback: React.ElementType, className: string) => {
    const IconComponent = ALL_ICONS[iconName] || fallback;
    return <IconComponent className={className} />;
  };

  const handlePropertyLabelClick = (e: React.MouseEvent, id: string, isSystem: boolean, label: string) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest('svg')) {
      setPropertyIconPicker({ id, isSystem, pos: { x: e.clientX, y: e.clientY } });
      return;
    }
    setEditingPropertyId(id);
    setEditingPropertyName(label);
  };

  const handlePropertyLabelContextMenu = (e: React.MouseEvent, id: string, isSystem: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setPropertyContextMenu({ x: e.clientX, y: e.clientY, id, isSystem });
  };

  const renderPropertyLabel = (id: string, isSystem: boolean, label: string, iconName: string | undefined, fallback: React.ElementType) => (
    <div className="w-40 shrink-0 flex items-center">
      <div
        className={propertyLabelClass}
        onClick={(e) => handlePropertyLabelClick(e, id, isSystem, label)}
        onContextMenu={(e) => handlePropertyLabelContextMenu(e, id, isSystem)}
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
                      setIsIconPickerOpen(true);
                      setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
                  >
                    {React.createElement(ALL_ICONS[idea.icon || 'Smile'] || Smile, { className: "w-6 h-6" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={idea.title}
                      onChange={(e) => handleUpdate({ title: e.target.value })}
                      className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                      placeholder="Untitled Idea"
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
                      onClick={() => handleUpdate({ isFavorite: !idea.isFavorite })}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tokyo-hover)]",
                        idea.isFavorite ? "text-[var(--tokyo-yellow)]" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                      )}
                      title="Favorite"
                    >
                      <Star className={cn("h-[18px] w-[18px]", idea.isFavorite && "fill-[var(--tokyo-yellow)]")} />
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
                            <button
                              onClick={() => void handleCopyLink()}
                              className="dayline-share-menu-item flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                            >
                              <Link className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                              Copy link
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
                <InnerPageBreadcrumbs pageId="ideas" pageLabel="Ideas" itemLabel={idea.title} onPageClick={onBack} />
              </div>
            </div>
          </div>

          <div className="inner-detail-document">
            <div className="min-h-[42vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={idea.description || ''}
                onChange={(nextContent) => handleUpdate({ description: nextContent })}
              />
            </div>
          </div>
        </div>

        <div className="inner-detail-sidebar">
          {/* Properties - Vertical List */}
          <div className="inner-detail-properties space-y-2 mb-3">
            {/* Assigned */}
            {!assignedCol.hidden && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'assigned', isSystem: true });
                }}
              >
                {renderPropertyLabel('assigned', true, assignedCol.label, assignedCol.icon, Users)}
                {renderPersonValue(idea.assignee)}
              </div>
            )}

            {/* Created Date */}
            {!dateCol.hidden && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'date', isSystem: true });
                }}
              >
                {renderPropertyLabel('date', true, dateCol.label, dateCol.icon, CalendarIcon)}
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDatePickerConfig({
                      id: idea.id,
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentDate: idea.createdAt ? new Date(idea.createdAt) : undefined,
                    });
                  }}
                  className="inner-date-value relative inline-flex items-center gap-0.5 cursor-pointer"
                >
                  {idea.createdAt ? format(new Date(idea.createdAt), 'MMM d, yyyy') : 'Set date...'}
                </div>
              </div>
            )}

            {/* Priority */}
            {!priorityCol.hidden && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'priority', isSystem: true });
                }}
              >
                {renderPropertyLabel('priority', true, priorityCol.label, priorityCol.icon, Zap)}
                <div className="relative flex items-center">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCustomDropdown({
                        type: 'priority',
                        pos: { x: rect.left, y: rect.bottom + 8 },
                        currentValue: idea.priority || 'medium',
                      });
                    }}
                    className={cn(
                      "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] h-7 flex items-center",
                      getPriorityBadgeClasses(idea.priority || 'medium')
                    )}
                  >
                    {toSentenceCase(idea.priority || 'medium')}
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            {!statusCol.hidden && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'status', isSystem: true });
                }}
              >
                {renderPropertyLabel('status', true, statusCol.label, statusCol.icon, CheckCircle)}
                <div className="relative flex items-center gap-2">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCustomDropdown({
                        type: 'status',
                        pos: { x: rect.left, y: rect.bottom + 8 },
                        currentValue: idea.status || 'active',
                      });
                    }}
                    className={cn(
                      "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] h-7",
                      idea.status === 'completed'
                        ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]"
                        : idea.status === 'archived'
                          ? "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                          : "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]"
                    )}
                  >
                    <span>{toSentenceCase(idea.status || 'active')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Creator */}
            {!creatorCol.hidden && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'creator', isSystem: true });
                }}
              >
                {renderPropertyLabel('creator', true, creatorCol.label, creatorCol.icon, User)}
                {renderPersonValue('Abdola Munir')}
              </div>
            )}

            {/* Tags */}
            {!tagsCol.hidden && idea.tags.length > 0 && (
              <div
                className={propertyRowClass}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                  e.stopPropagation();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'tags', isSystem: true });
                }}
              >
                {renderPropertyLabel('tags', true, tagsCol.label, tagsCol.icon, Hash)}
                <div className="flex flex-wrap items-center gap-1.5">
                  {idea.tags.map(tag => (
                    <span key={tag} className="flex h-6 items-center rounded-md bg-white/[0.035] px-2 text-[12px] font-semibold text-[var(--tokyo-text)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Properties */}
            {ideaDetailCustomProperties.map(prop => {
              const PropIcon = {
                text: Text,
                number: Hash,
                select: Layers,
                date: CalendarIcon,
                person: Users,
                files: Attachment,
                url: Link,
                email: AtSign,
              }[prop.type] || Text;

              return (
                <div
                  key={prop.id}
                  className={propertyRowClass}
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
                    e.stopPropagation();
                    setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: prop.id, isSystem: false });
                  }}
                >
                  <div className="w-40 shrink-0 flex items-center">
                    <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, prop.id, false, prop.name)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, prop.id, false)}>
                      {prop.icon ? renderIcon(prop.icon, PropIcon, "w-4 h-4") : <PropIcon className="w-4 h-4" />}
                      {editingPropertyId === prop.id ? (
                        <input
                          type="text"
                          value={editingPropertyName}
                          onChange={(e) => setEditingPropertyName(e.target.value)}
                          onBlur={() => { handleRenameProperty(prop.id, false, editingPropertyName); setEditingPropertyId(null); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty(prop.id, false, editingPropertyName); setEditingPropertyId(null); } }}
                          className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                          autoFocus
                        />
                      ) : (
                        <span>{prop.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    {prop.type === 'date' ? (
                      <div
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDatePickerConfig({
                            id: `prop:${prop.id}`,
                            pos: { x: rect.left, y: rect.bottom + 8 },
                            currentDate: prop.value ? new Date(prop.value) : undefined,
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
                {ideaTasks.map((task) => (
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
                <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-lg p-2 mb-6">
                  <div className="flex gap-2 mb-2">
                    <img
                      src={user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff'}
                      className="w-6 h-6 rounded-full shrink-0 border border-white/5"
                      alt="me"
                    />
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
                      <button className="hover:text-white transition-colors cursor-pointer"><Hash className="w-3.5 h-3.5" /></button>
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

                <div className="space-y-4 pb-20">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className={`flex gap-2.5 group pb-4 ${
                        index !== comments.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      <img
                        src={comment.name === 'Abdola Munir' ? (user?.photoURL || comment.avatar || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff') : comment.avatar}
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
                        <p className="text-[var(--tokyo-text)] text-sm leading-relaxed break-words">{comment.text}</p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors h-4.5 w-4.5 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer">
                            <Smile className="w-3 h-3" />
                          </button>
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
                {[
                  { user: 'Abdola Munir', action: 'set priority to', value: 'Medium', time: 'Just now' },
                  { user: 'Abdola Munir', action: 'set status to', value: toSentenceCase(idea.status || 'active'), time: 'Just now' },
                  { user: 'Abdola Munir', action: 'created this idea', value: '', time: idea.createdAt ? format(new Date(idea.createdAt), 'MMM d, yyyy') : 'Unknown' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <img
                      src={activity.user === 'Abdola Munir' ? (user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff") : "https://i.pravatar.cc/150?u=abdolamunir"}
                      className="w-7 h-7 rounded-full mt-0.5"
                      alt="avatar"
                    />
                    <div className="flex-1 text-sm leading-relaxed text-[var(--tokyo-text-faint)]">
                      <span className="text-[var(--tokyo-text-strong)] font-semibold mr-1.5">{activity.user}</span>
                      <span className="mr-1.5">{activity.action}</span>
                      {activity.value && <span className="text-[var(--tokyo-text-strong)] font-semibold mr-1.5">{activity.value}</span>}
                      <span className="text-white/10 mx-1.5">•</span>
                      <span className="text-[var(--tokyo-text-faint)] whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                ))}
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
              style={{ top: Math.min(iconPickerPos.y, window.innerHeight - 350), left: Math.min(iconPickerPos.x, window.innerWidth - 280) }}
            >
              <IconPicker
                currentIcon={idea.icon || 'Smile'}
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
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200),
              }}
            >
              <div className="property-popover-heading px-2.5 py-1 font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Select {toSentenceCase(customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? statuses : priorities).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (customDropdown.type === 'status') {
                        handleUpdate({ status: option });
                      } else {
                        handleUpdate({ priority: option as any });
                      }
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                      customDropdown.currentValue === option
                        ? "bg-[var(--tokyo-yellow-dim)] text-white"
                        : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
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
                left: Math.min(datePickerConfig.pos.x, window.innerWidth - 300),
              }}
            >
              <DatePicker
                selectedDate={datePickerConfig.currentDate}
                onSelect={(date, config) => {
                  if (datePickerConfig.id.startsWith('prop:')) {
                    const propId = datePickerConfig.id.replace('prop:', '');
                    handleUpdate({
                      customProperties: idea.customProperties?.map(p =>
                        p.id === propId ? { ...p, value: date.toISOString() } : p
                      ),
                    });
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
            <div className="fixed inset-0 z-[110]" onClick={() => setIsPropertyPickerOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="dayline-dialog fixed z-[120] max-h-[440px] w-72 overflow-auto no-scrollbar rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel)] p-2 shadow-2xl"
              style={{
                top: Math.min(propertyPickerPos.y, window.innerHeight - 300),
                left: Math.min(propertyPickerPos.x, window.innerWidth - 280),
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

        {propertyContextMenu && (
          <PropertyContextMenu
            pos={{ x: propertyContextMenu.x, y: propertyContextMenu.y }}
            onClose={() => setPropertyContextMenu(null)}
            onRename={() => {
              setEditingPropertyId(propertyContextMenu.id);
              setEditingPropertyName(
                propertyContextMenu.isSystem
                  ? getCol(propertyContextMenu.id, propertyContextMenu.id, 'Text').label
                  : (idea.customProperties?.find(p => p.id === propertyContextMenu.id)?.name || '')
              );
            }}
            onChangeIcon={() => {
              setPropertyIconPicker({
                id: propertyContextMenu.id,
                isSystem: propertyContextMenu.isSystem,
                pos: { x: propertyContextMenu.x, y: propertyContextMenu.y },
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
                left: Math.min(propertyIconPicker.pos.x, window.innerWidth - 280),
              }}
            >
              <IconPicker
                currentIcon={
                  propertyIconPicker.isSystem
                    ? getCol(propertyIconPicker.id, propertyIconPicker.id, 'Text').icon
                    : (idea.customProperties?.find(p => p.id === propertyIconPicker.id)?.icon || 'Text')
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
      </AnimatePresence>
    </div>
  );
}

export function Ideas({ onViewChange, selectedIdeaId }: { onViewChange?: (view: string) => void, selectedIdeaId?: string }) {
  const { ideas } = useAppStore();
  const [localSelectedIdeaId, setLocalSelectedIdeaId] = useState<string | null>(null);

  const effectiveSelectedIdeaId = selectedIdeaId || localSelectedIdeaId;
  const selectedIdea = effectiveSelectedIdeaId ? ideas.find(i => i.id === effectiveSelectedIdeaId) : null;

  if (selectedIdea) {
    return (
      <IdeaDetailsPage
        idea={selectedIdea}
        onBack={() => {
          if (onViewChange) {
            onViewChange('ideas');
          } else {
            setLocalSelectedIdeaId(null);
          }
        }}
      />
    );
  }

  return <IdeasList onViewChange={onViewChange} />;
}
