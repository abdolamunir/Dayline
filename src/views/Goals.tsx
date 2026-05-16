import React, { useEffect, useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
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
  Copy01Icon as Copy
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
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
const DEFAULT_GOAL_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];
const DEFAULT_GOAL_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'areas', label: 'Areas', icon: 'Layers', width: '180px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
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

export function Goals({ onViewChange, selectedGoalId }: { onViewChange?: (view: string) => void, selectedGoalId?: string }) {
  const { goals, areas, updateGoal, reorderGoals, addGoal, deleteGoal, duplicateGoal, tasks, addTask, updateTask, sidebarItems, updateSidebarItem, deleteSidebarItem, viewSettings, updateViewSettings } = useAppStore();
  const savedGoalSettings = viewSettings.goals || {};
  const [localSelectedGoalId, setLocalSelectedGoalId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerType, setIconPickerType] = useState<'tab' | 'column' | 'main' | 'goal' | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [goalContextMenu, setGoalContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalTitle, setEditingGoalTitle] = useState('');
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const titleEditRef = useRef<HTMLHeadingElement>(null);
  const descriptionEditRef = useRef<HTMLParagraphElement>(null);
  const isDraggingRef = useRef(false);
  
  const [tabs, setTabs] = useState(savedGoalSettings.tabs || DEFAULT_GOAL_TABS);

  const [columns, setColumns] = useState(savedGoalSettings.columns || DEFAULT_GOAL_COLUMNS);

  const [activeTab, setActiveTab] = useState<string>(savedGoalSettings.activeTab || 'active');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(savedGoalSettings.title || 'Goals');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(savedGoalSettings.description || 'Track and manage your long-term objectives.');
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'status' | 'priority' | 'area';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
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
    if (settings.columns) setColumns(settings.columns);
    if (settings.activeTab) setActiveTab(settings.activeTab);
    if (settings.title) setTitleValue(settings.title);
    if (settings.description) setDescriptionValue(settings.description);
  }, [viewSettings.goals]);

  useEffect(() => {
    updateViewSettings('goals', {
      tabs,
      columns,
      activeTab,
      title: titleValue,
      description: descriptionValue,
    });
  }, [tabs, columns, activeTab, titleValue, descriptionValue]);

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
        setCustomDropdown={setCustomDropdown}
        setDatePickerConfig={setDatePickerConfig}
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

  return (
    <div 
      className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-4 min-h-full"
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId('goals');
              setIconPickerType('main');
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className="w-12 h-12 rounded-2xl bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-[var(--tokyo-hover)] transition-colors"
          >
            {React.createElement(iconMap[sidebarItems.find(i => i.id === 'goals')?.icon || 'Target'] || Target, { className: "w-6 h-6" })}
          </div>
          <div className="flex-1 min-w-0">
            <h1 
              ref={titleEditRef}
              contentEditable={isEditingTitle}
              suppressContentEditableWarning
              className="text-xl md:text-2xl font-semibold text-[var(--tokyo-text-strong)] tracking-tight leading-tight cursor-text outline-none"
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
            <p 
              ref={descriptionEditRef}
              contentEditable={isEditingDescription}
              suppressContentEditableWarning
              className="text-[var(--tokyo-text-muted)] -mt-0.5 text-xs md:text-sm leading-normal cursor-text outline-none"
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
      </header>

      <div className="flex flex-col gap-0 flex-1 overflow-hidden">
        {/* Tabs & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[var(--tokyo-border)] pb-2">
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
          className="hidden sm:flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {tabs.map(tab => {
            const Icon = iconMap[tab.icon] || Target;
            return (
              <Reorder.Item 
                key={tab.id}
                value={tab}
                data-tab-id={tab.id}
                layout="position"
                drag="x"
                dragElastic={0.04}
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
                  "flex items-center gap-1 pl-[7px] pr-[9px] py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap group relative",
                  activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]",
                  draggingId === tab.id ? "cursor-grabbing" : "cursor-pointer",
                  hoveredTabId === tab.id && getGoalStatusClasses(tab.id)
                )}
                whileDrag={{ scale: 1.03, y: -1 }}
                transition={{
                  layout: { duration: 0.08, ease: "easeOut" },
                  scale: { duration: 0.08, ease: "easeOut" },
                  y: { duration: 0.08, ease: "easeOut" },
                }}
              >
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setIconPickerId(tab.id);
                    setIconPickerType('tab');
                    setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                  }}
                  className="hover:bg-[var(--tokyo-hover)] rounded p-0.5 transition-colors cursor-pointer"
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
                  <span onDoubleClick={() => {
                    setEditingTabId(tab.id);
                    setEditingTabName(tab.label);
                  }}>
                    {tab.label}
                  </span>
                )}
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
              className="w-[34px] h-[34px] flex items-center justify-center text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] transition-colors rounded-lg hover:bg-[var(--tokyo-hover)] cursor-pointer shrink-0"
              title="Add new tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </Reorder.Group>

        <div className="flex shrink-0 items-center justify-end gap-1 text-[var(--tokyo-text-faint)]">
          <button className="p-2 hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
          <button className="p-2 hover:text-white transition-colors"><FilterIcon className="w-5 h-5" /></button>
          <button className="p-2 hover:text-white transition-colors"><Sort className="w-5 h-5" /></button>
          <button 
            onClick={handleNewGoal}
            className="ml-3 bg-[var(--tokyo-yellow-dim)] text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Goal
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className={cn("w-full h-full", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <table className="w-full text-left border-separate border-spacing-0 min-w-[1200px] table-fixed">
            <thead>
              <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
                {columns.map((col, index) => (
                  <th 
                    key={col.id} 
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-1.5 border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-hidden",
                      index === 0 && "pl-[5px]"
                    )}
                  >
                    <div className="flex items-center gap-0.5 w-full min-w-0 overflow-hidden">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setIconPickerId(col.id);
                          setIconPickerType('column');
                          setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                        }}
                        className="w-5 h-5 rounded-md transition-colors text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] flex items-center justify-center cursor-pointer shrink-0"
                      >
                        {React.createElement(iconMap[col.icon] || Target, { className: "w-3.5 h-3.5" })}
                      </button>
                      {editingColumnId === col.id ? (
                        <input
                          autoFocus
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
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
                          className="capitalize cursor-pointer hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] px-1.5 h-7 rounded-md transition-colors text-sm font-medium inline-flex min-w-0 max-w-full items-center whitespace-nowrap overflow-hidden text-ellipsis"
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
                  </th>
                ))}
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              values={filteredGoals} 
              onReorder={(newGoals) => {
                reorderGoals(newGoals);
              }}
              className="relative"
            >
              {filteredGoals.map(goal => {
                const area = areas.find(a => a.id === goal.areaId);
                return (
                  <Reorder.Item 
                    key={goal.id} 
                    value={goal}
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
                      setDraggingId(goal.id);
                      isDraggingRef.current = true;
                    }}
                    onDragEnd={(event, info) => {
                      setDraggingId(null);
                      setHoveredTabId(null);
                      setTimeout(() => {
                        isDraggingRef.current = false;
                      }, 100);
                      if (tabContainerRef.current) {
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
                      }
                    }}
                    onContextMenu={(e) => handleGoalContextMenu(e, goal.id)}
                    onClick={() => {
                      if (isDraggingRef.current) return;
                      if (onViewChange) {
                        onViewChange(`goal-details:${goal.id}`);
                      } else {
                        setLocalSelectedGoalId(goal.id);
                      }
                    }}
                    className={cn(
                        "group transition-colors select-none cursor-pointer active:cursor-grabbing hover:bg-white/[0.02] whitespace-nowrap",
                        draggingId === goal.id ? "cursor-grabbing bg-white/[0.04]" : ""
                      )}
                    >
                      <td 
                        style={{ width: columns[0].width }}
                        className="h-11 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
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
                              className="bg-transparent border-none outline-none text-[14px] leading-5 font-medium tracking-tight text-[var(--tokyo-text-strong)]/60 w-full"
                            />
                          ) : (
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoalId(goal.id);
                                setEditingGoalTitle(goal.title);
                              }}
                              className="text-[var(--tokyo-text-strong)]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
                            >
                              {goal.title}
                            </span>
                          )}
                        </div>
                      </td>
                    <td 
                      style={{ width: columns[1].width }}
                      className="px-4 h-11 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                    >
                      <div className="relative flex items-center">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setCustomDropdown({
                              id: goal.id,
                              type: 'status',
                              pos: { x: rect.left, y: rect.bottom + 8 },
                              currentValue: goal.status
                            });
                          }}
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                            getGoalStatusClasses(goal.status)
                          )}
                        >
                          <span>{toSentenceCase(normalizeGoalStatus(goal.status))}</span>
                        </span>
                      </div>
                    </td>
                    <td 
                      style={{ width: columns[2].width }}
                      className="px-4 h-11 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                    >
                      <div className="relative flex items-center">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
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
                            goal.priority === 'high' ? "bg-red-500/20 text-red-400" :
                            goal.priority === 'medium' ? "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]" :
                            "bg-green-500/20 text-green-400"
                          )}
                        >
                          {toSentenceCase(goal.priority)}
                        </span>
                      </div>
                    </td>
                    <td 
                      style={{ width: columns[3].width }}
                      className="px-4 h-11 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                    >
                      <div className="relative flex items-center">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
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
                    </td>
                    <td 
                      style={{ width: columns[4].width }}
                      className="px-4 h-11 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
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
                        className="relative flex items-center gap-1 text-[var(--tokyo-text-faint)] text-[13px] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors"
                      >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <span>{goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'No date'}</span>
                      </div>
                    </td>
                    <td 
                      style={{ width: columns[5].width }}
                      className="px-4 h-11 border-b border-[var(--tokyo-border)] whitespace-nowrap"
                    >
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex items-center gap-1 cursor-pointer group/progress"
                      >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[var(--tokyo-yellow)]/60 group-hover/progress:text-[var(--tokyo-yellow)] transition-colors">
                          <Circle className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)] hover:bg-[var(--tokyo-yellow-soft)] transition-colors">
                          <span className="text-xs font-medium">{goal.progress}</span>
                          <span className="text-xs font-medium">%</span>
                        </div>
                      </div>
                    </td>
                  </Reorder.Item>
                );
              })}
              {/* New page row */}
              <tr className="group">
                <td 
                  style={{ width: columns[0].width }}
                  className="h-11 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={handleNewGoal}
                >
                  <div className="flex items-center gap-1 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)]">
                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[14px]">New page</span>
                  </div>
                </td>
                <td colSpan={6} className="h-11 border-b border-[var(--tokyo-border)]"></td>
              </tr>
            </Reorder.Group>
          </table>
        </div>
      </div>

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
              className="property-popover fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-lg shadow-2xl p-1 w-48 overflow-hidden"
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
                        "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        normalizeGoalStatus(customDropdown.currentValue) === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>{toSentenceCase(option)}</span>
                      {normalizeGoalStatus(customDropdown.currentValue) === option && (
                        <span className="text-[11px] text-current">✓</span>
                      )}
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
                        "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        customDropdown.currentValue === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>{toSentenceCase(option)}</span>
                      {customDropdown.currentValue === option && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--tokyo-purple)]" />
                      )}
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
                        "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                        !customDropdown.currentValue ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                      )}
                    >
                      <span>No Area</span>
                      {!customDropdown.currentValue && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--tokyo-purple)]" />
                      )}
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
                          "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md transition-colors text-left group",
                          customDropdown.currentValue === area.id ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                        )}
                      >
                        <span className="min-w-0 truncate">{area.name}</span>
                        {customDropdown.currentValue === area.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--tokyo-purple)]" />
                        )}
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
                      : (columns.find(c => c.id === iconPickerId)?.icon || 'Target')
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
                  setColumns(columns.map(c => c.id === iconPickerId ? { ...c, icon: iconName } : c));
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
                  setDatePickerConfig(null);
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
            className="fixed z-[140] w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
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
            className="fixed z-[140] w-60 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              {normalizeGoalStatus(goals.find(g => g.id === goalContextMenu.id)?.status || '') === 'completed' ? 'Mark as Active' : 'Mark as Completed'}
            </button>
            <button 
              onClick={() => {
                duplicateGoal(goalContextMenu.id);
                setGoalContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
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
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] transition-colors cursor-pointer whitespace-nowrap"
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

function GoalDetailsPage({ goal, onBack, setCustomDropdown, setDatePickerConfig }: { 
  goal: Goal, 
  onBack: () => void,
  setCustomDropdown: (val: any) => void,
  setDatePickerConfig: (val: any) => void
}) {
  const { updateGoal, deleteGoal, tasks, addTask, updateTask } = useAppStore();
  const [activeTab, setActiveTab] = useState('Todo list');
  const [commentText, setCommentText] = useState('');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: '@stephenrobert I will do it ASAP.', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: '2', name: 'Stephen Robert', time: '50m ago', text: '@raheemsterling @alensheerer Create a comprehensive set of UI components, ensuring consistency in style and functionality.', avatar: 'https://i.pravatar.cc/150?u=4', reactions: [{ emoji: '👍', count: 1 }] },
    { id: '3', name: 'Stephen Robert', time: '1h 20m ago', text: 'Specify typography rules and font choices to maintain a unified and professional appearance.', avatar: 'https://i.pravatar.cc/150?u=4', reactions: [{ emoji: '👍', count: 1 }] }
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
          name: 'Stephen Robert',
          time: 'Just now',
          text: commentText,
          avatar: 'https://i.pravatar.cc/150?u=4'
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

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">Goals</button>
            <span>/</span>
            <span className="text-[var(--tokyo-text-muted)] capitalize whitespace-nowrap">{goal.status}</span>
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
          value={goal.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          className="w-full bg-transparent text-4xl font-bold text-[var(--tokyo-text-strong)] mb-8 tracking-tight outline-none placeholder:text-white/10"
          placeholder="Untitled Goal"
        />
        
        {/* Properties - Vertical List */}
        <div className="space-y-2 mb-12 max-w-2xl">
          {/* Assigned */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Users className="w-4 h-4" />
              <span>Assigned</span>
            </div>
            <div className="flex -space-x-2">
              {[
                'https://i.pravatar.cc/150?u=5',
                'https://i.pravatar.cc/150?u=4',
                'https://i.pravatar.cc/150?u=6'
              ].map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-[var(--tokyo-bg)] ring-1 ring-white/5" alt="avatar" />
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <CalendarIcon className="w-4 h-4" />
              <span>Due date</span>
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
              className="text-[var(--tokyo-text-strong)] text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
            >
              {goal.targetDate ? format(new Date(goal.targetDate), 'MMM d, yyyy') : 'Set date...'}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Zap className="w-4 h-4" />
              <span>Priority</span>
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
                  "px-2 py-0.5 rounded-md text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity",
                  goal.priority === 'high' ? "bg-red-500/20 text-red-400" : 
                  goal.priority === 'medium' ? "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]" : 
                  "bg-green-500/20 text-green-400"
                )}
              >
                {toSentenceCase(goal.priority)}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
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
                  "flex items-center px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                  getGoalStatusClasses(goal.status)
                )}
              >
                <span>{toSentenceCase(normalizeGoalStatus(goal.status))}</span>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <User className="w-4 h-4" />
              <span>Creator</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="https://i.pravatar.cc/150?u=4" className="w-5 h-5 rounded-full ring-1 ring-white/10" alt="creator" />
              <span className="text-[var(--tokyo-text)] text-[13px] font-medium">Stephen Robert</span>
            </div>
          </div>

          {/* Custom Properties */}
          {goal.customProperties?.map(prop => {
            const PropIcon = {
              text: Text,
              number: Hash,
              select: Layers,
              date: CalendarIcon
            }[prop.type] || Text;

            return (
              <div key={prop.id} className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
                <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
                  <PropIcon className="w-4 h-4" />
                  <input 
                    type="text"
                    value={prop.name}
                    onChange={(e) => {
                      handleUpdate({
                        customProperties: goal.customProperties?.map(p => p.id === prop.id ? { ...p, name: e.target.value } : p)
                      });
                    }}
                    className="bg-transparent border-none p-0 focus:ring-0 w-full text-[13px] font-medium placeholder:text-white/10"
                  />
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
                      className="text-[var(--tokyo-text-strong)] text-[13px] font-medium cursor-pointer hover:text-white transition-colors flex-1"
                    >
                      {prop.value ? format(new Date(prop.value), 'MMM d, yyyy') : 'Empty'}
                    </div>
                  ) : (
                    <input 
                      type={prop.type === 'number' ? 'number' : 'text'}
                      value={prop.value}
                      onChange={(e) => handleUpdateProperty(prop.id, e.target.value)}
                      placeholder="Empty"
                      className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-[13px] font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/5"
                    />
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
              className="text-[var(--tokyo-yellow)] text-sm font-medium flex items-center gap-2 hover:text-[var(--tokyo-yellow)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add property
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)] pb-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {[
              { id: 'Todo list', icon: List },
              { id: 'Comments', icon: MessageSquare },
              { id: 'Activity', icon: Activity }
            ].map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 pl-[11px] pr-[13px] py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                  activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                <div className="p-0.5">
                  <tab.icon className="w-4 h-4" />
                </div>
                {tab.id}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 pt-6 space-y-8 max-w-6xl mx-auto w-full">
        {activeTab === 'Todo list' && (
          <div className="space-y-4">
            {goalTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-[var(--tokyo-border)] rounded-xl group hover:bg-white/[0.04] transition-all">
                <button 
                  onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                    task.status === 'done' ? "bg-[var(--tokyo-yellow)] border-[var(--tokyo-yellow)]" : "border-[var(--tokyo-border-strong)] group-hover:border-white/20"
                  )}
                >
                  {task.status === 'done' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
                <input 
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask({ ...task, title: e.target.value })}
                  placeholder="Task description..."
                  className={cn(
                    "bg-transparent border-none outline-none flex-1 text-base transition-all placeholder:text-white/10",
                    task.status === 'done' ? "text-[var(--tokyo-text-faint)] line-through" : "text-[var(--tokyo-text)]"
                  )}
                />
              </div>
            ))}
            <button 
              onClick={handleAddTask}
              className="flex items-center gap-3 p-4 text-[var(--tokyo-yellow)] hover:text-[var(--tokyo-yellow)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add new task</span>
            </button>
          </div>
        )}

        {activeTab === 'Comments' && (
          <>
            {/* Comment Input */}
            <div className="bg-white/[0.03] border border-[var(--tokyo-border)] rounded-2xl p-6">
              <div className="flex gap-4 mb-6">
                <img src="https://i.pravatar.cc/150?u=4" className="w-10 h-10 rounded-full" alt="me" />
                <textarea 
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-base resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-[var(--tokyo-text-faint)]">
                  <button className="hover:text-white transition-colors"><Smile className="w-5 h-5" /></button>
                  <button className="hover:text-white transition-colors"><AtSign className="w-5 h-5" /></button>
                  <button className="hover:text-white transition-colors"><Link className="w-5 h-5" /></button>
                  <button className="hover:text-white transition-colors"><Hash className="w-5 h-5" /></button>
                  <button className="hover:text-white transition-colors"><Attachment className="w-5 h-5" /></button>
                </div>
                <button 
                  onClick={handleAddComment}
                  className="bg-[var(--tokyo-yellow-dim)] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-lg shadow-black/20"
                >
                  Comment
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-10 pb-20">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-5 group">
                  <img src={comment.avatar} className="w-11 h-11 rounded-full" alt="avatar" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--tokyo-text-strong)] font-bold text-base">{comment.name}</span>
                        <span className="text-white/20 text-xs">•</span>
                        <span className="text-[var(--tokyo-text-faint)] text-sm">{comment.time}</span>
                      </div>
                      <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-[var(--tokyo-text)] text-lg leading-relaxed">
                      {comment.text}
                    </p>
                    <div className="flex items-center gap-6 pt-2">
                      <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors"><Smile className="w-5 h-5" /></button>
                      {comment.reactions?.map((r, ri) => (
                        <button key={ri} className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--tokyo-hover)] border border-[var(--tokyo-border)] text-sm">
                          <span>{r.emoji}</span>
                          <span className="text-[var(--tokyo-text-faint)]">{r.count}</span>
                        </button>
                      ))}
                      <button className="text-[var(--tokyo-text-muted)] text-sm font-bold hover:text-white transition-colors">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Property Picker Popover */}
        <AnimatePresence>
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
                className="fixed z-[120] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl p-2 w-64"
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors text-left group"
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
        </AnimatePresence>

        {activeTab === 'Activity' && (
          <div className="space-y-6">
            {[
              { user: 'Stephen Robert', action: 'changed status to', value: 'In progress', time: '2h ago' },
              { user: 'Stephen Robert', action: 'set priority to', value: 'High', time: '2h ago' },
              { user: 'Stephen Robert', action: 'created this goal', value: '', time: '3h ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <img src="https://i.pravatar.cc/150?u=4" className="w-8 h-8 rounded-full" alt="avatar" />
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
  );
}
