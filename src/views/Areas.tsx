import React, { useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
import { useAppStore } from '../store';
import { Area, Task } from '../types';
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
  Folder01Icon as FolderKanban
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';

const iconMap: Record<string, any> = ALL_ICONS;

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
  { id: 'areas', label: 'Areas', icon: 'Layers', width: '180px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
];

export function Areas() {
  const { areas, updateArea, addArea, deleteArea, duplicateArea, reorderAreas, replaceAreas, projects, goals, viewSettings, updateViewSettings, updateSidebarItem } = useAppStore();
  const savedAreaSettings = viewSettings.areas || {};
  const [activeTabId, setActiveTabId] = useState('all');
  const [localSelectedAreaId, setLocalSelectedAreaId] = useState<string | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingAreaName, setEditingAreaName] = useState('');
  const [areaContextMenu, setAreaContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{ id: string, type: 'status' | 'priority', pos: { x: number, y: number }, currentValue: string } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{ id: string, pos: { x: number, y: number }, currentDate?: Date, config?: DateConfig } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  const shouldUseSavedTemplate = savedAreaSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSavedTemplate && savedAreaSettings.tabs ? savedAreaSettings.tabs : DEFAULT_AREA_TABS);

  const [columns, setColumns] = useState(shouldUseSavedTemplate && savedAreaSettings.columns ? savedAreaSettings.columns : DEFAULT_AREA_COLUMNS);

  const filteredAreas = areas.filter(a => {
    if (activeTabId === 'all') return true;
    return a.status === activeTabId;
  });

  const handleNewArea = () => {
    const id = `area-${Date.now()}`;
    addArea({
      id,
      name: 'Untitled Area',
      description: '',
      status: 'active',
      goalIds: [],
      projectIds: [],
      priority: 'medium',
      icon: 'Layers'
    });
    setEditingAreaId(id);
    setEditingAreaName('Untitled Area');
  };

  const handleRenameArea = () => {
    if (editingAreaId && editingAreaName.trim()) {
      const area = areas.find(a => a.id === editingAreaId);
      if (area) {
        updateArea(editingAreaId, { name: editingAreaName.trim() });
      }
    }
    setEditingAreaId(null);
  };

  const handleAreaContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setAreaContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const selectedArea = areas.find(a => a.id === localSelectedAreaId);
  const areaDetailProperties = [
    { id: 'assigned', name: 'Assigned', type: 'text' as const, value: '' },
    ...areas.flatMap(area => area.customProperties || []),
  ].reduce<Array<{ id: string; name: string; type: 'text' | 'number' | 'select' | 'date'; value: any }>>((properties, property) => {
    if (properties.some(existingProperty => existingProperty.id === property.id)) return properties;
    properties.push(property);
    return properties;
  }, []);

  if (selectedArea) {
    return (
      <AreaDetailsPage 
        area={selectedArea} 
        onBack={() => setLocalSelectedAreaId(null)}
        setCustomDropdown={setCustomDropdown}
        setDatePickerConfig={setDatePickerConfig}
      />
    );
  }

  const areaDatabasePage = {
    id: 'areas',
    title: savedAreaSettings.title || 'Areas',
    description: savedAreaSettings.description || 'Life categories and continuous responsibilities.',
    icon: savedAreaSettings.icon || 'Layers',
    kind: 'database' as const,
    activeTab: shouldUseSavedTemplate ? savedAreaSettings.activeTab : 'planning',
    tabs,
    columns,
    sortConfigs: shouldUseSavedTemplate ? (savedAreaSettings.sortConfigs || []) : [],
    items: areas.map(area => ({
      id: area.id,
      title: area.name,
      icon: area.icon || 'Layers',
      status: area.status || 'active',
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

  return (
    <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)]">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="min-w-0 text-2xl md:text-[28px] font-semibold text-[var(--tokyo-text-strong)] tracking-tight leading-tight">Areas</h1>
              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-hover)] px-2 text-[13px] font-semibold text-[var(--tokyo-text-faint)]">
                {areas.length}
              </span>
            </div>
            <p className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-[15px] leading-normal">Life categories and continuous responsibilities.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[var(--tokyo-text-faint)]">
          <button className="p-2 hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-white transition-colors">
            <FilterIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNewArea}
            className="ml-2 bg-[var(--tokyo-yellow-dim)] text-white px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 [stroke-width:2.4]" />
            New Area
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--tokyo-border)] pb-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 pl-[5px] pr-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeTabId === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded"><TabIcon className="w-4 h-4" /></span>
                {tab.label}
              </button>
            );
          })}
        </div>

      <div className="flex-1 overflow-visible">
      <div className={cn("-ml-6 h-full w-[calc(100%+1.5rem)] pl-6", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
        <table className="text-left border-separate border-spacing-0 table-fixed min-w-[800px] w-full">
          <thead>
            <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
              {columns.map((col, index) => (
                <th 
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    "relative px-4 py-1 h-12 text-left border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-visible",
                    index === 0 && "pl-[5px]"
                  )}
                >
                  <div className="flex items-center gap-0.5 w-full min-w-0 overflow-hidden pr-2">
                    <span className="w-6 h-6 rounded-md text-[var(--tokyo-text-muted)]/80 flex items-center justify-center shrink-0">
                      <col.icon className="w-4 h-4" />
                    </span>
                    <span className="capitalize text-[var(--tokyo-text-muted)]/80 px-1 h-7 rounded-md text-sm font-medium inline-flex min-w-0 max-w-full items-center whitespace-nowrap overflow-hidden text-ellipsis">
                      {col.label.toLowerCase()}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <Reorder.Group 
            as="tbody" 
            values={filteredAreas} 
            onReorder={(newAreas) => {
              reorderAreas(newAreas);
            }}
            className="relative"
          >
            {filteredAreas.map(area => {
              return (
                <Reorder.Item 
                  key={area.id} 
                  value={area}
                  as="tr"
                  layout="position"
                  dragElastic={0.2}
                  initial={false}
                  animate={{
                    scale: 1,
                    zIndex: 1,
                    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
                  }}
                  whileDrag={{
                    scale: 1.01,
                    zIndex: 100,
                    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
                  }}
                  transition={{ 
                    layout: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
                    scale: { duration: 0.2 },
                    boxShadow: { duration: 0.2 },
                    zIndex: { delay: 0.2 }
                  }}
                  onDragStart={() => {
                    setDraggingId(area.id);
                    isDraggingRef.current = true;
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 100);
                  }}
                  onContextMenu={(e) => handleAreaContextMenu(e, area.id)}
                  className={cn("group transition-colors select-none cursor-grab active:cursor-grabbing hover:bg-white/[0.02] whitespace-nowrap", draggingId === area.id ? "cursor-grabbing bg-white/[0.04]" : "")}
                >
                  <td className="h-12 pl-[5px] pr-4 border-b border-[var(--tokyo-border)]">
                    <div className="flex items-center gap-1">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setIconPickerId(area.id);
                          setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--tokyo-text-faint)] shrink-0 cursor-pointer transition-colors"
                      >
                        {React.createElement(iconMap[area.icon || 'Layers'] || Layers, { className: "w-4 h-4" })}
                      </div>
                      {editingAreaId === area.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingAreaName}
                          onChange={(e) => setEditingAreaName(e.target.value)}
                          onBlur={handleRenameArea}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameArea();
                            if (e.key === 'Escape') setEditingAreaId(null);
                          }}
                          className="bg-transparent border-none outline-none text-sm text-[var(--tokyo-text-strong)] w-full"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalSelectedAreaId(area.id);
                          }}
                          className="text-[var(--tokyo-text-strong)]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
                        >
                          {area.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)] text-[13px] text-[var(--tokyo-text-faint)]">
                    {area.projectIds.length} Projects
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)] text-[13px] text-[var(--tokyo-text-faint)]">
                    {area.goalIds.length} Goals
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)]">
                    <span 
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
                        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                        area.status === 'active' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                        area.status === 'archived' ? "bg-stone-500/20 text-stone-400" :
                        "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                      )}
                    >
                      {toSentenceCase(area.status || 'active')}
                    </span>
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)]">
                    <span 
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
                        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                        getPriorityBadgeClasses(area.priority || 'medium')
                      )}
                    >
                      {toSentenceCase(area.priority || 'medium')}
                    </span>
                  </td>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </table>
      </div>
      </div>
      </div>

      {/* Popovers & Context Menus */}
      <AnimatePresence>
        {iconPickerId && iconPickerPos && (
          <div 
            className="fixed z-[160]"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              top: Math.min(iconPickerPos.y, window.innerHeight - 350), 
              left: Math.min(iconPickerPos.x, window.innerWidth - 280) 
            }}
          >
            <IconPicker 
              currentIcon={areas.find(a => a.id === iconPickerId)?.icon || 'Layers'}
              onSelect={(icon) => {
                updateArea(iconPickerId, { icon });
                setIconPickerId(null);
                setIconPickerPos(null);
              }}
              onClose={() => {
                setIconPickerId(null);
                setIconPickerPos(null);
              }}
            />
          </div>
        )}

        {customDropdown && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setCustomDropdown(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[160] w-40 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden"
              style={{ top: customDropdown.pos.y, left: customDropdown.pos.x }}
            >
              {(customDropdown.type === 'status' ? ['active', 'archived'] : ['low', 'medium', 'high']).map(val => (
                <button
                  key={val}
                  onClick={() => {
                    updateArea(customDropdown.id, { [customDropdown.type]: val });
                    setCustomDropdown(null);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-sm text-left transition-colors",
                    customDropdown.currentValue === val ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                  )}
                >
                  {toSentenceCase(val)}
                </button>
              ))}
            </motion.div>
          </>
        )}

        {areaContextMenu && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setAreaContextMenu(null)} />
            <div 
              className="fixed z-[140] w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden"
              style={{ top: areaContextMenu.y, left: areaContextMenu.x }}
            >
              <button 
                onClick={() => {
                  const area = areas.find(a => a.id === areaContextMenu.id);
                  if (area) {
                    setEditingAreaId(area.id);
                    setEditingAreaName(area.name);
                  }
                  setAreaContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] transition-colors"
              >
                <Pencil className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                Rename
              </button>
              <button 
                onClick={() => {
                  duplicateArea(areaContextMenu.id);
                  setAreaContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] transition-colors"
              >
                <Copy className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                Duplicate
              </button>
              <div className="h-px bg-[var(--tokyo-border)] my-1" />
              <button 
                onClick={() => {
                  deleteArea(areaContextMenu.id);
                  setAreaContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AreaDetailsPage({ area, onBack, setCustomDropdown, setDatePickerConfig }: { 
  area: Area, 
  onBack: () => void,
  setCustomDropdown: (val: any) => void,
  setDatePickerConfig: (val: any) => void
}) {
  const { updateArea, deleteArea, projects, goals, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('Projects');
  const [commentText, setCommentText] = useState('');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: 'This area needs more focus.', avatar: 'https://i.pravatar.cc/150?u=5' }
  ]);

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

  const confirmAddProperty = (type: 'text' | 'number' | 'select' | 'date') => {
    const newProp = {
      id: `p${Date.now()}`,
      name: `New ${toSentenceCase(type)}`,
      type,
      value: ''
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

  const areaProjects = projects.filter(p => area.projectIds.includes(p.id));
  const areaGoals = goals.filter(g => area.goalIds.includes(g.id));

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">Areas</button>
            <span>/</span>
            <span className="text-[var(--tokyo-text-muted)] whitespace-nowrap">{area.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={onBack}
              className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <input 
          type="text"
          value={area.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="w-full bg-transparent text-2xl md:text-[28px] font-semibold leading-tight text-[var(--tokyo-text-strong)] mb-8 tracking-tight outline-none placeholder:text-white/10"
          placeholder="Untitled Area"
        />
        
        {/* Properties */}
        <div className="space-y-2 mb-12 max-w-2xl">
          {/* Assigned */}
          <div className="flex items-center h-8 rounded-xl">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Users className="w-4 h-4" />
              <span>Assigned</span>
            </div>
            <div className="flex items-center hover:bg-white/[0.03] transition-all px-2.5 -ml-2.5 rounded-lg h-7 cursor-pointer">
              <div className="flex -space-x-2">
                {[
                  'https://i.pravatar.cc/150?u=5',
                  'https://i.pravatar.cc/150?u=4'
                ].map((url, i) => (
                  <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-[var(--tokyo-bg)] ring-white/5" alt="avatar" />
                ))}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center h-8 rounded-xl">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Zap className="w-4 h-4" />
              <span>Priority</span>
            </div>
            <div className="flex items-center h-7 px-2.5 -ml-2.5 hover:bg-white/[0.03] transition-all rounded-lg">
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
                  "px-2 py-0.5 rounded-md text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity",
                  getPriorityBadgeClasses(area.priority || 'medium')
                )}
              >
                {toSentenceCase(area.priority || 'medium')}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center h-8 rounded-xl">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
            </div>
            <div className="flex items-center h-7 px-2.5 -ml-2.5 hover:bg-white/[0.03] transition-all rounded-lg">
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
                  "flex items-center gap-2 px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                  area.status === 'active' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                  "bg-stone-500/20 text-stone-400"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  area.status === 'active' ? "bg-[var(--tokyo-green)]" :
                  "bg-stone-400"
                )} />
                <span>{toSentenceCase(area.status || 'active')}</span>
              </div>
            </div>
          </div>

          {/* Custom Properties */}
          {area.customProperties?.map(prop => {
            const PropIcon = {
              text: Text,
              number: Hash,
              select: Layers,
              date: CalendarIcon
            }[prop.type] || Text;

            return (
              <div key={prop.id} className="flex items-center h-8 rounded-xl group">
                <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
                  <PropIcon className="w-4 h-4" />
                  <span className="text-[13px] text-[var(--tokyo-text-faint)] font-medium">{prop.name}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 hover:bg-white/[0.03] transition-all px-2.5 -ml-2.5 rounded-lg h-7">
                  <input 
                    type={prop.type === 'number' ? 'number' : 'text'}
                    value={prop.value}
                    onChange={(e) => handleUpdateProperty(prop.id, e.target.value)}
                    placeholder="Empty"
                    className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-[13px] font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/10 outline-none focus:outline-none focus:ring-transparent shadow-none"
                  />
                  <button 
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <button 
            onClick={handleAddProperty}
            className="text-[var(--tokyo-yellow)] text-[11px] font-semibold flex items-center gap-1 hover:text-[var(--tokyo-yellow)] transition-colors mt-2"
          >
            <Plus className="w-3 h-3" />
            Add property
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 border-b border-[var(--tokyo-border)]">
          {['Projects', 'Goals', 'Comments', 'Activity'].map(tabId => (
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
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 pt-4 pb-8">
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
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--tokyo-text-strong)] font-semibold text-sm">{comment.name}</span>
                        <span className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors text-[11px] font-medium">•</span>
                        <span className="text-[var(--tokyo-text-faint)] text-[11px] font-medium">{comment.time}</span>
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
            <div className="flex items-center gap-3 text-[13px] text-[var(--tokyo-text-faint)]">
              <Activity className="w-3.5 h-3.5" />
              <span>No recent activity</span>
            </div>
          </div>
        )}
      </div>

      {/* Property Picker Popover */}
      <AnimatePresence>
        {isPropertyPickerOpen && propertyPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsPropertyPickerOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[120] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl p-2 w-64"
              style={{ top: propertyPickerPos.y, left: propertyPickerPos.x }}
            >
              <div className="px-3 py-2 text-xs font-bold text-[var(--tokyo-text-faint)] tracking-wider">Basic properties</div>
              <div className="space-y-0.5">
                {[
                  { id: 'text', label: 'Text', icon: Text, desc: 'Plain text' },
                  { id: 'number', label: 'Number', icon: Hash, desc: 'Numerical values' },
                  { id: 'select', label: 'Select', icon: Layers, desc: 'Choose from options' },
                  { id: 'date', label: 'Deadline', icon: CalendarIcon, desc: 'Calendar date' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => confirmAddProperty(type.id as any)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-muted)] group-hover:text-white">
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--tokyo-text-strong)] group-hover:text-white">{type.label}</div>
                      <div className="text-xs text-[var(--tokyo-text-faint)]">{type.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
