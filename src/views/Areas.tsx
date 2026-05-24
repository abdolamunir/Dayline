import React, { useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
import { useAppStore } from '../store';
import { Area, Task, PropertyType } from '../types';
import { 
  Layers01Icon as Layers, 
  Add01Icon as Plus, 
  MoreHorizontalIcon as MoreHorizontal, 
  Calendar01Icon as CalendarIcon, 
  DashboardSquare01Icon as LayoutGrid,
  ArrowLeft01Icon as ChevronLeft,
  UserGroupIcon as Users,
  ZapIcon as Zap,
  CheckmarkCircle02Icon as CheckCircle,
  UserIcon as User,
  SmileIcon as Smile,
  AtIcon as AtSign,
  Link01Icon as Link,
  HashtagIcon as Hash,
  AttachmentIcon as Attachment,
  Cancel01Icon as X,
  Message02Icon as MessageSquare,
  Activity01Icon as Activity,
  ListViewIcon as List,
  FilterIcon,
  Sorting01Icon as Sort,
  FlashIcon as Lightning,
  Search01Icon as Search,
  Settings01Icon as Settings,
  ArrowDown01Icon as ChevronDown,
  TextIcon as Text,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  FavouriteIcon as Heart,
  Dumbbell01Icon as Dumbbell,
  Sun01Icon as Sun,
  Settings02Icon as SettingsGear,
  PencilEdit01Icon as Pencil,
  Delete02Icon as Trash2,
  Copy01Icon as Copy,
  Target01Icon as Target,
  Folder01Icon as FolderKanban,
  StarIcon as Star
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { getDefaultPropertyValue, getPropertyTypeIcon, getPropertyTypeLabel, PROPERTY_TYPE_OPTIONS } from '../utils/propertyTypes';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';
import { PropertyContextMenu } from '../components/PropertyContextMenu';

const iconMap: Record<string, any> = {
  ...ALL_ICONS,
  Text,
  Hash,
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

const toSentenceCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const GOALS_TEMPLATE_VERSION = 'goals-database-v1';

const DEFAULT_AREA_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];

const DEFAULT_AREA_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' },
  { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
];

export function Areas() {
  const { areas, replaceAreas, projects, viewSettings, updateViewSettings, updateSidebarItem, sidebarItems } = useAppStore();
  const savedAreaSettings = viewSettings.areas || {};
  const [localSelectedAreaId, setLocalSelectedAreaId] = useState<string | null>(null);

  const shouldUseSavedTemplate = savedAreaSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSavedTemplate && savedAreaSettings.tabs ? savedAreaSettings.tabs : DEFAULT_AREA_TABS);
  const [columns, setColumns] = useState(() => {
    let initial = shouldUseSavedTemplate && savedAreaSettings.columns ? savedAreaSettings.columns : DEFAULT_AREA_COLUMNS;
    
    const ALL_KNOWN_BUILTINS = ['title', 'status', 'priority', 'date', 'deadline', 'progress', 'creator', 'assigned', 'areas'];
    const ALLOWED_BUILTINS = ['title', 'status', 'priority', 'creator', 'assigned'];
    initial = initial.filter((c: any) => !ALL_KNOWN_BUILTINS.includes(c.id) || ALLOWED_BUILTINS.includes(c.id));

    if (!initial.some((c: any) => c.id === 'creator')) {
      initial.push({ id: 'creator', label: 'Creator', icon: 'User', width: '180px' });
    }
    if (!initial.some((c: any) => c.id === 'assigned')) {
      initial.splice(1, 0, { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' });
    }
    return initial;
  });

  const selectedArea = areas.find(a => a.id === localSelectedAreaId);
  const areaDetailProperties = [
    { id: 'assigned', name: 'Assigned', type: 'text' as const, value: '' },
    ...areas.flatMap(area => area.customProperties || []),
  ].reduce<Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>>((properties, property) => {
    if (properties.some(existingProperty => existingProperty.id === property.id)) return properties;
    properties.push(property);
    return properties;
  }, []);

  if (selectedArea) {
    return (
      <AreaDetailsPage 
        area={selectedArea} 
        onBack={() => setLocalSelectedAreaId(null)}
      />
    );
  }

  const sidebarItem = sidebarItems.find(i => i.id === 'areas');

  const areaDatabasePage = {
    id: 'areas',
    title: sidebarItem?.label || savedAreaSettings.title || 'Areas',
    description: savedAreaSettings.description || 'Life categories and continuous responsibilities.',
    icon: sidebarItem?.icon || savedAreaSettings.icon || 'Layers',
    kind: 'database' as const,
    activeTab: shouldUseSavedTemplate ? savedAreaSettings.activeTab : 'active',
    tabs,
    columns,
    sortConfigs: shouldUseSavedTemplate ? (savedAreaSettings.sortConfigs || []) : [],
    items: areas.map(area => ({
      id: area.id,
      title: area.name,
      icon: area.icon || 'Layers',
      status: area.status,
      priority: area.priority || 'medium',
      progress: 0,
      properties: {
        areas: `${area.projectIds.length} Projects`,
        assigned: area.assignee || 'Unassigned',
        ...Object.fromEntries((area.customProperties || []).map(property => [property.id, property.value])),
      },
    })),
    properties: areaDetailProperties,
    content: '',
  };

  return (
    <TableView
      page={areaDatabasePage}
      onItemClick={(itemId) => setLocalSelectedAreaId(itemId)}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('areas', {
          ...savedAreaSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
          templateVersion: GOALS_TEMPLATE_VERSION,
        });
        updateSidebarItem('areas', updatedPage.title, updatedPage.icon);
        replaceAreas(updatedPage.items.map(item => {
          const existingArea = areas.find(area => area.id === item.id);
          const customProperties = updatedPage.properties
            .filter(property => property.id !== 'assigned')
            .map(property => {
              const existingProperty = existingArea?.customProperties?.find(candidate => candidate.id === property.id);
              return {
                ...property,
                value: item.properties[property.id] ?? existingProperty?.value ?? property.value,
              };
            });
          const assignee = item.properties.assigned && item.properties.assigned !== 'Unassigned'
            ? String(item.properties.assigned)
            : existingArea?.assignee;
          return existingArea
            ? { ...existingArea, name: item.title, icon: item.icon, status: item.status, priority: item.priority, assignee, customProperties }
            : {
              id: item.id,
              name: item.title,
              description: '',
              status: item.status,
              goalIds: [],
              projectIds: [],
              priority: item.priority,
              icon: item.icon || 'Layers',
              assignee,
              customProperties,
            };
        }));
      }}
    />
  );
}

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

function AreaDetailsPage({ area, onBack }: { 
  area: Area, 
  onBack: () => void
}) {
  const { updateArea, deleteArea, projects, goals, user, viewSettings, updateViewSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('Projects');
  const [commentText, setCommentText] = useState('');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'status' | 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{ 
    id: string;
    pos: { x: number, y: number };
    currentDate?: Date;
    config?: DateConfig;
  } | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number; y: number; id: string; isSystem: boolean } | null>(null);
  const [propertyIconPicker, setPropertyIconPicker] = useState<{ id: string; isSystem: boolean; pos: { x: number; y: number } } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState('');
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: 'This area needs more focus.', avatar: 'https://i.pravatar.cc/150?u=5', reactions: [] as Array<{ emoji: string; count: number }> }
  ]);

  const priorities = ['low', 'medium', 'high'];
  const statuses = ['active', 'archived'];

  const handleUpdate = (updates: Partial<Area>) => {
    updateArea(area.id, updates);
  };

  const handleDelete = () => {
    deleteArea(area.id);
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
      customProperties: [...(area.customProperties || []), newProp]
    });
    setIsPropertyPickerOpen(false);
  };

  const handleUpdateProperty = (propId: string, value: any) => {
    handleUpdate({
      customProperties: area.customProperties?.map(p => p.id === propId ? { ...p, value } : p)
    });
  };

  const handleDeleteProperty = (propId: string) => {
    handleUpdate({
      customProperties: area.customProperties?.filter(p => p.id !== propId)
    });
  };

  const columns = viewSettings?.areas?.columns || [];
  const getCol = (id: string, defaultLabel: string, defaultIcon: string) => {
    const col = columns.find((column: any) => column.id === id);
    return { label: col?.label || defaultLabel, icon: col?.icon || defaultIcon, hidden: col?.hidden };
  };

  const updateColumnMeta = (id: string, updates: Partial<{ label: string; icon: string; hidden: boolean }>) => {
    const savedSettings = viewSettings.areas || {};
    const cols = savedSettings.columns || [];
    const existing = cols.find((column: any) => column.id === id);
    const current = getCol(id, id, 'File');
    const updatedColumns = existing
      ? cols.map((column: any) => column.id === id ? { ...column, ...updates } : column)
      : [...cols, { id, label: updates.label || current.label, icon: updates.icon || current.icon, width: '150px', hidden: updates.hidden }];
    updateViewSettings('areas', { ...savedSettings, columns: updatedColumns });
  };

  const handleRenameProperty = (id: string, isSystem: boolean, newName: string) => {
    if (!newName.trim()) return;
    if (isSystem) {
      updateColumnMeta(id, { label: newName.trim() });
      return;
    }
    updateColumnMeta(id, { label: newName.trim() });
    handleUpdate({
      customProperties: area.customProperties?.map((prop) => prop.id === id ? { ...prop, name: newName.trim() } : prop)
    });
  };

  const handleUpdatePropertyIcon = (id: string, isSystem: boolean, icon: string) => {
    if (isSystem) {
      updateColumnMeta(id, { icon });
      return;
    }
    updateColumnMeta(id, { icon });
    handleUpdate({
      customProperties: area.customProperties?.map((prop) => prop.id === id ? { ...prop, icon } : prop)
    });
  };

  const handleDeletePropertyAction = (id: string, isSystem: boolean) => {
    if (isSystem) {
      updateColumnMeta(id, { hidden: true });
      return;
    }
    handleDeleteProperty(id);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      setComments([
        {
          id: `c${Date.now()}`,
          name: 'Abdola Munir',
          time: 'Just now',
          text: commentText,
          avatar: user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff',
          reactions: []
        },
        ...comments
      ]);
      setCommentText('');
    }
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

  const areaProjects = projects.filter(p => area.projectIds?.includes(p.id));
  const areaGoals = goals.filter(g => area.goalIds?.includes(g.id));
  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "property-label-trigger flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] [&_input]:min-w-0 cursor-pointer";
  const addPropertyClass = "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] leading-none font-medium text-[var(--tokyo-text-faint)] transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap cursor-pointer";
  const renderIcon = (iconName: string, fallback: React.ElementType, className: string) => {
    const IconComponent = ALL_ICONS[iconName] || fallback;
    return <IconComponent className={className} />;
  };
  const renderPropertyLabel = (
    id: string,
    isSystem: boolean,
    label: string,
    iconName: string | undefined,
    fallback: React.ElementType
  ) => (
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
  const priorityCol = getCol('priority', 'Priority', 'Zap');
  const statusCol = getCol('status', 'Status', 'CheckCircle');
  const creatorCol = getCol('creator', 'Creator', 'User');

  const handleCopyAreaLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#area-details:${area.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="inner-detail-layout flex-1">
        <div className="inner-detail-main">
          {/* Header */}
          <div className="inner-detail-header flex-shrink-0 w-full">
            <div className="inner-detail-titlebar mb-5">
              <div className="inner-detail-titlebar-content flex items-center gap-3">
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setIconPickerId(area.id);
                    setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
                >
                  {React.createElement(iconMap[area.icon || 'Layers'] || Layers, { className: "w-6 h-6" })}
                </div>
                <div className="min-w-0 flex-1">
                  <input 
                    type="text"
                    value={area.name}
                    onChange={(e) => handleUpdate({ name: e.target.value })}
                    className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                    placeholder="Untitled Area"
                  />
                </div>
                <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
                  <button
                    onClick={() => void handleCopyAreaLink()}
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
            </div>
          </div>

          <div className="inner-detail-document">
            <div className="min-h-[42vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={area.description || ''}
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
            <div className={propertyRowClass}>
              {renderPropertyLabel('assigned', true, assignedCol.label, assignedCol.icon, Users)}
              {renderPersonValue(area.assignee)}
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
                      id: area.id,
                      type: 'priority',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: area.priority || 'medium'
                    });
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] h-7 flex items-center",
                    getPriorityBadgeClasses(area.priority || 'medium')
                  )}
                >
                  {toSentenceCase(area.priority || 'medium')}
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
                      id: area.id,
                      type: 'status',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: area.status || 'active'
                    });
                  }}
                  className={cn(
                    "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] h-7",
                    area.status === 'active' 
                      ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" 
                      : "bg-stone-500/20 text-stone-400"
                  )}
                >
                  <span>{toSentenceCase(area.status || 'active')}</span>
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

            {/* Custom Properties */}
            {area.customProperties?.map(prop => {
              const PropIcon = {
                text: Text,
                number: Hash,
                select: Layers,
                date: CalendarIcon
              }[prop.type] || Text;

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
                        className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] rounded-lg h-7 flex items-center transition-all hover:text-white flex-1"
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
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all"
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
              {['Projects', 'Goals', 'Comments', 'Activity'].map(tabId => (
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
        <div className="inner-detail-panel-content flex-1 w-full">
          {activeTab === 'Projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areaProjects.map((project) => (
                <div key={project.id} className="p-4 bg-white/[0.02] border border-[var(--tokyo-border)] rounded-xl group hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <FolderKanban className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                    <span className="text-[var(--tokyo-text-strong)] font-medium">{project.name}</span>
                  </div>
                  <p className="text-[var(--tokyo-text-faint)] text-sm line-clamp-1">{project.description}</p>
                </div>
              ))}
              {areaProjects.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/20">
                  No projects in this area yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'Goals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areaGoals.map((goal) => (
                <div key={goal.id} className="p-4 bg-white/[0.02] border border-[var(--tokyo-border)] rounded-xl group hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                    <span className="text-[var(--tokyo-text-strong)] font-medium">{goal.title}</span>
                  </div>
                  <p className="text-[var(--tokyo-text-faint)] text-sm line-clamp-1">{goal.description}</p>
                </div>
              ))}
              {areaGoals.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/20">
                  No goals in this area yet.
                </div>
              )}
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
                        {comment.reactions?.map((r, ri) => (
                          <button 
                            key={ri} 
                            className="flex h-4 items-center gap-1 rounded bg-[var(--tokyo-hover)] border border-[var(--tokyo-border)] px-1 text-[8.5px] leading-none text-[var(--tokyo-text-strong)] font-medium hover:bg-white/5 transition-all cursor-pointer"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[var(--tokyo-text-faint)]">{r.count}</span>
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
              {[
                { user: 'Abdola Munir', action: 'created this area', value: '', time: '3h ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <img src={activity.user === 'Abdola Munir' ? (user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff") : "https://i.pravatar.cc/150?u=abdolamunir"} className="w-7 h-7 rounded-full mt-0.5" alt="avatar" />
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

      {/* Popovers live outside tab content */}
      <AnimatePresence>
        {customDropdown && (
          <>
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => setCustomDropdown(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="property-popover fixed z-[120] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
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
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => setDatePickerConfig(null)}
            />
            <div 
              className="fixed z-[120]"
              style={{ 
                top: Math.min(datePickerConfig.pos.y, window.innerHeight - 450), 
                left: Math.min(datePickerConfig.pos.x, window.innerWidth - 300) 
              }}
            >
              <DatePicker 
                selectedDate={datePickerConfig.currentDate}
                initialConfig={datePickerConfig.config}
                onSelect={(date) => {
                  if (datePickerConfig.id.startsWith('prop:')) {
                    const propId = datePickerConfig.id.replace('prop:', '');
                    handleUpdate({
                      customProperties: area.customProperties?.map(p => (
                        p.id === propId ? { ...p, value: date.toISOString() } : p
                      ))
                    });
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

        {iconPickerId && iconPickerPos && (
          <>
            <div 
              className="fixed inset-0 z-[110]" 
              onClick={() => {
                setIconPickerId(null);
              }}
            />
            <div 
              className="fixed z-[120]"
              style={{ 
                top: Math.min(iconPickerPos.y, window.innerHeight - 350), 
                left: Math.min(iconPickerPos.x, window.innerWidth - 280) 
              }}
            >
              <IconPicker 
                currentIcon={area.icon || 'Layers'}
                onSelect={(iconName) => {
                  handleUpdate({ icon: iconName });
                  setIconPickerId(null);
                }}
                onClose={() => {
                  setIconPickerId(null);
                }}
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
                  : (area.customProperties?.find((prop) => prop.id === propertyContextMenu.id)?.name || '')
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
                    : (area.customProperties?.find((prop) => prop.id === propertyIconPicker.id)?.icon || 'File')
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
