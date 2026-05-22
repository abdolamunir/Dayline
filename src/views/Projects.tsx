import React, { useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
import { useAppStore } from '../store';
import { Project, Task, PropertyType } from '../types';
import { 
  Folder01Icon as FolderKanban, 
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
  Layers01Icon as Layers,
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
  StarIcon as Star
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { getDefaultPropertyValue, getPropertyTypeIcon, getPropertyTypeLabel, PROPERTY_TYPE_OPTIONS } from '../utils/propertyTypes';
import { PropertyContextMenu } from '../components/PropertyContextMenu';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';

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

const DEFAULT_PROJECT_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
];

export function Projects() {
  const { projects, updateProject, replaceProjects, goals, areas, viewSettings, updateViewSettings, updateSidebarItem, sidebarItems } = useAppStore();
  const savedProjectSettings = viewSettings.projects || {};
  const [localSelectedProjectId, setLocalSelectedProjectId] = useState<string | null>(null);

  const shouldUseSavedTemplate = savedProjectSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSavedTemplate && savedProjectSettings.tabs ? savedProjectSettings.tabs : DEFAULT_PROJECT_TABS);
  const [columns, setColumns] = useState(() => {
    let initial = shouldUseSavedTemplate && savedProjectSettings.columns ? savedProjectSettings.columns : DEFAULT_PROJECT_COLUMNS;
    
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

  const selectedProject = projects.find(p => p.id === localSelectedProjectId);
  const projectDetailProperties = [
    { id: 'assigned', name: 'Assigned', type: 'text' as const, value: '' },
    { id: 'creator', name: 'Creator', type: 'text' as const, value: '' },
    ...projects.flatMap(project => project.customProperties || []),
  ].reduce<Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>>((properties, property) => {
    if (properties.some(existingProperty => existingProperty.id === property.id)) return properties;
    properties.push(property);
    return properties;
  }, []);

  if (selectedProject) {
    return (
      <ProjectDetailsPage 
        project={selectedProject} 
        onBack={() => setLocalSelectedProjectId(null)}
      />
    );
  }

  const sidebarItem = sidebarItems.find(i => i.id === 'projects');
  const getProjectAreaId = (project: Project) => {
    if (project.areaId) return project.areaId;

    const directArea = areas.find(area => area.projectIds?.includes(project.id));
    if (directArea) return directArea.id;

    const linkedGoal = goals.find(goal => goal.id === project.goalId);
    return linkedGoal?.areaId || '';
  };
  const projectDatabasePage = {
    id: 'projects',
    title: sidebarItem?.label || savedProjectSettings.title || 'Projects',
    description: savedProjectSettings.description || 'Containers for your tasks.',
    icon: sidebarItem?.icon || savedProjectSettings.icon || 'FolderKanban',
    kind: 'database' as const,
    activeTab: shouldUseSavedTemplate ? savedProjectSettings.activeTab : 'planning',
    tabs,
    columns,
    sortConfigs: shouldUseSavedTemplate ? (savedProjectSettings.sortConfigs || []) : [],
    items: projects.map(project => ({
      id: project.id,
      title: project.name,
      icon: project.icon || 'FolderKanban',
      status: project.status,
      priority: project.priority || 'medium',
      date: project.deadline || project.targetDate,
      progress: 0,
      properties: {
        areas: getProjectAreaId(project),
        assigned: project.assignee || 'Unassigned',
        creator: 'Abdola Munir',
        ...Object.fromEntries((project.customProperties || []).map(property => [property.id, property.value])),
      },
    })),
    properties: projectDetailProperties,
    content: '',
  };

  return (
    <TableView
      page={projectDatabasePage}
      onItemClick={(itemId) => setLocalSelectedProjectId(itemId)}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('projects', {
          ...savedProjectSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
          templateVersion: GOALS_TEMPLATE_VERSION,
        });
        updateSidebarItem('projects', updatedPage.title, updatedPage.icon);
        replaceProjects(updatedPage.items.map(item => {
          const existingProject = projects.find(project => project.id === item.id);
          const customProperties = updatedPage.properties
            .filter(property => property.id !== 'assigned' && property.id !== 'creator')
            .map(property => {
              const existingProperty = existingProject?.customProperties?.find(candidate => candidate.id === property.id);
              return {
                ...property,
                value: item.properties[property.id] ?? existingProperty?.value ?? property.value,
              };
            });
          const assignee = item.properties.assigned && item.properties.assigned !== 'Unassigned'
            ? String(item.properties.assigned)
            : existingProject?.assignee;
          const areaValue = String(item.properties.areas || '');
          const areaId = areas.find(area => area.id === areaValue || area.name === areaValue)?.id;
          return existingProject
            ? { ...existingProject, name: item.title, icon: item.icon, status: item.status as Project['status'], priority: item.priority, deadline: item.date, assignee, areaId, customProperties }
            : {
              id: item.id,
              name: item.title,
              description: '',
              status: item.status as Project['status'],
              taskIds: [],
              areaId,
              priority: item.priority,
              icon: item.icon || 'FolderKanban',
              deadline: item.date,
              assignee,
              customProperties,
            };
        }));
      }}
    />
  );
}
function ProjectDetailsPage({ project, onBack }: { 
  project: Project, 
  onBack: () => void
}) {
  const { updateProject, deleteProject, tasks, addTask, updateTask, user, viewSettings, updateViewSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('To-Dos');
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
    propId?: string;
  } | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [propertyIconPicker, setPropertyIconPicker] = useState<{ id: string, isSystem: boolean, pos: { x: number, y: number } } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number, y: number, id: string, isSystem: boolean } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState<string>('');
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: '@stephenrobert I will do it ASAP.', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: '2', name: 'Stephen Robert', time: '50m ago', text: 'Project looks good, let\'s focus on the UI components.', avatar: 'https://i.pravatar.cc/150?u=4', reactions: [{ emoji: 'Like', count: 1 }] }
  ]);

  const priorities = ['low', 'medium', 'high'];
  const statuses = ['planning', 'active', 'completed', 'paused'];

  const handleUpdate = (updates: Partial<Project>) => {
    updateProject(project.id, updates);
  };

  const handleDelete = () => {
    deleteProject(project.id);
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
      customProperties: [...(project.customProperties || []), newProp]
    });
    setIsPropertyPickerOpen(false);
  };

  const columns = viewSettings?.projects?.columns || [];
  const getCol = (id: string, defaultLabel: string, defaultIcon: string) => {
    const col = columns.find((c: any) => c.id === id);
    return { label: col?.label || defaultLabel, icon: col?.icon || defaultIcon, hidden: col?.hidden };
  };

  const handleRenameProperty = (id: string, isSystem: boolean, newName: string) => {
    if (!newName.trim()) return;
    if (isSystem) {
      const savedSettings = viewSettings.projects || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, label: newName.trim() } : c)
        : [...cols, { id, label: newName.trim(), icon: getCol(id, id, 'Text').icon, width: '150px' }];
      updateViewSettings('projects', { ...savedSettings, columns: updatedCols });
    } else {
      const savedSettings = viewSettings.projects || {};
      const cols = savedSettings.columns || [];
      const existingProperty = project.customProperties?.find(p => p.id === id);
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, label: newName.trim() } : c)
        : [...cols, { id, label: newName.trim(), icon: existingProperty?.icon || 'Text', width: '180px' }];
      updateViewSettings('projects', { ...savedSettings, columns: updatedCols });
      handleUpdate({
        customProperties: project.customProperties?.map(p => 
          p.id === id ? { ...p, name: newName.trim() } : p
        )
      });
    }
  };

  const handleUpdatePropertyIcon = (id: string, isSystem: boolean, newIcon: string) => {
    if (isSystem) {
      const savedSettings = viewSettings.projects || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, icon: newIcon } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: newIcon, width: '150px' }];
      updateViewSettings('projects', { ...savedSettings, columns: updatedCols });
    } else {
      const savedSettings = viewSettings.projects || {};
      const cols = savedSettings.columns || [];
      const existingProperty = project.customProperties?.find(p => p.id === id);
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, icon: newIcon } : c)
        : [...cols, { id, label: existingProperty?.name || id, icon: newIcon, width: '180px' }];
      updateViewSettings('projects', { ...savedSettings, columns: updatedCols });
      handleUpdate({
        customProperties: project.customProperties?.map(p => 
          p.id === id ? { ...p, icon: newIcon } : p
        )
      });
    }
  };

  const handleDeletePropertyAction = (id: string, isSystem: boolean) => {
    if (isSystem) {
      const savedSettings = viewSettings.projects || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, hidden: true } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: getCol(id, id, 'Text').icon, width: '150px', hidden: true }];
      updateViewSettings('projects', { ...savedSettings, columns: updatedCols });
    } else {
      handleUpdate({
        customProperties: project.customProperties?.filter(p => p.id !== id)
      });
    }
  };

  const statusCol = getCol('status', 'Status', 'CheckCircle2');
  const creatorCol = getCol('creator', 'Creator', 'User');
  const priorityCol = getCol('priority', 'Priority', 'Zap');
  const dateCol = getCol('deadline', 'Date', 'Calendar');
  const progressCol = getCol('progress', 'Progress', 'Circle');
  const assignedCol = getCol('assigned', 'Assigned', 'Users');

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "property-label-trigger flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] [&_input]:min-w-0 cursor-pointer";
  const addPropertyClass = "flex h-8 items-center gap-2 rounded-lg px-2.5 text-[13px] leading-none font-medium text-[var(--tokyo-text-faint)] transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap cursor-pointer";

  const renderIcon = (iconName: string, fallback: React.ElementType, className: string) => {
    const IconComponent = ALL_ICONS[iconName] || fallback;
    return <IconComponent className={className} />;
  };

  const handlePropertyLabelClick = (
    e: React.MouseEvent,
    id: string,
    isSystem: boolean,
    label: string
  ) => {
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

  const handleUpdateProperty = (propId: string, value: any) => {
    handleUpdate({
      customProperties: project.customProperties?.map(p => p.id === propId ? { ...p, value } : p)
    });
  };

  const handleDeleteProperty = (propId: string) => {
    handleUpdate({
      customProperties: project.customProperties?.filter(p => p.id !== propId)
    });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      setComments([
        {
          id: `c${Date.now()}`,
          name: 'Abdola Munir',
          time: 'Just now',
          text: commentText,
          avatar: user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff'
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
        <span className="truncate text-sm font-medium">{displayName}</span>
      </div>
    );
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({
      id,
      title: '',
      status: 'todo',
      priority: 'medium',
      projectId: project.id,
      tags: []
    });
  };

  const handleCopyProjectLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#project-details:${project.id}`
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
            <div className="inner-detail-titlebar mb-5 flex items-center gap-3">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setIconPickerId(project.id);
                  setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
              >
                {React.createElement(iconMap[project.icon || 'FolderKanban'] || FolderKanban, { className: "w-6 h-6" })}
              </div>
              <div className="min-w-0 flex-1">
                <input 
                  type="text"
                  value={project.name}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                  placeholder="Untitled Project"
                />
              </div>
              <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
                <button
                  onClick={() => void handleCopyProjectLink()}
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

          <div className="inner-detail-document">
            <div className="min-h-[42vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={project.description || ''}
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
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, 'assigned', true, assignedCol.label)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, 'assigned', true)}>
                  {renderIcon(assignedCol.icon, Users, "w-4 h-4")}
                  {editingPropertyId === 'assigned' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('assigned', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('assigned', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{assignedCol.label}</span>
                  )}
                </div>
              </div>
            {renderPersonValue(project.assignee)}
          </div>
          )}

          {/* Date */}
          {!dateCol.hidden && (
            <div 
              className={propertyRowClass}
              onClick={(e) => {
if (!(e.target as HTMLElement).closest('.property-label-trigger')) return;
e.stopPropagation();
setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'deadline', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, 'deadline', true, dateCol.label)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, 'deadline', true)}>
                  {renderIcon(dateCol.icon, CalendarIcon, "w-4 h-4")}
                  {editingPropertyId === 'deadline' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('deadline', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('deadline', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{dateCol.label}</span>
                  )}
                </div>
              </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  id: project.id,
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: project.deadline ? new Date(project.deadline) : undefined
                });
              }}
              className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] rounded-lg h-7 flex items-center transition-all hover:text-white"
            >
              {project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'Set deadline...'}
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
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, 'priority', true, priorityCol.label)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, 'priority', true)}>
                  {renderIcon(priorityCol.icon, Zap, "w-4 h-4")}
                  {editingPropertyId === 'priority' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('priority', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('priority', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{priorityCol.label}</span>
                  )}
                </div>
              </div>
            <div className="relative flex items-center">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    id: project.id,
                    type: 'priority',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: project.priority || 'medium'
                  });
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] h-7 flex items-center",
                  getPriorityBadgeClasses(project.priority || 'medium')
                )}
              >
                {toSentenceCase(project.priority || 'medium')}
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
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, 'status', true, statusCol.label)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, 'status', true)}>
                  {renderIcon(statusCol.icon, CheckCircle, "w-4 h-4")}
                  {editingPropertyId === 'status' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('status', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('status', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{statusCol.label}</span>
                  )}
                </div>
              </div>
            <div className="relative flex items-center gap-2">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    id: project.id,
                    type: 'status',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: project.status
                  });
                }}
                className={cn(
                  "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] h-7",
                  project.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                  project.status === 'active' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                  project.status === 'planning' ? "bg-stone-500/20 text-stone-400" :
                  "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                )}
              >
                <span>{toSentenceCase(project.status)}</span>
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
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass} onClick={(e) => handlePropertyLabelClick(e, 'creator', true, creatorCol.label)} onContextMenu={(e) => handlePropertyLabelContextMenu(e, 'creator', true)}>
                  {renderIcon(creatorCol.icon, User, "w-4 h-4")}
                  {editingPropertyId === 'creator' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('creator', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('creator', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{creatorCol.label}</span>
                  )}
                </div>
              </div>
            {renderPersonValue('Abdola Munir')}
          </div>
          )}

          {/* Custom Properties */}
          {project.customProperties?.map(prop => {
            const PropIcon = {
              text: Text,
              number: Hash,
              select: Layers,
              date: CalendarIcon
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
                        className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-sm font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/5 outline-none focus:outline-none focus:ring-transparent shadow-none"
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
        <div className="inner-detail-panel-content flex-1 w-full">
          {activeTab === 'To-Dos' && (
            <div className="space-y-2">
              {projectTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.015] border border-[var(--tokyo-border)] rounded-md group hover:bg-white/[0.03] transition-all">
                  <button 
                    onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                    className={cn(
                      "w-[18px] h-[18px] shrink-0 rounded-[4px] border-[2px] flex items-center justify-center transition-all cursor-pointer",
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
                    placeholder="Task description..."
                    className={cn(
                      "bg-transparent border-none outline-none flex-1 text-sm transition-all placeholder:text-white/10 outline-none focus:outline-none focus:ring-transparent shadow-none",
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
              <div className="bg-white/[0.025] border border-[var(--tokyo-border)] rounded-lg p-3 mb-8">
                <div className="flex gap-2.5 mb-2.5">
                  <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-7 h-7 rounded-full" alt="me" />
                  <textarea 
                    rows={1.5}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your comment..." 
                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent focus-visible:ring-0 focus-visible:outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-sm resize-none py-0.5 shadow-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 text-[var(--tokyo-text-faint)]">
                    <button className="hover:text-white transition-colors"><Smile className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors"><AtSign className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors"><Link className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors"><Hash className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors"><Attachment className="w-3.5 h-3.5" /></button>
                  </div>
                  <button 
                    onClick={handleAddComment}
                    className="bg-[var(--tokyo-yellow-dim)] text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-lg shadow-black/20"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-7 pb-20">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <img src={comment.name === 'Abdola Munir' ? (user?.photoURL || comment.avatar) : comment.avatar} className="w-8 h-8 rounded-full" alt="avatar" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--tokyo-text-strong)] font-semibold text-sm">{comment.name}</span>
                          <span className="text-white/20 text-xs">•</span>
                          <span className="text-[var(--tokyo-text-faint)] text-[11px]">{comment.time}</span>
                        </div>
                        <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[var(--tokyo-text)] text-sm leading-relaxed">
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-2.5 pt-1">
                        <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors"><Smile className="w-3.5 h-3.5" /></button>
                        {comment.reactions?.map((r, ri) => (
                          <button key={ri} className="flex items-center gap-1 px-1.5 h-5 rounded bg-[var(--tokyo-hover)] border border-[var(--tokyo-border)] text-[10px] font-medium">
                            <span>{r.emoji}</span>
                            <span className="text-[var(--tokyo-text-faint)]">{r.count}</span>
                          </button>
                        ))}
                        <button className="text-[var(--tokyo-text-muted)] text-[11px] font-medium hover:text-white transition-colors">Reply</button>
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
                { user: 'Abdola Munir', action: 'changed status to', value: project.status, time: 'Just now' },
                { user: 'Abdola Munir', action: 'created this project', value: '', time: '3h ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <img src={activity.user === 'Abdola Munir' ? (user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff") : "https://i.pravatar.cc/150?u=abdolamunir"} className="w-7 h-7 rounded-full" alt="avatar" />
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--tokyo-text-strong)] font-medium">{activity.user}</span>
                    <span className="text-[var(--tokyo-text-faint)]">{activity.action}</span>
                    {activity.value && <span className="text-[var(--tokyo-text-strong)] font-medium">{toSentenceCase(activity.value)}</span>}
                    <span className="text-white/20">•</span>
                    <span className="text-[var(--tokyo-text-faint)]">{activity.time}</span>
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
                        handleUpdate({ status: option as any });
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
                onSelect={(date) => {
                  if (datePickerConfig.id.startsWith('prop:')) {
                    const propId = datePickerConfig.id.replace('prop:', '');
                    handleUpdate({
                      customProperties: project.customProperties?.map(p => (
                        p.id === propId ? { ...p, value: date.toISOString() } : p
                      ))
                    });
                  } else {
                    handleUpdate({
                      deadline: format(date, 'yyyy-MM-dd')
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
                currentIcon={project.icon || 'FolderKanban'}
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
              if (propertyContextMenu.isSystem) {
                setEditingPropertyName(getCol(propertyContextMenu.id, propertyContextMenu.id, 'Text').label);
              } else {
                setEditingPropertyName(project.customProperties?.find(p => p.id === propertyContextMenu.id)?.name || '');
              }
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
            <div 
              className="fixed inset-0 z-[160]" 
              onClick={() => setPropertyIconPicker(null)}
            />
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
                    ? getCol(propertyIconPicker.id, propertyIconPicker.id, 'Text').icon 
                    : project.customProperties?.find(p => p.id === propertyIconPicker.id)?.icon || 'Text'
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
