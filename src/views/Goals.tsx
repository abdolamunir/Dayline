import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Goal } from '../types';
import {
  Target01Icon as Target, 
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
  Search01Icon as Search,
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
  Share01Icon as Share,
  StarIcon as Star
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { PropertyContextMenu } from '../components/PropertyContextMenu';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  SettingsGear: SettingsGear,
  Clock: Clock,
  Layers: Layers,
  Circle: Circle,
  CheckCircle: CheckCircle,
  CalendarIcon: CalendarIcon,
};

const toSentenceCase = (str: string) => {
  if (!str) return '';
  const formatted = str.replace(/-/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};

const GOAL_STATUS_OPTIONS = ['planning', 'active', 'completed', 'paused'];
type GoalColumn = { id: string; label: string; icon: string; width: string; hidden?: boolean };
type GoalIconPickerType = 'tab' | 'column' | 'main' | 'goal' | null;
type GoalSortConfig = { columnId: string; direction: 'asc' | 'desc' };
const DEFAULT_GOAL_SORT: GoalSortConfig = { columnId: 'title', direction: 'asc' };

const DEFAULT_GOAL_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];
const DEFAULT_GOAL_COLUMNS: GoalColumn[] = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'areas', label: 'Areas', icon: 'Layers', width: '180px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
  { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
];

const normalizeGoalStatus = (status: string) => {
  if (status === 'in-progress' || status === 'inbox') return 'active';
  return status;
};

const getGoalStatusClasses = (status: string) => {
  const normalizedStatus = normalizeGoalStatus(status);
  return normalizedStatus === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
    normalizedStatus === 'active' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
    normalizedStatus === 'planning' ? "bg-stone-500/20 text-stone-400" :
    "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]";
};

function GoalColumnHeader({
  col,
  index,
  motionStyle,
  isAnyColumnDragging,
  editingColumnId,
  editingColumnName,
  setEditingColumnId,
  setEditingColumnName,
  setColumns,
  setIconPickerId,
  setIconPickerType,
  setIconPickerPos,
  startColumnDrag,
  startColumnResize,
  onColumnContextMenu,
}: {
  col: GoalColumn;
  index: number;
  motionStyle: React.CSSProperties & { x?: number };
  isAnyColumnDragging: boolean;
  editingColumnId: string | null;
  editingColumnName: string;
  setEditingColumnId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingColumnName: React.Dispatch<React.SetStateAction<string>>;
  setColumns: React.Dispatch<React.SetStateAction<GoalColumn[]>>;
  setIconPickerId: React.Dispatch<React.SetStateAction<string | null>>;
  setIconPickerType: React.Dispatch<React.SetStateAction<GoalIconPickerType>>;
  setIconPickerPos: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  startColumnDrag: (event: React.PointerEvent, columnId: string) => void;
  startColumnResize: (event: React.PointerEvent, columnId: string, currentWidth?: string) => void;
  onColumnContextMenu: (event: React.MouseEvent, columnId: string) => void;
}) {
  const startHeaderDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-column-control="true"]')) return;
    startColumnDrag(event, col.id);
  };

  return (
    <motion.th
      layout="position"
      transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
      style={motionStyle}
      onContextMenu={(event) => onColumnContextMenu(event, col.id)}
      className={cn(
        "relative px-4 py-1 border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-visible",
        index === 0 && "pl-[5px]"
      )}
    >
      <div
        onPointerDown={startHeaderDrag}
        className="flex items-center gap-0.5 w-full min-w-0 overflow-hidden pr-2 cursor-grab active:cursor-grabbing"
      >
        {col.id !== 'progress' && (
          <button
            type="button"
            data-column-control="true"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId(col.id);
              setIconPickerType('column');
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className="w-6 h-6 rounded-md transition-colors text-[var(--tokyo-text-muted)]/80 hover:text-[var(--tokyo-text-muted)] flex items-center justify-center cursor-pointer shrink-0"
          >
            {React.createElement(iconMap[col.icon] || Target, { className: "w-4 h-4 align-middle" })}
          </button>
        )}
        {editingColumnId === col.id ? (
          <input
            data-column-control="true"
            autoFocus
            value={editingColumnName}
            onChange={(e) => setEditingColumnName(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              if (editingColumnName.trim()) {
                setColumns(prev => prev.map(c => c.id === col.id ? { ...c, label: editingColumnName } : c));
              }
              setEditingColumnId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editingColumnName.trim()) {
                  setColumns(prev => prev.map(c => c.id === col.id ? { ...c, label: editingColumnName } : c));
                }
                setEditingColumnId(null);
              }
              if (e.key === 'Escape') {
                setEditingColumnId(null);
              }
            }}
            className="bg-[var(--tokyo-hover)] text-[var(--tokyo-text-strong)] px-2 h-7 rounded-md outline-none text-sm font-medium border border-[var(--tokyo-border)] min-w-0 w-full"
          />
        ) : (
          <span
            data-column-control="true"
            className="capitalize cursor-pointer text-[var(--tokyo-text-muted)]/80 hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] px-1 h-7 rounded-md transition-colors text-sm font-medium inline-flex min-w-0 max-w-full items-center whitespace-nowrap overflow-hidden text-ellipsis"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setEditingColumnId(col.id);
              setEditingColumnName(col.label);
            }}
          >
            {col.label.toLowerCase()}
          </span>
        )}
      </div>
      <button
        type="button"
        data-column-control="true"
        aria-label={`Resize ${col.label} column`}
        title="Drag to resize column"
        onPointerDown={(e) => startColumnResize(e, col.id, col.width)}
        style={{ cursor: 'col-resize' }}
        className={cn(
          "absolute right-0 top-1/2 z-20 h-8 w-3 -translate-y-1/2 !cursor-col-resize touch-none before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-5 before:w-px before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-transparent before:transition-all before:duration-150 hover:before:h-6 hover:before:w-[2px] hover:before:bg-[var(--tokyo-yellow)]",
          isAnyColumnDragging && "pointer-events-none opacity-0"
        )}
      />
    </motion.th>
  );
}

function GoalReorderRow({
  goal,
  draggingId,
  onDragStart,
  onDragEnd,
  onContextMenu,
  children,
}: {
  goal: Goal;
  draggingId: string | null;
  onDragStart: () => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <Reorder.Item
      key={goal.id}
      value={goal}
      as="tr"
      layout="position"
      drag
      dragElastic={0.04}
      dragMomentum={false}
      initial={false}
      animate={{
        zIndex: 1,
        scale: 1,
        rotate: 0,
        boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
      }}
      whileDrag={{
        zIndex: 45,
        scale: 0.98,
        rotate: -2,
      }}
      transition={{
        layout: { type: 'spring', stiffness: 520, damping: 34, mass: 0.55 },
        scale: { type: 'spring', stiffness: 720, damping: 34, mass: 0.42 },
        x: { type: 'spring', stiffness: 720, damping: 34, mass: 0.42 },
        rotate: { type: 'spring', stiffness: 680, damping: 34, mass: 0.4 },
      }}
      style={{ transformOrigin: "left center" }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      className={cn(
        "group cursor-grab transition-colors select-none whitespace-nowrap active:cursor-grabbing",
        draggingId === goal.id && [
          "[&>td]:!border-b-transparent [&>td]:!bg-transparent [&>td]:!shadow-none",
          "[&>td:not(:first-child)>*]:opacity-0",
          "[&>td:first-child]:relative [&>td:first-child]:z-20 [&>td:first-child]:rounded-lg [&>td:first-child]:!bg-[linear-gradient(135deg,rgba(216,170,21,0.82),rgba(163,126,10,0.72))]",
          "[&>td:first-child]:!text-[var(--tokyo-text-strong)] [&>td:first-child]:backdrop-blur-[1px] [&>td:first-child]:shadow-[0_18px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]",
          "[&>td:first-child_*]:!text-[var(--tokyo-text-strong)]"
        ]
      )}
    >
      {children}
    </Reorder.Item>
  );
}

export function Goals({ onViewChange, selectedGoalId }: { onViewChange?: (view: string) => void, selectedGoalId?: string }) {
  const { goals, areas, updateGoal, reorderGoals, addGoal, deleteGoal, duplicateGoal, tasks, addTask, updateTask, sidebarItems, updateSidebarItem, deleteSidebarItem, viewSettings, updateViewSettings } = useAppStore();
  const savedGoalSettings = viewSettings.goals || {};
  const [localSelectedGoalId, setLocalSelectedGoalId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [draggingColumnOffset, setDraggingColumnOffset] = useState(0);
  const [columnDropIndicatorX, setColumnDropIndicatorX] = useState<number | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerType, setIconPickerType] = useState<GoalIconPickerType>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [goalContextMenu, setGoalContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState('');
  const [selectedGoalCell, setSelectedGoalCell] = useState<{ goalId: string; columnId: string } | null>(null);
  const [goalFillDrag, setGoalFillDrag] = useState<{ sourceGoalId: string; columnId: string; targetGoalId: string } | null>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const goalTableRef = useRef<HTMLDivElement>(null);
  const titleEditRef = useRef<HTMLHeadingElement>(null);
  const descriptionEditRef = useRef<HTMLParagraphElement>(null);
  const isDraggingRef = useRef(false);
  const isGoalFillDraggingRef = useRef(false);
  const isColumnResizingRef = useRef(false);
  const suppressGoalOpenUntilRef = useRef(0);
  const latestGoalColumnsRef = useRef(DEFAULT_GOAL_COLUMNS);
  const goalFillDragRef = useRef<{ sourceGoalId: string; columnId: string; targetGoalId: string } | null>(null);

  const setActiveGoalFillDrag = (drag: { sourceGoalId: string; columnId: string; targetGoalId: string } | null) => {
    goalFillDragRef.current = drag;
    setGoalFillDrag(drag);
  };

  const isGoalColumnFillable = (columnId: string) => columnId !== 'title' && columnId !== 'progress';
  
  const [tabs, setTabs] = useState(savedGoalSettings.tabs || DEFAULT_GOAL_TABS);

  const [columns, setColumns] = useState<GoalColumn[]>(savedGoalSettings.columns || DEFAULT_GOAL_COLUMNS);
  const goalDetailColumns: GoalColumn[] = [
    { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' },
    { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
    ...goals.flatMap(goal => goal.customProperties || [])
      .reduce<GoalColumn[]>((uniqueColumns, prop) => {
        if (uniqueColumns.some(column => column.id === prop.id)) return uniqueColumns;
        const icon = prop.type === 'date' ? 'CalendarIcon' : prop.type === 'number' ? 'Hash' : prop.type === 'select' ? 'Layers' : 'Text';
        uniqueColumns.push({ id: prop.id, label: prop.name, icon, width: '180px' });
        return uniqueColumns;
      }, []),
  ];
  const allGoalColumns = [
    ...columns,
    ...goalDetailColumns.filter(detailColumn => !columns.some(column => column.id === detailColumn.id)),
  ];
  const displayGoalColumns = allGoalColumns.filter(column => !column.hidden);

  const [activeTab, setActiveTab] = useState<string>(savedGoalSettings.activeTab || 'active');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [columnContextMenu, setColumnContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(savedGoalSettings.title || 'Goals');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(savedGoalSettings.description || 'Track and manage your long-term objectives.');
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'status' | 'priority' | 'area';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const initialSortConfigs: GoalSortConfig[] = Array.isArray(savedGoalSettings.sortConfigs)
    ? savedGoalSettings.sortConfigs
    : savedGoalSettings.sortConfig
      ? [savedGoalSettings.sortConfig]
      : [];
  const [sortConfigs, setSortConfigs] = useState<GoalSortConfig[]>(initialSortConfigs);
  const [sortPopoverPos, setSortPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [sortPickerOpen, setSortPickerOpen] = useState<string | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    id: string;
    pos: { x: number, y: number };
    currentDate?: Date;
    config?: DateConfig;
  } | null>(null);

  const effectiveSelectedGoalId = selectedGoalId || localSelectedGoalId;
  const selectedGoal = effectiveSelectedGoalId ? goals.find(g => g.id === effectiveSelectedGoalId) : null;
  const currentPageTitle = sidebarItems.find(i => i.id === 'goals')?.label || 'Goals';

  useEffect(() => {
    const settings = viewSettings.goals;
    if (!settings) return;
    if (settings.tabs) setTabs(settings.tabs);
    if (settings.columns && !isColumnResizingRef.current) setColumns(settings.columns);
    if (settings.activeTab) setActiveTab(settings.activeTab);
    if (settings.title) setTitleValue(settings.title);
    if (settings.description) setDescriptionValue(settings.description);
    if (Array.isArray(settings.sortConfigs)) {
      setSortConfigs(settings.sortConfigs);
    } else if ('sortConfig' in settings) {
      const legacySortConfigs = settings.sortConfig ? [settings.sortConfig] : [];
      setSortConfigs(legacySortConfigs);
    }
  }, [viewSettings.goals]);

  useEffect(() => {
    latestGoalColumnsRef.current = displayGoalColumns;
  }, [displayGoalColumns]);

  useEffect(() => {
    if (isColumnResizingRef.current) return;
    updateViewSettings('goals', {
      tabs,
      columns,
      activeTab,
      title: titleValue,
      description: descriptionValue,
      sortConfigs,
    });
  }, [tabs, columns, activeTab, titleValue, descriptionValue, sortConfigs]);

  useEffect(() => {
    const element = isEditingTitle ? titleEditRef.current : isEditingDescription ? descriptionEditRef.current : null;
    if (!element) return;
    element.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditingTitle, isEditingDescription]);

  useEffect(() => {
    if (!selectedGoalCell) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-goal-cell-id], .property-popover, [data-goal-cell-fill-handle]')) return;
      setSelectedGoalCell(null);
      setActiveGoalFillDrag(null);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedGoalCell]);

  if (selectedGoal) {
    return (
      <GoalDetailsPage 
        goal={selectedGoal} 
        onBack={() => {
          if (onViewChange) {
            onViewChange('goals');
          } else {
            setLocalSelectedGoalId(null);
          }
        }} 
      />
    );
  }

  const handleAddTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newTabName.trim()) {
      const id = newTabName.toLowerCase().replace(/\s+/g, '-');
      if (!tabs.find(t => t.id === id)) {
        setTabs([...tabs, { id, label: newTabName.trim(), icon: 'Target' }]);
        setActiveTab(id);
      }
      setNewTabName('');
      setIsAddingTab(false);
    } else {
      setIsAddingTab(false);
    }
  };

  const handleDeleteTab = (tabId: string) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      if (activeTab === tabId) {
        setActiveTab(newTabs[0].id);
      }
    }
  };

  const handleRenameTab = (tabId: string) => {
    if (editingTabName.trim()) {
      setTabs(tabs.map(t => t.id === tabId ? { ...t, label: editingTabName.trim() } : t));
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setTabContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const handleColumnContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setColumnContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const handleGoalContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setGoalContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const handleRenameGoal = () => {
    if (editingGoalId && editingGoalTitle.trim()) {
      const goal = goals.find(g => g.id === editingGoalId);
      if (goal) {
        updateGoal({ ...goal, title: editingGoalTitle.trim() });
      }
    }
    setEditingGoalId(null);
  };

  const handleRenamePage = () => {
    const item = sidebarItems.find(i => i.id === 'goals');
    if (item && titleValue.trim()) {
      updateSidebarItem(item.id, titleValue.trim(), item.icon);
    }
    setIsEditingTitle(false);
  };

  const handleUpdateDescription = () => {
    setIsEditingDescription(false);
  };

  const filteredGoals = goals.filter(g => normalizeGoalStatus(g.status) === activeTab);
  const updateSortAt = (sortIndex: number, nextSort: GoalSortConfig) => {
    setSortConfigs(currentSorts => currentSorts.map((sortConfig, index) => (
      index === sortIndex ? nextSort : sortConfig
    )));
  };
  const getGoalSortValue = (goal: Goal, columnId: string) => {
    if (columnId === 'title') return goal.title.toLowerCase();
    if (columnId === 'status') return GOAL_STATUS_OPTIONS.indexOf(normalizeGoalStatus(goal.status));
    if (columnId === 'priority') return ['low', 'medium', 'high'].indexOf(goal.priority);
    if (columnId === 'areas') return (areas.find(area => area.id === goal.areaId)?.name || '').toLowerCase();
    if (columnId === 'date') return goal.targetDate ? new Date(goal.targetDate).getTime() : Number.POSITIVE_INFINITY;
    if (columnId === 'progress') return goal.progress;
    if (columnId === 'assigned') return goal.assignee || '';
    if (columnId === 'creator') return 'Abdola Munir';
    const customProp = goal.customProperties?.find(prop => prop.id === columnId);
    if (customProp?.type === 'date') return customProp.value ? new Date(customProp.value).getTime() : Number.POSITIVE_INFINITY;
    if (customProp?.type === 'number') return Number(customProp.value || 0);
    return String(customProp?.value ?? '').toLowerCase();
  };
  const compareGoalsBySort = (firstGoal: Goal, secondGoal: Goal, sortConfig: GoalSortConfig) => {
    const firstValue = getGoalSortValue(firstGoal, sortConfig.columnId);
    const secondValue = getGoalSortValue(secondGoal, sortConfig.columnId);

    let result = 0;

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      result = firstValue - secondValue;
    } else {
      result = String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: 'base' });
    }

    return sortConfig.direction === 'asc' ? result : -result;
  };
  const visibleGoals = sortConfigs.length > 0
    ? [...filteredGoals].sort((firstGoal, secondGoal) => {
        for (const sortConfig of sortConfigs) {
          const result = compareGoalsBySort(firstGoal, secondGoal, sortConfig);
          if (result !== 0) return result;
        }

        return 0;
      })
    : filteredGoals;

  const getColumnWidthNumber = (width?: string) => {
    const parsed = Number.parseFloat(width || '');
    return Number.isFinite(parsed) ? parsed : 160;
  };

  const persistGoalVisibleColumns = (nextVisibleColumns: GoalColumn[]) => [
    ...nextVisibleColumns,
    ...allGoalColumns.filter(column => column.hidden && !nextVisibleColumns.some(nextColumn => nextColumn.id === column.id)),
  ];

  const hideGoalColumn = (columnId: string) => {
    if (columnId === 'title') return;
    const nextColumns = allGoalColumns.map(column => column.id === columnId ? { ...column, hidden: true } : column);
    setColumns(nextColumns);
    updateViewSettings('goals', { columns: nextColumns });
    setColumnContextMenu(null);
  };

  const showGoalColumn = (columnId: string) => {
    const nextColumns = allGoalColumns.map(column => column.id === columnId ? { ...column, hidden: false } : column);
    setColumns(nextColumns);
    updateViewSettings('goals', { columns: nextColumns });
    setColumnContextMenu(null);
  };

  const startColumnResize = (event: React.PointerEvent, columnId: string, currentWidth?: string) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = getColumnWidthNumber(currentWidth);
    const initialColumns = latestGoalColumnsRef.current;
    isColumnResizingRef.current = true;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      const nextWidth = Math.max(96, Math.min(520, Math.round(startWidth + pointerEvent.clientX - startX)));
      const nextColumns = initialColumns.map(column => (
        column.id === columnId ? { ...column, width: `${nextWidth}px` } : column
      ));
      latestGoalColumnsRef.current = nextColumns;
      setColumns(persistGoalVisibleColumns(nextColumns));
    };

    const cleanup = () => {
      isColumnResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanup);
      updateViewSettings('goals', { columns: persistGoalVisibleColumns(latestGoalColumnsRef.current) });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', cleanup);
  };

  const startColumnDrag = (event: React.PointerEvent, columnId: string) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const startColumns = latestGoalColumnsRef.current;
    const draggedColumn = startColumns.find(column => column.id === columnId);
    const startIndex = startColumns.findIndex(column => column.id === columnId);
    if (!draggedColumn || startIndex < 0) return;

    const startX = event.clientX;
    const startLeft = startColumns
      .slice(0, startIndex)
      .reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
    const draggedColumnWidth = getColumnWidthNumber(draggedColumn.width);
    const tableRect = goalTableRef.current?.getBoundingClientRect();
    if (!tableRect) return;
    let latestOffset = 0;
    let latestTargetIndex = startIndex;
    let latestIndicatorX = startLeft;
    let animationFrameId: number | null = null;
    let lastRenderedIndicatorX: number | null = null;

    const getDropTarget = (offset: number) => {
      const projectedCenter = startLeft + offset + draggedColumnWidth / 2;
      const remainingColumns = startColumns.filter(column => column.id !== columnId);
      let targetIndex = remainingColumns.length;
      let runningLeft = 0;

      for (let index = 0; index < remainingColumns.length; index += 1) {
        const column = remainingColumns[index];
        const originalIndex = startColumns.findIndex(startColumn => startColumn.id === column.id);
        const visibleCenterOffset = originalIndex > startIndex ? draggedColumnWidth : 0;
        const columnCenter = runningLeft + getColumnWidthNumber(column.width) / 2 + visibleCenterOffset;
        if (projectedCenter < columnCenter) {
          targetIndex = index;
          break;
        }
        runningLeft += getColumnWidthNumber(column.width);
      }

      const indicatorX = remainingColumns
        .slice(0, targetIndex)
        .reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
      const visualIndicatorX = targetIndex > startIndex || (targetIndex === startIndex && offset > 0)
        ? indicatorX + draggedColumnWidth
        : indicatorX;

      return {
        targetIndex,
        indicatorX: visualIndicatorX,
      };
    };

    const updateDragLine = (offset: number) => {
      const target = getDropTarget(offset);
      latestTargetIndex = target.targetIndex;
      latestIndicatorX = Math.round(target.indicatorX);
      if (lastRenderedIndicatorX !== latestIndicatorX) {
        lastRenderedIndicatorX = latestIndicatorX;
        setColumnDropIndicatorX(latestIndicatorX);
      }
    };

    const renderDragUpdate = () => {
      animationFrameId = null;
      const roundedOffset = Math.round(latestOffset);
      setDraggingColumnOffset(roundedOffset);

      if (roundedOffset !== 0) {
        updateDragLine(roundedOffset);
      } else if (lastRenderedIndicatorX !== null) {
        lastRenderedIndicatorX = latestIndicatorX;
        setColumnDropIndicatorX(latestIndicatorX);
      }
    };

    const scheduleDragUpdate = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(renderDragUpdate);
    };

    setDraggingColumnId(columnId);
    setDraggingColumnOffset(0);
    lastRenderedIndicatorX = latestIndicatorX;
    setColumnDropIndicatorX(latestIndicatorX);

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      latestOffset = pointerEvent.clientX - startX;
      scheduleDragUpdate();
    };

    const cleanup = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      const remainingColumns = startColumns.filter(column => column.id !== columnId);
      const finalTarget = getDropTarget(Math.round(latestOffset));
      const targetIndex = finalTarget.targetIndex;
      latestIndicatorX = Math.round(finalTarget.indicatorX);

      const nextColumns = [...remainingColumns];
      nextColumns.splice(targetIndex, 0, draggedColumn);
      const nextLeft = nextColumns
        .slice(0, targetIndex)
        .reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
      setColumnDropIndicatorX(latestIndicatorX);
      setDraggingColumnOffset(Math.round(startLeft + latestOffset - nextLeft));
      latestGoalColumnsRef.current = nextColumns;
      setColumns(persistGoalVisibleColumns(nextColumns));

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanup);

      window.setTimeout(() => {
        setColumnDropIndicatorX(null);
      }, 120);

      window.requestAnimationFrame(() => {
        setDraggingColumnId(null);
        setDraggingColumnOffset(0);
      });
    };

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', cleanup);
  };

  const getGoalCellValue = (goal: Goal, columnId: string) => {
    if (columnId === 'title') return goal.title;
    if (columnId === 'status') return goal.status;
    if (columnId === 'priority') return goal.priority;
    if (columnId === 'areas') return goal.areaId;
    if (columnId === 'date') return goal.targetDate;
    if (columnId === 'progress') return goal.progress;
    if (columnId === 'assigned') return goal.assignee;
    if (columnId === 'creator') return 'Abdola Munir';
    const customProp = goal.customProperties?.find(prop => prop.id === columnId);
    if (customProp) return customProp.value;
    return undefined;
  };

  const withGoalCellValue = (goal: Goal, columnId: string, value: any): Goal => {
    if (columnId === 'title') return { ...goal, title: String(value ?? '') };
    if (columnId === 'status') return { ...goal, status: String(value ?? '') };
    if (columnId === 'priority') return { ...goal, priority: value as Goal['priority'] };
    if (columnId === 'areas') return { ...goal, areaId: value || undefined };
    if (columnId === 'date') return { ...goal, targetDate: value };
    if (columnId === 'progress') return { ...goal, progress: Number(value ?? 0) };
    if (columnId === 'assigned') return { ...goal, assignee: String(value ?? '') };
    if (columnId === 'creator') return goal;
    if (goal.customProperties?.some(prop => prop.id === columnId)) {
      return {
        ...goal,
        customProperties: goal.customProperties.map(prop => (
          prop.id === columnId ? { ...prop, value } : prop
        )),
      };
    }
    return goal;
  };

  const getGoalFillRangeIds = (drag = goalFillDrag) => {
    if (!drag) return [];

    const sourceIndex = visibleGoals.findIndex(goal => goal.id === drag.sourceGoalId);
    const targetIndex = visibleGoals.findIndex(goal => goal.id === drag.targetGoalId);
    if (sourceIndex < 0 || targetIndex < 0) return [];

    const [start, end] = [sourceIndex, targetIndex].sort((a, b) => a - b);
    return visibleGoals.slice(start, end + 1).map(goal => goal.id);
  };

  const finishGoalFillDrag = (drag = goalFillDragRef.current) => {
    if (!drag) return;

    const rangeIds = getGoalFillRangeIds(drag);
    const sourceGoal = goals.find(goal => goal.id === drag.sourceGoalId);
    if (sourceGoal && rangeIds.length > 1) {
      const value = getGoalCellValue(sourceGoal, drag.columnId);
      reorderGoals(goals.map(goal => (
        rangeIds.includes(goal.id) ? withGoalCellValue(goal, drag.columnId, value) : goal
      )));
    }

    setActiveGoalFillDrag(null);
    window.setTimeout(() => {
      isGoalFillDraggingRef.current = false;
      isDraggingRef.current = false;
    }, 0);
  };

  const startGoalFillDrag = (event: React.PointerEvent, sourceGoalId: string, columnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isGoalColumnFillable(columnId)) return;

    const sourceDrag = { sourceGoalId, columnId, targetGoalId: sourceGoalId };
    isGoalFillDraggingRef.current = true;
    isDraggingRef.current = true;
    setCustomDropdown(null);
    setDatePickerConfig(null);
    setSelectedGoalCell({ goalId: sourceGoalId, columnId });
    setActiveGoalFillDrag(sourceDrag);

    const updateTargetFromPoint = (_clientX: number, clientY: number) => {
      const columnCells = Array.from(
        document.querySelectorAll<HTMLElement>('[data-goal-cell-id][data-goal-cell-column-id]')
      ).filter(cell => cell.dataset.goalCellColumnId === columnId);

      if (columnCells.length === 0) return;

      const targetCell = columnCells.reduce((closestCell, cell) => {
        const closestRect = closestCell.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const closestDistance = Math.abs(clientY - (closestRect.top + closestRect.height / 2));
        const cellDistance = Math.abs(clientY - (cellRect.top + cellRect.height / 2));
        return cellDistance < closestDistance ? cell : closestCell;
      }, columnCells[0]);

      const targetGoalId = targetCell.dataset.goalCellId;
      if (!targetGoalId) return;

      setActiveGoalFillDrag({
        sourceGoalId,
        columnId,
        targetGoalId,
      });
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      updateTargetFromPoint(pointerEvent.clientX, pointerEvent.clientY);
    };

    const handlePointerUp = (pointerEvent: PointerEvent) => {
      updateTargetFromPoint(pointerEvent.clientX, pointerEvent.clientY);
      cleanup();
      finishGoalFillDrag();
    };

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Escape') return;
      cleanup();
      setActiveGoalFillDrag(null);
      isGoalFillDraggingRef.current = false;
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
  };

  const goalFillRangeIds = getGoalFillRangeIds();
  const goalFillRangeIdSet = new Set(goalFillRangeIds);
  const goalTableWidth = displayGoalColumns.reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
  const getColumnMotionStyle = (column: GoalColumn) => ({
    width: column.width,
    x: draggingColumnId === column.id ? Math.round(draggingColumnOffset) : 0,
    zIndex: draggingColumnId === column.id ? 35 : 1,
  });
  const isTabDragActive = tabs.some(tab => tab.id === draggingId);

  const handleNewGoal = () => {
    const id = `g${Date.now()}`;
    addGoal({
      id,
      title: 'Untitled Goal',
      description: '',
      progress: 0,
      targetDate: format(new Date(), 'yyyy-MM-dd'),
      areaId: areas[0]?.id,
      projectIds: [],
      taskIds: [],
      status: activeTab,
      priority: 'medium',
      assignee: ''
    });
    if (onViewChange) {
      onViewChange(`goal-details:${id}`);
    } else {
      setLocalSelectedGoalId(id);
    }
  };

  const handleCopyGoalsLink = async () => {
    const href = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#goals` : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  return (
    <div 
      className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId('goals');
              setIconPickerType('main');
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className="w-14 h-14 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-[var(--tokyo-hover)] transition-colors"
          >
            {React.createElement(iconMap[sidebarItems.find(i => i.id === 'goals')?.icon || 'Target'] || Target, { className: "w-7 h-7" })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1
                ref={titleEditRef}
                contentEditable={isEditingTitle}
                suppressContentEditableWarning
                className="min-w-0 text-2xl md:text-[28px] font-semibold text-[var(--tokyo-text-strong)] tracking-tight leading-tight cursor-text outline-none"
                onClick={() => {
                  if (!isEditingTitle) {
                    setTitleValue(currentPageTitle);
                    setIsEditingTitle(true);
                  }
                }}
                onInput={(e) => setTitleValue(e.currentTarget.textContent || '')}
                onBlur={() => {
                  if (isEditingTitle) handleRenamePage();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRenamePage();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setTitleValue(currentPageTitle);
                    setIsEditingTitle(false);
                  }
                }}
              >
                {isEditingTitle ? titleValue : currentPageTitle}
              </h1>
              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-hover)] px-2 text-[13px] font-semibold text-[var(--tokyo-text-faint)]">
                {goals.length}
              </span>
            </div>
            <p 
              ref={descriptionEditRef}
              contentEditable={isEditingDescription}
              suppressContentEditableWarning
              className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-[15px] leading-normal cursor-text outline-none"
              onClick={() => {
                if (!isEditingDescription) setIsEditingDescription(true);
              }}
              onInput={(e) => setDescriptionValue(e.currentTarget.textContent || '')}
              onBlur={() => {
                if (isEditingDescription) handleUpdateDescription();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleUpdateDescription();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setIsEditingDescription(false);
                }
              }}
            >
              {descriptionValue}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
          <button
            onClick={() => void handleCopyGoalsLink()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
            title="Copy page link"
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
        </div>
      </header>

      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        {/* Tabs & Toolbar */}
        <div
          className={cn(
            "relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--tokyo-border)] pb-2",
            draggingId && "z-[90]"
          )}
        >
        {/* Mobile/Tablet Dropdown */}
        <div className="sm:hidden relative">
          <button 
            onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
            className="flex items-center justify-between w-full px-4 py-2 bg-stone-500/10 border border-stone-500/20 rounded-lg text-stone-100 font-medium"
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
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-lg shadow-2xl z-50 overflow-hidden"
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
                        activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
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
          className="hidden sm:flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {tabs.map(tab => {
            const Icon = iconMap[tab.icon] || Target;
            return (
              <Reorder.Item 
                as="div"
                key={tab.id}
                value={tab}
                data-tab-id={tab.id}
                layout="position"
                drag="x"
                dragElastic={0.04}
                dragMomentum={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragStart={() => {
                  setDraggingId(tab.id);
                  isDraggingRef.current = true;
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setTimeout(() => {
                    isDraggingRef.current = false;
                  }, 100);
                }}
                onContextMenu={(e) => handleTabContextMenu(e, tab.id)}
                onClickCapture={(e) => {
                  if (isDraggingRef.current) {
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                  }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "shrink-0 whitespace-nowrap group relative outline-none focus:outline-none focus-visible:outline-none",
                  draggingId === tab.id ? "cursor-grabbing" : "cursor-pointer"
                )}
                transition={{ layout: { duration: 0.08, ease: "easeOut" } }}
              >
                <div
                  className={cn(
                    "flex items-center gap-1.5 pl-[5px] pr-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id && !isTabDragActive ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]",
                  )}
                >
                <button
                  data-tab-control="true"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setIconPickerId(tab.id);
                    setIconPickerType('tab');
                    setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[var(--tokyo-hover)] cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                </button>
                {editingTabId === tab.id ? (
                  <input 
                    autoFocus
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={() => handleRenameTab(tab.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameTab(tab.id)}
                    className="bg-transparent border-none outline-none w-20 text-white"
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingTabId(tab.id);
                      setEditingTabName(tab.label);
                    }}
                  >
                    {tab.label}
                  </span>
                )}
                </div>
              </Reorder.Item>
            );
          })}
          
          {isAddingTab ? (
            <form onSubmit={handleAddTab} className="flex items-center">
              <input
                autoFocus
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onBlur={() => handleAddTab()}
                placeholder="Tab name..."
                className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-lg px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-blue-500/50 w-32"
              />
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingTab(true)}
              className="w-8 h-8 flex items-center justify-center text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] transition-colors rounded-lg hover:bg-[var(--tokyo-hover)] cursor-pointer shrink-0"
              title="Add new tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </Reorder.Group>

        <div className="flex shrink-0 items-center justify-end gap-1 text-[var(--tokyo-text-faint)]">
          <button className="p-2 hover:text-white transition-colors"><Search className="w-4 h-4" /></button>
          <button className="p-2 hover:text-white transition-colors"><FilterIcon className="w-4 h-4" /></button>
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setSortPopoverPos(sortPopoverPos ? null : { x: rect.right, y: rect.bottom + 8 });
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              sortConfigs.length > 0 ? "bg-[var(--tokyo-hover)] text-[var(--tokyo-yellow)]" : "hover:text-white"
            )}
            title="Sort"
          >
            <Sort className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNewGoal}
            className="ml-2 bg-[var(--tokyo-yellow-dim)] text-white px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 [stroke-width:2.4]" />
            New Goal
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-visible">
        <div className={cn("-ml-6 h-full w-[calc(100%+1.5rem)] pl-6", draggingId || draggingColumnId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <div className="relative min-h-full overflow-visible" style={{ width: `${goalTableWidth}px` }}>
          <div ref={goalTableRef} className="relative min-h-full overflow-visible" style={{ width: `${goalTableWidth}px` }}>
          <table className="text-left border-separate border-spacing-0 table-fixed" style={{ width: `${goalTableWidth}px` }}>
            <colgroup>
              {displayGoalColumns.map(column => (
                <col key={column.id} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
                {displayGoalColumns.map((col, index) => (
                  <GoalColumnHeader
                    key={col.id}
                    col={col}
                    index={index}
                    motionStyle={getColumnMotionStyle(col)}
                    isAnyColumnDragging={!!draggingColumnId}
                    editingColumnId={editingColumnId}
                    editingColumnName={editingColumnName}
                    setEditingColumnId={setEditingColumnId}
                    setEditingColumnName={setEditingColumnName}
                    setColumns={setColumns}
                    setIconPickerId={setIconPickerId}
                    setIconPickerType={setIconPickerType}
                    setIconPickerPos={setIconPickerPos}
                    startColumnDrag={startColumnDrag}
                    startColumnResize={startColumnResize}
                    onColumnContextMenu={handleColumnContextMenu}
                  />
                ))}
              </tr>
            </thead>
            <Reorder.Group
              as="tbody"
              axis="y"
              values={visibleGoals}
              onReorder={(newGoals) => {
                const otherGoals = goals.filter(goal => normalizeGoalStatus(goal.status) !== activeTab);
                reorderGoals([...otherGoals, ...newGoals]);
              }}
              className="relative"
            >
              {visibleGoals.map(goal => {
                const area = areas.find(a => a.id === goal.areaId);
                const isGoalCellSelected = (columnId: string) => selectedGoalCell?.goalId === goal.id && selectedGoalCell.columnId === columnId;
                const isGoalFillColumn = (columnId: string) => goalFillDrag?.columnId === columnId;
                const isInGoalFillRange = (columnId: string) => isGoalFillColumn(columnId) && goalFillRangeIdSet.has(goal.id);
                const goalCellTransition = {
                  layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const },
                  backgroundColor: { duration: 0.12 },
                  boxShadow: { duration: 0.12 },
                };
                const goalCellClasses = (columnId: string, className: string) => cn(
                  className,
                  "relative cursor-pointer transition-[background-color,box-shadow] duration-100 overflow-visible group-hover:bg-white/[0.02]",
                  isGoalCellSelected(columnId) && "bg-[#1E90FF]/5 shadow-[inset_0_0_0_2px_#1E90FF]",
                  isInGoalFillRange(columnId) && !isGoalCellSelected(columnId) && "bg-[#1E90FF]/10 shadow-[inset_0_0_0_1px_rgba(30,144,255,0.48)]",
                  isGoalFillColumn(columnId) && goalFillDrag && "cursor-ns-resize"
                );
                const goalFillHandle = (columnId: string) => isGoalCellSelected(columnId) && isGoalColumnFillable(columnId) ? (
                  <button
                    type="button"
                    draggable={false}
                    data-goal-cell-fill-handle="true"
                    title="Drag to fill this value down the column"
                    aria-label="Drag to fill this value down the column"
                    onPointerDownCapture={(e) => startGoalFillDrag(e, goal.id, columnId)}
                    onDragStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className={cn(
                      "absolute -bottom-2 -right-2 z-30 h-4 w-4 touch-none rounded-full border-[3px] border-[var(--tokyo-panel)] bg-[#1E90FF] shadow-[0_4px_12px_rgba(30,144,255,0.38)] transition-transform hover:scale-110 active:scale-95",
                      goalFillDrag ? "cursor-ns-resize" : "cursor-crosshair"
                    )}
                  />
                ) : null;
                const selectGoalCell = (columnId: string) => setSelectedGoalCell({ goalId: goal.id, columnId });
                const clearGoalCellSelection = () => {
                  setSelectedGoalCell(null);
                  setActiveGoalFillDrag(null);
                };
                const openGoalDetails = () => {
                  clearGoalCellSelection();
                  if (isDraggingRef.current || Date.now() < suppressGoalOpenUntilRef.current) return;
                  if (isGoalFillDraggingRef.current) return;
                  if (onViewChange) {
                    onViewChange(`goal-details:${goal.id}`);
                  } else {
                    setLocalSelectedGoalId(goal.id);
                  }
                };
                const renderGoalCell = (column: typeof displayGoalColumns[number]) => {
                  if (column.id === 'title') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoalDetails();
                        }}
                        className={goalCellClasses('title', "h-12 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              clearGoalCellSelection();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setIconPickerId(goal.id);
                              setIconPickerType('goal');
                              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--tokyo-text-faint)] shrink-0 cursor-pointer transition-colors"
                          >
                            {React.createElement(iconMap[goal.icon || 'Target'] || Target, { className: "w-4 h-4" })}
                          </div>
                          {editingGoalId === goal.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingGoalTitle}
                              onChange={(e) => setEditingGoalTitle(e.target.value)}
                              onBlur={handleRenameGoal}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameGoal();
                                if (e.key === 'Escape') setEditingGoalId(null);
                              }}
                              className="bg-transparent border-none outline-none text-sm leading-5 font-medium text-[var(--tokyo-text-strong)]/70 w-full"
                            />
                          ) : (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                clearGoalCellSelection();
                                setEditingGoalId(goal.id);
                                setEditingGoalTitle(goal.title);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingGoalId(goal.id);
                                setEditingGoalTitle(goal.title);
                              }}
                              className="text-[var(--tokyo-text-strong)]/70 font-medium text-sm leading-5 cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
                            >
                              {goal.title}
                            </span>
                          )}
                        </div>
                      </motion.td>
                    );
                  }

                  if (column.id === 'status') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGoalCell('status');
                        }}
                        className={goalCellClasses('status', "px-4 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div className="relative flex items-center">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              clearGoalCellSelection();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCustomDropdown({
                                id: goal.id,
                                type: 'status',
                                pos: { x: rect.left, y: rect.bottom + 8 },
                                currentValue: goal.status
                              });
                            }}
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              getGoalStatusClasses(goal.status)
                            )}
                          >
                            <span>{toSentenceCase(normalizeGoalStatus(goal.status))}</span>
                          </span>
                        </div>
                        {goalFillHandle('status')}
                      </motion.td>
                    );
                  }

                  if (column.id === 'priority') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGoalCell('priority');
                        }}
                        className={goalCellClasses('priority', "px-4 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div className="relative flex items-center">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              clearGoalCellSelection();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCustomDropdown({
                                id: goal.id,
                                type: 'priority',
                                pos: { x: rect.left, y: rect.bottom + 8 },
                                currentValue: goal.priority
                              });
                            }}
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              getPriorityBadgeClasses(goal.priority)
                            )}
                          >
                            {toSentenceCase(goal.priority)}
                          </span>
                        </div>
                        {goalFillHandle('priority')}
                      </motion.td>
                    );
                  }

                  if (column.id === 'areas') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGoalCell('areas');
                        }}
                        className={goalCellClasses('areas', "px-4 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div className="relative flex items-center">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              clearGoalCellSelection();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCustomDropdown({
                                id: goal.id,
                                type: 'area',
                                pos: { x: rect.left, y: rect.bottom + 8 },
                                currentValue: goal.areaId || ''
                              });
                            }}
                            className={cn(
                              "inline-flex max-w-full items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              "bg-[var(--tokyo-hover)] text-[var(--tokyo-text-muted)]"
                            )}
                          >
                            <span className="max-w-[140px] overflow-hidden text-ellipsis">{area?.name ? area.name.split('&')[0].trim() : 'No Area'}</span>
                          </span>
                        </div>
                        {goalFillHandle('areas')}
                      </motion.td>
                    );
                  }

                  if (column.id === 'date') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGoalCell('date');
                        }}
                        className={goalCellClasses('date', "pl-4 pr-1 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            clearGoalCellSelection();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDatePickerConfig({
                              id: goal.id,
                              pos: { x: rect.left, y: rect.bottom + 8 },
                              currentDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
                              config: {
                                time: goal.targetTime || '12:00',
                                reminder: goal.reminder || 'none',
                                alert: goal.alert || 'none',
                                repeat: goal.repeat || 'none'
                              }
                            });
                          }}
                          className="relative inline-flex w-fit items-center gap-0.5 text-[var(--tokyo-text-faint)] text-[13px] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors"
                        >
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <span>{goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No date'}</span>
                        </div>
                        {goalFillHandle('date')}
                      </motion.td>
                    );
                  }

                  if (column.id === 'progress') {
                    return (
                      <motion.td
                        key={column.id}
                        layout="position"
                        transition={goalCellTransition}
                        data-goal-cell-id={goal.id}
                        data-goal-cell-column-id={column.id}
                        style={getColumnMotionStyle(column)}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGoalCell('progress');
                        }}
                        className={goalCellClasses('progress', "px-4 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            clearGoalCellSelection();
                          }}
                          className="flex w-full cursor-pointer items-center gap-2"
                        >
                          <span className="inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-md bg-[rgba(154,214,139,0.08)] px-1.5 text-xs font-medium text-[var(--tokyo-green)]">
                            {goal.progress}%
                          </span>
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(154,214,139,0.14)]">
                            <div
                              className="h-full rounded-full bg-[var(--tokyo-green)] transition-[width] duration-200 ease-out"
                              style={{ width: `${Math.max(0, Math.min(100, goal.progress))}%` }}
                            />
                          </div>
                        </div>
                        {goalFillHandle('progress')}
                      </motion.td>
                    );
                  }

                  const customProp = goal.customProperties?.find(prop => prop.id === column.id);
                  const customValue = customProp?.value;
                  const formattedValue = customProp?.type === 'date' && customValue
                    ? format(new Date(customValue), 'MMM d, yyyy')
                    : customValue;
                  const displayValue = column.id === 'assigned'
                    ? (goal.assignee || 'Unassigned')
                    : column.id === 'creator'
                      ? 'Abdola Munir'
                      : (formattedValue || 'Empty');

                  return (
                    <motion.td
                      key={column.id}
                      layout="position"
                      transition={goalCellTransition}
                      data-goal-cell-id={goal.id}
                      data-goal-cell-column-id={column.id}
                      style={getColumnMotionStyle(column)}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectGoalCell(column.id);
                      }}
                      className={goalCellClasses(column.id, "px-4 h-12 border-b border-[var(--tokyo-border)] whitespace-nowrap")}
                    >
                      <span className="text-[var(--tokyo-text-faint)] text-sm">
                        {String(displayValue)}
                      </span>
                      {goalFillHandle(column.id)}
                    </motion.td>
                  );
                };
                return (
                  <GoalReorderRow
                    key={goal.id}
                    goal={goal}
                    draggingId={draggingId}
                    onDragStart={() => {
                      setDraggingId(goal.id);
                      isDraggingRef.current = true;
                      document.body.style.cursor = 'grabbing';
                      setSelectedGoalCell(null);
                      setActiveGoalFillDrag(null);
                    }}
                    onDragEnd={(event, info) => {
                      setDraggingId(null);
                      setHoveredTabId(null);
                      suppressGoalOpenUntilRef.current = Date.now() + 300;
                      document.body.style.cursor = '';
                      window.setTimeout(() => {
                        isDraggingRef.current = false;
                      }, 100);

                      if (!tabContainerRef.current) return;

                      const tabsElements = tabContainerRef.current.querySelectorAll('[data-tab-id]');
                      let droppedOnTabId: string | null = null;

                      tabsElements.forEach((tabEl) => {
                        const rect = tabEl.getBoundingClientRect();
                        if (
                          info.point.x >= rect.left &&
                          info.point.x <= rect.right &&
                          info.point.y >= rect.top &&
                          info.point.y <= rect.bottom
                        ) {
                          droppedOnTabId = tabEl.getAttribute('data-tab-id');
                        }
                      });

                      if (droppedOnTabId && droppedOnTabId !== goal.status) {
                        updateGoal({ ...goal, status: droppedOnTabId });
                      }
                    }}
                    onContextMenu={(e) => handleGoalContextMenu(e, goal.id)}
                  >
                    {displayGoalColumns.map(column => renderGoalCell(column))}
                  </GoalReorderRow>
                );
              })}
              {/* New page row */}
              <tr className="group">
                {displayGoalColumns.map(column => (
                  column.id === 'title' ? (
                    <motion.td
                      key={column.id}
                      layout="position"
                      transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
                      style={getColumnMotionStyle(column)}
                      className="h-12 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={handleNewGoal}
                    >
                      <div className="flex items-center gap-1 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)]">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[13px]">New page</span>
                      </div>
                    </motion.td>
                  ) : (
                    <motion.td
                      key={column.id}
                      layout="position"
                      transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
                      style={getColumnMotionStyle(column)}
                      className="h-12 border-b border-[var(--tokyo-border)]"
                    />
                  )
                ))}
              </tr>
            </Reorder.Group>
          </table>
          <AnimatePresence>
            {draggingColumnId && columnDropIndicatorX !== null && (
              <div
                className="pointer-events-none absolute bottom-2 top-2 z-50 w-[2px] -translate-x-px origin-center rounded-full bg-[var(--tokyo-yellow)] shadow-[0_0_14px_rgba(224,175,104,0.42)]"
                style={{ transform: `translateX(${columnDropIndicatorX}px)` }}
              />
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>
      </div>

      {/* Sort Popover */}
      <AnimatePresence>
        {columnContextMenu && (
          <>
            <div
              className="fixed inset-0 z-[130]"
              onClick={() => setColumnContextMenu(null)}
              onContextMenu={(event) => {
                event.preventDefault();
                setColumnContextMenu(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              className="fixed z-[140] w-52 rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] p-1.5 text-[13px] shadow-2xl"
              style={{
                top: Math.min(columnContextMenu.y, window.innerHeight - 90),
                left: Math.min(columnContextMenu.x, window.innerWidth - 190),
              }}
            >
              <button
                type="button"
                disabled={columnContextMenu.id === 'title'}
                onClick={() => hideGoalColumn(columnContextMenu.id)}
                className="flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-left font-medium text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Hide column
              </button>
              {allGoalColumns.some(column => column.hidden) && (
                <div className="mt-1 border-t border-[var(--tokyo-border)] pt-1">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-[var(--tokyo-text-faint)]">Hidden columns</div>
                  {allGoalColumns.filter(column => column.hidden).map(column => (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => showGoalColumn(column.id)}
                      className="flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-left font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
                    >
                      Show {column.label}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {sortPopoverPos && (
          <>
            <div
              className="fixed inset-0 z-[130]"
              onClick={() => {
                setSortPickerOpen(null);
                setSortPopoverPos(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="fixed z-[140] w-[360px] overflow-visible rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] p-2 text-[13px] shadow-2xl"
              style={{
                top: Math.min(sortPopoverPos.y, window.innerHeight - 220),
                left: Math.max(12, Math.min(sortPopoverPos.x - 360, window.innerWidth - 372)),
              }}
              onPointerDownCapture={(event) => {
                if (!sortPickerOpen) return;
                const target = event.target as HTMLElement;
                if (target.closest('[data-sort-picker="true"]')) return;
                setSortPickerOpen(null);
              }}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--tokyo-text-muted)]">
                  <Sort className="h-4 w-4" />
                  <span>Sort</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSortConfigs([]);
                    setSortPopoverPos(null);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                  title="Clear sort"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="border-t border-[var(--tokyo-border)] pt-2">
                <div className="px-1 pb-1 font-medium text-[var(--tokyo-text-faint)]">Current sort</div>
                <div className="space-y-1">
                  {sortConfigs.length > 0 ? (
                    sortConfigs.map((sortConfig, index) => {
                      const sortColumn = displayGoalColumns.find(column => column.id === sortConfig.columnId) || displayGoalColumns[0];

                      return (
                        <div key={`${sortConfig.columnId}-${index}`} className="flex items-center gap-2 rounded-md bg-black/10 px-2 py-1.5 text-[var(--tokyo-text-muted)]">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--tokyo-border-strong)] text-[var(--tokyo-text-faint)]">
                            {index + 1}
                          </span>
                          <div className="relative min-w-0 flex-1">
                            <button
                              data-sort-picker="true"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortPickerOpen(sortPickerOpen === `current-column-${index}` ? null : `current-column-${index}`);
                              }}
                              className="flex h-7 w-full items-center justify-between gap-2 rounded-md px-1.5 text-left font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                            >
                              <span className="min-w-0 truncate">{sortColumn?.label || sortConfig.columnId}</span>
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--tokyo-text-faint)]" />
                            </button>
                            {sortPickerOpen === `current-column-${index}` && (
                              <div data-sort-picker="true" className="absolute left-0 right-0 top-full z-[150] mt-1 max-h-48 overflow-auto rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel)] p-1 shadow-2xl">
                                {displayGoalColumns.map(column => (
                                  <button
                                    key={column.id}
                                    type="button"
                                    onClick={() => {
                                      updateSortAt(index, { ...sortConfig, columnId: column.id });
                                      setSortPickerOpen(null);
                                    }}
                                    className={cn(
                                      "flex w-full items-center rounded-md px-2 py-1.5 text-left font-medium transition-colors",
                                      sortConfig.columnId === column.id
                                        ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]"
                                        : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                                    )}
                                  >
                                    {column.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="relative w-28 shrink-0">
                            <button
                              data-sort-picker="true"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSortPickerOpen(sortPickerOpen === `current-direction-${index}` ? null : `current-direction-${index}`);
                              }}
                              className="flex h-7 w-full items-center justify-between gap-2 rounded-md px-1.5 text-left font-medium text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                            >
                              <span>{sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}</span>
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--tokyo-text-faint)]" />
                            </button>
                            {sortPickerOpen === `current-direction-${index}` && (
                              <div data-sort-picker="true" className="absolute left-0 right-0 top-full z-[150] mt-1 rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel)] p-1 shadow-2xl">
                                {(['asc', 'desc'] as const).map(direction => (
                                  <button
                                    key={direction}
                                    type="button"
                                    onClick={() => {
                                      updateSortAt(index, { ...sortConfig, direction });
                                      setSortPickerOpen(null);
                                    }}
                                    className={cn(
                                      "flex w-full items-center rounded-md px-2 py-1.5 text-left font-medium transition-colors",
                                      sortConfig.direction === direction
                                        ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]"
                                        : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                                    )}
                                  >
                                    {direction === 'asc' ? 'Ascending' : 'Descending'}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSortConfigs(currentSorts => currentSorts.filter((_, sortIndex) => sortIndex !== index))}
                            className="flex h-6 w-6 items-center justify-center rounded text-[var(--tokyo-text-faint)] transition-colors hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)]"
                            title="Remove sort"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-md px-2 py-1.5 text-[var(--tokyo-text-faint)]">No sort applied</div>
                  )}
                </div>
              </div>
              <div className="mt-2 space-y-0.5 border-t border-[var(--tokyo-border)] pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSortConfigs(currentSorts => [
                      ...currentSorts,
                      { columnId: displayGoalColumns[0]?.id || 'title', direction: 'asc' },
                    ]);
                    setSortPickerOpen(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Sort</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortConfigs([])}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete sort</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="property-popover fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-lg shadow-2xl p-1 w-48 overflow-hidden text-[13px]"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
              }}
            >
              <div className="property-popover-heading px-2.5 py-1 font-bold text-[var(--tokyo-text-faint)] tracking-normal">
                Select {toSentenceCase(customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {customDropdown.type === 'status' ? (
                  GOAL_STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        const goal = goals.find(g => g.id === customDropdown.id);
                        if (goal) updateGoal({ ...goal, status: option as any });
                        setCustomDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        normalizeGoalStatus(customDropdown.currentValue) === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>{toSentenceCase(option)}</span>
                    </button>
                  ))
                ) : customDropdown.type === 'priority' ? (
                  ['low', 'medium', 'high'].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        const goal = goals.find(g => g.id === customDropdown.id);
                        if (goal) updateGoal({ ...goal, priority: option as any });
                        setCustomDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        customDropdown.currentValue === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>{toSentenceCase(option)}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const goal = goals.find(g => g.id === customDropdown.id);
                        if (goal) updateGoal({ ...goal, areaId: undefined });
                        setCustomDropdown(null);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        !customDropdown.currentValue ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>No Area</span>
                    </button>
                    {areas.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => {
                          const goal = goals.find(g => g.id === customDropdown.id);
                          if (goal) updateGoal({ ...goal, areaId: area.id });
                          setCustomDropdown(null);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                          customDropdown.currentValue === area.id ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                        )}
                      >
                        <span className="min-w-0 truncate">{area.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Icon Picker Popover */}
      {iconPickerId && iconPickerPos && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => {
              setIconPickerId(null);
              setIconPickerType(null);
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
              currentIcon={
                iconPickerType === 'tab' 
                  ? (tabs.find(t => t.id === iconPickerId)?.icon || 'Target')
                  : iconPickerType === 'main'
                    ? (sidebarItems.find(i => i.id === iconPickerId)?.icon || 'Target')
                    : iconPickerType === 'goal'
                      ? (goals.find(g => g.id === iconPickerId)?.icon || 'Target')
                      : (displayGoalColumns.find(c => c.id === iconPickerId)?.icon || 'Target')
              }
              onSelect={(iconName) => {
                if (iconPickerType === 'tab') {
                  setTabs(tabs.map(t => t.id === iconPickerId ? { ...t, icon: iconName } : t));
                } else if (iconPickerType === 'main') {
                  const item = sidebarItems.find(i => i.id === iconPickerId);
                  if (item) {
                    updateSidebarItem(item.id, item.label, iconName);
                  }
                } else if (iconPickerType === 'goal') {
                  const goal = goals.find(g => g.id === iconPickerId);
                  if (goal) {
                    updateGoal({ ...goal, icon: iconName });
                  }
                } else {
                  const existingColumn = displayGoalColumns.find(c => c.id === iconPickerId);
                  setColumns(columns.some(c => c.id === iconPickerId)
                    ? columns.map(c => c.id === iconPickerId ? { ...c, icon: iconName } : c)
                    : existingColumn
                      ? [...columns, { ...existingColumn, icon: iconName }]
                      : columns
                  );
                }
                setIconPickerId(null);
                setIconPickerType(null);
              }}
              onClose={() => {
                setIconPickerId(null);
                setIconPickerType(null);
              }}
            />
          </div>
        </>
      )}

        {/* Date Picker Popover */}
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
                onSelect={(date, config) => {
                  if (datePickerConfig.id.startsWith('prop:')) {
                    const propId = datePickerConfig.id.replace('prop:', '');
                    if (selectedGoal) {
                      const newProps = (selectedGoal.customProperties || []).map(p => 
                        p.id === propId ? { ...p, value: date.toISOString() } : p
                      );
                      updateGoal({ ...selectedGoal, customProperties: newProps });
                    }
                  } else {
                    const goal = goals.find(g => g.id === datePickerConfig.id);
                    if (goal) {
                      updateGoal({ 
                        ...goal, 
                        targetDate: date.toISOString(),
                        targetTime: config?.time,
                        reminder: config?.reminder,
                        alert: config?.alert,
                        repeat: config?.repeat
                      });
                    }
                  }
                }}
                onClose={() => setDatePickerConfig(null)}
              />
            </div>
          </>
        )}

      {/* Tab Context Menu */}
      {tabContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[130]" 
            onClick={() => setTabContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setTabContextMenu(null);
            }}
          />
          <div 
            className="fixed z-[140] w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-lg py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(tabContextMenu.y, window.innerHeight - 100), 
              left: Math.min(tabContextMenu.x, window.innerWidth - 200) 
            }}
          >
            <button 
              onClick={() => {
                const tab = tabs.find(t => t.id === tabContextMenu.id);
                if (tab) {
                  setEditingTabId(tab.id);
                  setEditingTabName(tab.label);
                }
                setTabContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
            >
              <Pencil className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              Rename
            </button>
            <div className="h-px bg-[var(--tokyo-border)] my-1" />
            <button 
              onClick={() => {
                handleDeleteTab(tabContextMenu.id);
                setTabContextMenu(null);
              }}
              disabled={tabs.length <= 1}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}

      {/* Goal Context Menu */}
      {goalContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[130]" 
            onClick={() => setGoalContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setGoalContextMenu(null);
            }}
          />
          <div 
            className="fixed z-[140] w-60 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-lg py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(goalContextMenu.y, window.innerHeight - 220), 
              left: Math.min(goalContextMenu.x, window.innerWidth - 252) 
            }}
          >
            <button 
              onClick={() => {
                const goal = goals.find(g => g.id === goalContextMenu.id);
                if (goal) {
                  setEditingGoalId(goal.id);
                  setEditingGoalTitle(goal.title);
                }
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Pencil className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              Rename
            </button>
            <button 
              onClick={() => {
                setIconPickerId(goalContextMenu.id);
                setIconPickerType('goal');
                setIconPickerPos({ x: goalContextMenu.x, y: goalContextMenu.y });
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Smile className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              Change Icon
            </button>
            <div className="h-px bg-[var(--tokyo-border)] my-1" />
            <button 
              onClick={() => {
                const goal = goals.find(g => g.id === goalContextMenu.id);
                if (goal) {
                  updateGoal({ ...goal, status: normalizeGoalStatus(goal.status) === 'completed' ? 'active' : 'completed' });
                }
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              {normalizeGoalStatus(goals.find(g => g.id === goalContextMenu.id)?.status || '') === 'completed' ? 'Mark as Active' : 'Mark as Completed'}
            </button>
            <button 
              onClick={() => {
                duplicateGoal(goalContextMenu.id);
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              Duplicate Goal
            </button>
            <div className="h-px bg-[var(--tokyo-border)] my-1" />
            <button 
              onClick={() => {
                deleteGoal(goalContextMenu.id);
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Delete Goal
            </button>
          </div>
        </>
      )}

      {/* Page Context Menu */}
    </div>
  </div>
  );
}

function GoalDetailsPage({ goal, onBack }: { 
  goal: Goal, 
  onBack: () => void
}) {
  const { updateGoal, deleteGoal, tasks, addTask, updateTask, user, viewSettings, updateViewSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState('Todo list');
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
  const [propertyIconPicker, setPropertyIconPicker] = useState<{ id: string, isSystem: boolean, pos: { x: number, y: number } } | null>(null);
  const [propertyContextMenu, setPropertyContextMenu] = useState<{ x: number, y: number, id: string, isSystem: boolean } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingPropertyName, setEditingPropertyName] = useState<string>('');
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: '@abdolamunir I will do it ASAP.', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: '2', name: 'Abdola Munir', time: '50m ago', text: '@raheemsterling @alensheerer Create a comprehensive set of UI components, ensuring consistency in style and functionality.', avatar: 'https://i.pravatar.cc/150?u=abdolamunir', reactions: [{ emoji: '👍', count: 1 }] },
    { id: '3', name: 'Abdola Munir', time: '1h 20m ago', text: 'Specify typography rules and font choices to maintain a unified and professional appearance.', avatar: 'https://i.pravatar.cc/150?u=abdolamunir', reactions: [{ emoji: '👍', count: 1 }] }
  ]);
  
  const priorities = ['low', 'medium', 'high'];
  const statuses = GOAL_STATUS_OPTIONS;

  const handleUpdate = (updates: Partial<Goal>) => {
    updateGoal({ ...goal, ...updates });
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
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
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      value: ''
    };
    handleUpdate({
      customProperties: [...(goal.customProperties || []), newProp]
    });
    setIsPropertyPickerOpen(false);
  };

  const columns = viewSettings?.goals?.columns || [];
  const getCol = (id: string, defaultLabel: string, defaultIcon: string) => {
    const col = columns.find((c: any) => c.id === id);
    return { label: col?.label || defaultLabel, icon: col?.icon || defaultIcon, hidden: col?.hidden };
  };

  const handleRenameProperty = (id: string, isSystem: boolean, newName: string) => {
    if (!newName.trim()) return;
    if (isSystem) {
      const savedSettings = viewSettings.goals || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, label: newName.trim() } : c)
        : [...cols, { id, label: newName.trim(), icon: getCol(id, id, 'Text').icon, width: '150px' }];
      updateViewSettings('goals', { ...savedSettings, columns: updatedCols });
    } else {
      handleUpdate({
        customProperties: goal.customProperties?.map(p => 
          p.id === id ? { ...p, name: newName.trim() } : p
        )
      });
    }
  };

  const handleUpdatePropertyIcon = (id: string, isSystem: boolean, newIcon: string) => {
    if (isSystem) {
      const savedSettings = viewSettings.goals || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, icon: newIcon } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: newIcon, width: '150px' }];
      updateViewSettings('goals', { ...savedSettings, columns: updatedCols });
    } else {
      handleUpdate({
        customProperties: goal.customProperties?.map(p => 
          p.id === id ? { ...p, icon: newIcon } : p
        )
      });
    }
  };

  const handleDeletePropertyAction = (id: string, isSystem: boolean) => {
    if (isSystem) {
      const savedSettings = viewSettings.goals || {};
      const cols = savedSettings.columns || [];
      const updatedCols = cols.find((c: any) => c.id === id)
        ? cols.map((c: any) => c.id === id ? { ...c, hidden: true } : c)
        : [...cols, { id, label: getCol(id, id, 'Text').label, icon: getCol(id, id, 'Text').icon, width: '150px', hidden: true }];
      updateViewSettings('goals', { ...savedSettings, columns: updatedCols });
    } else {
      handleUpdate({
        customProperties: goal.customProperties?.filter(p => p.id !== id)
      });
    }
  };

  const statusCol = getCol('status', 'Status', 'CheckCircle');
  const creatorCol = getCol('creator', 'Creator', 'User');
  const priorityCol = getCol('priority', 'Priority', 'Zap');
  const dateCol = getCol('date', 'Due date', 'CalendarIcon');
  const progressCol = getCol('progress', 'Progress', 'Circle');
  const assignedCol = getCol('assigned', 'Assigned', 'Users');

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop rounded-lg -mx-2 px-2 py-1 hover:bg-white/[0.02] transition-colors relative";

  const renderIcon = (iconName: string, fallback: React.ElementType, className: string) => {
    const IconComponent = ALL_ICONS[iconName] || fallback;
    return <IconComponent className={className} />;
  };

  const handleUpdateProperty = (propId: string, value: any) => {
    handleUpdate({
      customProperties: goal.customProperties?.map(p => p.id === propId ? { ...p, value } : p)
    });
  };

  const handleDeleteProperty = (propId: string) => {
    handleUpdate({
      customProperties: goal.customProperties?.filter(p => p.id !== propId)
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

  const goalTasks = tasks.filter(t => t.goalId === goal.id);

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({
      id,
      title: '',
      status: 'todo',
      priority: 'medium',
      goalId: goal.id,
      tags: []
    });
  };

  const handleCopyGoalLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#goal-details:${goal.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full w-full flex-1">
        {/* Header */}
        <div className="flex-shrink-0 w-full">
        <div className="mb-5 flex items-center gap-3">
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setIconPickerId(goal.id);
                setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
            >
              {React.createElement(iconMap[goal.icon || 'Target'] || Target, { className: "w-6 h-6" })}
            </div>
          <div className="min-w-0 flex-1">
            <input 
              type="text"
              value={goal.title}
              onChange={(e) => handleUpdate({ title: e.target.value })}
              className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
              placeholder="Untitled Goal"
            />
          </div>
          <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
            <button
              onClick={() => void handleCopyGoalLink()}
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
        
        {/* Properties - Vertical List */}
        <div className="space-y-2 mb-12 max-w-3xl pl-2.5">
          {/* Assigned */}
          {!assignedCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'assigned', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
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
          )}

          {/* Due date */}
          {!dateCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'date', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                  {renderIcon(dateCol.icon, CalendarIcon, "w-4 h-4")}
                  {editingPropertyId === 'date' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('date', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('date', true, editingPropertyName); setEditingPropertyId(null); } }}
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
                    id: goal.id,
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
                    config: {
                      time: goal.targetTime || '12:00',
                      reminder: goal.reminder || 'none',
                      alert: goal.alert || 'none',
                      repeat: goal.repeat || 'none'
                    }
                  });
                }}
                className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white"
              >
                {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'Set date...'}
              </div>
            </div>
          )}

          {/* Priority */}
          {!priorityCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'priority', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
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
                      id: goal.id,
                      type: 'priority',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: goal.priority
                    });
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7 flex items-center",
                    getPriorityBadgeClasses(goal.priority)
                  )}
                >
                  {toSentenceCase(goal.priority)}
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {!statusCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'status', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
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
                      id: goal.id,
                      type: 'status',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: goal.status
                    });
                  }}
                  className={cn(
                    "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7",
                    getGoalStatusClasses(goal.status)
                  )}
                >
                  <span>{toSentenceCase(normalizeGoalStatus(goal.status))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {!progressCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'progress', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                  {renderIcon(progressCol.icon, Circle, "w-4 h-4")}
                  {editingPropertyId === 'progress' ? (
                    <input 
                      type="text" 
                      value={editingPropertyName} 
                      onChange={(e) => setEditingPropertyName(e.target.value)}
                      onBlur={() => { handleRenameProperty('progress', true, editingPropertyName); setEditingPropertyId(null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameProperty('progress', true, editingPropertyName); setEditingPropertyId(null); } }}
                      className="bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none w-full text-[var(--tokyo-text-strong)]"
                      autoFocus
                    />
                  ) : (
                    <span>{progressCol.label}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center px-2.5 -ml-2.5 rounded-lg h-7 transition-all">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center px-2 py-0.5 min-w-[38px] text-[11px] font-semibold bg-white/[0.04] text-[var(--tokyo-green)] rounded-[6px]">
                    {goal.progress || 0}%
                  </div>
                  <div className="h-1.5 w-36 bg-white/[0.06] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--tokyo-green)] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(0, Math.min(100, goal.progress || 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Creator */}
          {!creatorCol.hidden && (
            <div 
              className={propertyRowClass}
              onContextMenu={(e) => {
                e.preventDefault();
                setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: 'creator', isSystem: true });
              }}
            >
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
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
              <div className="flex items-center gap-2">
                <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-5 h-5 rounded-full ring-white/10" alt="creator" />
                <span className="text-[var(--tokyo-text)] text-sm font-medium">Abdola Munir</span>
              </div>
            </div>
          )}

          {/* Custom Properties */}
          {goal.customProperties?.map(prop => {
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
                onContextMenu={(e) => {
                  e.preventDefault();
                  setPropertyContextMenu({ x: e.clientX, y: e.clientY, id: prop.id, isSystem: false });
                }}
              >
                <div className="w-40 shrink-0 flex items-center">
                  <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
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
                      className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white flex-1"
                    >
                      {prop.value ? format(new Date(prop.value), 'MMM d, yyyy') : 'Empty'}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 transition-all group/val">
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
              className="flex items-center gap-1.5 text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add property</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)]">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pl-2.5">
            {['Todo list', 'Comments', 'Activity'].map(tabId => (
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
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full pl-2.5">
        {activeTab === 'Todo list' && (
          <div className="space-y-2">
            {goalTasks.map((task) => (
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
                    "bg-transparent border-none outline-none flex-1 text-sm transition-all placeholder:text-white/10",
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
              { user: 'Abdola Munir', action: 'changed status to', value: 'In progress', time: '2h ago' },
              { user: 'Abdola Munir', action: 'set priority to', value: 'High', time: '2h ago' },
              { user: 'Abdola Munir', action: 'created this goal', value: '', time: '3h ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <img src={activity.user === 'Abdola Munir' ? (user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff") : "https://i.pravatar.cc/150?u=abdolamunir"} className="w-7 h-7 rounded-full" alt="avatar" />
                <div className="flex items-center gap-2">
                  <span className="text-[var(--tokyo-text-strong)] font-medium">{activity.user}</span>
                  <span className="text-[var(--tokyo-text-faint)]">{activity.action}</span>
                  {activity.value && <span className="text-[var(--tokyo-text-strong)] font-medium">{activity.value}</span>}
                  <span className="text-white/20">•</span>
                  <span className="text-[var(--tokyo-text-faint)]">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Popovers live outside tab content so switching tabs never changes page layout. */}
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
                      (customDropdown.type === 'status'
                        ? normalizeGoalStatus(customDropdown.currentValue) === option
                        : customDropdown.currentValue === option)
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
                onSelect={(date, config) => {
                  if (datePickerConfig.id.startsWith('prop:')) {
                    const propId = datePickerConfig.id.replace('prop:', '');
                    handleUpdate({
                      customProperties: goal.customProperties?.map(p => (
                        p.id === propId ? { ...p, value: date.toISOString() } : p
                      ))
                    });
                  } else {
                    handleUpdate({
                      targetDate: date.toISOString(),
                      targetTime: config?.time,
                      reminder: config?.reminder,
                      alert: config?.alert,
                      repeat: config?.repeat
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
              className="fixed z-[120] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-lg shadow-2xl p-2 w-64"
              style={{ 
                top: Math.min(propertyPickerPos.y, window.innerHeight - 300), 
                left: Math.min(propertyPickerPos.x, window.innerWidth - 280) 
              }}
            >
              <div className="px-3 py-2 text-xs font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Basic properties
              </div>
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
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-muted)] group-hover:text-white transition-colors">
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
                currentIcon={goal.icon || 'Target'}
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
                  ? getCol(propertyContextMenu.id, propertyContextMenu.id, 'Text').label 
                  : (goal.customProperties?.find(p => p.id === propertyContextMenu.id)?.name || '')
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
            <div 
              className="fixed inset-0 z-[160]" 
              onClick={() => setPropertyIconPicker(null)}
              onContextMenu={(e) => { e.preventDefault(); setPropertyIconPicker(null); }}
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
                    : (goal.customProperties?.find(p => p.id === propertyIconPicker.id)?.icon || 'Text')
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
