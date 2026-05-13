import React, { useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
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
  InboxIcon as Inbox,
  File01Icon as FileIcon
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { IconPicker, ALL_ICONS } from './IconPicker';
import { DatePicker, DateConfig } from './DatePicker';
import { format } from 'date-fns';
import { CustomPage, CustomPageItem } from '../types';
import { DatabasePanel, PrimaryButton, SearchButton, ToolButton, ViewTabs, WorkspaceHeader, WorkspacePage } from './ui/DatabaseSurface';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  SettingsGear: SettingsGear,
  Clock: Clock,
  Layers: Layers,
  Circle: Circle,
  CheckCircle: CheckCircle,
  CalendarIcon: CalendarIcon,
  Inbox: Inbox,
};

const toSentenceCase = (str: string) => {
  if (!str) return '';
  const formatted = str.replace(/-/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};

interface TableViewProps {
  page: CustomPage;
  onUpdatePage: (page: CustomPage) => void;
  onItemClick: (itemId: string) => void;
}

export function TableView({ page, onUpdatePage, onItemClick }: TableViewProps) {
  const [activeTab, setActiveTab] = useState<string>(page.tabs[1]?.id || page.tabs[0]?.id);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerType, setIconPickerType] = useState<'tab' | 'column' | 'main' | 'item' | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState('');
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
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

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const filteredItems = page.items.filter(item => item.status === activeTab);

  const handleUpdateItem = (updatedItem: CustomPageItem) => {
    const newItems = page.items.map(item => item.id === updatedItem.id ? updatedItem : item);
    onUpdatePage({ ...page, items: newItems });
  };

  const handleNewItem = () => {
    const id = `item-${Date.now()}`;
    const newItem: CustomPageItem = {
      id,
      title: 'Untitled Item',
      icon: 'File',
      status: activeTab,
      priority: 'medium',
      progress: 0,
      properties: {}
    };
    onUpdatePage({ ...page, items: [...page.items, newItem] });
    onItemClick(id);
  };

  const handleRenameItem = () => {
    if (editingItemId && editingItemTitle.trim()) {
      const item = page.items.find(i => i.id === editingItemId);
      if (item) {
        handleUpdateItem({ ...item, title: editingItemTitle.trim() });
      }
    }
    setEditingItemId(null);
  };

  const handleAddTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newTabName.trim()) {
      const id = newTabName.toLowerCase().replace(/\s+/g, '-');
      if (!page.tabs.find(t => t.id === id)) {
        onUpdatePage({
          ...page,
          tabs: [...page.tabs, { id, label: newTabName.trim(), icon: 'Target' }]
        });
        setActiveTab(id);
      }
      setNewTabName('');
      setIsAddingTab(false);
    } else {
      setIsAddingTab(false);
    }
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        icon={
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId(page.id);
              setIconPickerType('main');
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className="flex h-full w-full items-center justify-center"
          >
            {React.createElement(iconMap[page.icon] || FileIcon, { className: "h-4 w-4" })}
          </button>
        }
        title={page.title}
        description="Database"
        count={page.items.length}
        actions={
          <>
            <SearchButton />
            <ToolButton><FilterIcon className="h-4 w-4" /></ToolButton>
            <ToolButton><Sort className="h-4 w-4" /></ToolButton>
            <PrimaryButton onClick={handleNewItem}><Plus className="h-4 w-4" /> New</PrimaryButton>
          </>
        }
      />

      <ViewTabs
        tabs={page.tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: React.createElement(iconMap[tab.icon] || Target, { className: "h-4 w-4" }),
          count: page.items.filter(item => item.status === tab.id).length,
        }))}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {/* Tabs & Toolbar */}
      <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-1">
        <Reorder.Group 
          as="div"
          ref={tabContainerRef}
          axis="x" 
          values={page.tabs} 
          onReorder={(newTabs) => onUpdatePage({ ...page, tabs: newTabs })}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {page.tabs.map(tab => {
            const Icon = iconMap[tab.icon] || Target;
            return (
              <Reorder.Item 
                key={tab.id}
                value={tab}
                data-tab-id={tab.id}
                drag="x"
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
                  activeTab === tab.id ? "bg-white/10 text-[#E8E6E1]" : "text-white/50 hover:bg-white/10 hover:text-[#E8E6E1]",
                  draggingId === tab.id ? "cursor-grabbing" : "cursor-pointer"
                )}
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
                  className="hover:bg-white/10 rounded p-0.5 transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4" />
                </button>
                {editingTabId === tab.id ? (
                  <input 
                    autoFocus
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={() => {
                      if (editingTabName.trim()) {
                        onUpdatePage({
                          ...page,
                          tabs: page.tabs.map(t => t.id === tab.id ? { ...t, label: editingTabName.trim() } : t)
                        });
                      }
                      setEditingTabId(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingTabId(null)}
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
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-blue-500/50 w-32"
              />
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingTab(true)}
              className="w-[34px] h-[34px] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </Reorder.Group>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/40">
            <button className="p-1.5 hover:text-white transition-colors"><FilterIcon className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Sort className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Lightning className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Search className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={handleNewItem}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            New
            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <DatabasePanel className="flex-1">
        <div className={cn("w-full h-full", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <table className="database-table min-w-[1000px] table-fixed text-left">
            <thead>
              <tr className="text-white/40 text-[12px] font-medium">
                {page.columns.map((col, index) => (
                  <th 
                    key={col.id} 
                    style={{ width: col.width }}
                    className={cn(
                      "px-4 py-2 border-b border-white/5 group/header whitespace-nowrap overflow-hidden",
                      index === 0 && "pl-[5px]"
                    )}
                  >
                    <div className="flex items-center gap-1 w-full overflow-hidden">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setIconPickerId(col.id);
                          setIconPickerType('column');
                          setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                        }}
                        className="w-6 h-6 rounded-lg transition-colors text-white/30 hover:text-white/60 flex items-center justify-center cursor-pointer shrink-0"
                      >
                        {React.createElement(iconMap[col.icon] || Target, { className: "w-4 h-4" })}
                      </button>
                      {editingColumnId === col.id ? (
                        <input
                          autoFocus
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
                          onBlur={() => {
                            if (editingColumnName.trim()) {
                              onUpdatePage({
                                ...page,
                                columns: page.columns.map(c => c.id === col.id ? { ...c, label: editingColumnName } : c)
                              });
                            }
                            setEditingColumnId(null);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingColumnId(null)}
                          className="bg-white/10 text-white pl-[7px] pr-[9px] h-8 rounded-lg outline-none text-sm font-medium border-none w-fit min-w-[60px]"
                        />
                      ) : (
                        <span 
                          className="capitalize cursor-pointer hover:bg-white/10 hover:text-[#E8E6E1] pl-[7px] pr-[9px] h-8 rounded-lg transition-colors text-sm font-medium inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis w-fit"
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
                <th className="px-6 py-2 border-b border-white/5 w-16 whitespace-nowrap text-right">
                </th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              values={filteredItems} 
              onReorder={(newItems) => {
                const otherItems = page.items.filter(i => i.status !== activeTab);
                onUpdatePage({ ...page, items: [...otherItems, ...newItems] });
              }}
              className="relative"
            >
              {filteredItems.map(item => (
                <Reorder.Item 
                  key={item.id} 
                  value={item}
                  as="tr"
                  layout="position"
                  onClick={() => {
                    if (isDraggingRef.current) return;
                    onItemClick(item.id);
                  }}
                  onDragStart={() => {
                    setDraggingId(item.id);
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
                      
                      if (droppedOnTabId && droppedOnTabId !== item.status) {
                        handleUpdateItem({ ...item, status: droppedOnTabId });
                      }
                    }
                  }}
                  className={cn(
                    "group transition-colors select-none cursor-pointer active:cursor-grabbing hover:bg-white/[0.02] whitespace-nowrap",
                    draggingId === item.id ? "cursor-grabbing bg-white/[0.04]" : ""
                  )}
                >
                  {page.columns.map((col, idx) => (
                    <td 
                      key={col.id}
                      style={{ width: col.width }}
                      className={cn(
                        "h-11 border-b border-white/5 whitespace-nowrap",
                        idx === 0 ? "pl-[5px] pr-4" : "px-4",
                        idx === 0 && "rounded-l-lg",
                        idx === page.columns.length - 1 && "rounded-r-lg"
                      )}
                    >
                      {col.id === 'title' ? (
                        <div className="flex items-center gap-1">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setIconPickerId(item.id);
                              setIconPickerType('item');
                              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                            }}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 shrink-0 cursor-pointer transition-colors"
                          >
                            {React.createElement(iconMap[item.icon || 'File'] || FileIcon, { className: "w-4 h-4" })}
                          </div>
                          {editingItemId === item.id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingItemTitle}
                              onChange={(e) => setEditingItemTitle(e.target.value)}
                              onBlur={handleRenameItem}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.key === 'Enter' && handleRenameItem()}
                              className="bg-transparent border-none outline-none text-sm text-[#E8E6E1] w-full"
                            />
                          ) : (
                            <span 
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingItemId(item.id);
                                setEditingItemTitle(item.title);
                              }}
                              className="text-[#E8E6E1]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[#E8E6E1] transition-colors"
                            >
                              {item.title}
                            </span>
                          )}
                        </div>
                      ) : col.id === 'status' ? (
                        <div className="flex items-center gap-1">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCustomDropdown({
                                id: item.id,
                                type: 'status',
                                pos: { x: rect.left, y: rect.bottom + 8 },
                                currentValue: item.status
                              });
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              item.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                              item.status === 'in-progress' || item.status === 'inbox' ? "bg-blue-500/20 text-blue-400" :
                              "bg-stone-500/20 text-stone-400"
                            )}
                          >
                            {toSentenceCase(item.status)}
                          </span>
                        </div>
                      ) : col.id === 'priority' ? (
                        <div className="flex items-center gap-1">
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setCustomDropdown({
                                id: item.id,
                                type: 'priority',
                                pos: { x: rect.left, y: rect.bottom + 8 },
                                currentValue: item.priority
                              });
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md font-medium text-xs cursor-pointer hover:opacity-80 transition-opacity",
                              item.priority === 'high' ? "bg-red-500/20 text-red-400" :
                              item.priority === 'medium' ? "bg-orange-500/20 text-orange-400" :
                              "bg-green-500/20 text-green-400"
                            )}
                          >
                            {toSentenceCase(item.priority)}
                          </span>
                        </div>
                      ) : col.id === 'date' ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDatePickerConfig({
                              id: item.id,
                              pos: { x: rect.left, y: rect.bottom + 8 },
                              currentDate: item.date ? new Date(item.date) : undefined
                            });
                          }}
                          className="relative flex items-center gap-1 text-white/40 text-[13px] cursor-pointer hover:text-white/60 transition-colors"
                        >
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <span className="">{item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'No date'}</span>
                        </div>
                      ) : col.id === 'progress' ? (
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0 text-yellow-500/60">
                            <Circle className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-950/30 text-yellow-500">
                            <span className="text-xs font-medium">{item.progress}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">{item.properties[col.id] || ''}</span>
                      )}
                    </td>
                  ))}
                </Reorder.Item>
              ))}
              <tr className="group">
                <td 
                  className="h-11 pl-[5px] pr-4 border-b border-white/5 whitespace-nowrap cursor-pointer hover:bg-white/[0.02] transition-colors rounded-l-lg"
                  onClick={handleNewItem}
                >
                  <div className="flex items-center gap-1 text-white/30 group-hover:text-white/50">
                    <Plus className="w-4 h-4" />
                    <span className="text-[14px]">New page</span>
                  </div>
                </td>
                <td colSpan={page.columns.length} className="h-11 border-b border-white/5 rounded-r-lg"></td>
              </tr>
            </Reorder.Group>
          </table>
        </div>
      </DatabasePanel>

      {/* Popovers */}
      <AnimatePresence>
        {customDropdown && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setCustomDropdown(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[140] bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
              }}
            >
              <div className="px-2.5 py-1.5 text-xs font-bold text-white/30 tracking-wider">
                Select {toSentenceCase(customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? page.tabs.map(t => t.id) : ['low', 'medium', 'high']).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const item = page.items.find(i => i.id === customDropdown.id);
                      if (item) {
                        handleUpdateItem({ ...item, [customDropdown.type]: option });
                      }
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group",
                      customDropdown.currentValue === option ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span>{toSentenceCase(option)}</span>
                    {customDropdown.currentValue === option && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {iconPickerId && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => { setIconPickerId(null); setIconPickerType(null); }} />
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
                    ? (page.tabs.find(t => t.id === iconPickerId)?.icon || 'Target')
                    : iconPickerType === 'main'
                      ? page.icon
                      : iconPickerType === 'item'
                        ? (page.items.find(i => i.id === iconPickerId)?.icon || 'File')
                        : (page.columns.find(c => c.id === iconPickerId)?.icon || 'Target')
                }
                onSelect={(iconName) => {
                  if (iconPickerType === 'tab') {
                    onUpdatePage({ ...page, tabs: page.tabs.map(t => t.id === iconPickerId ? { ...t, icon: iconName } : t) });
                  } else if (iconPickerType === 'main') {
                    onUpdatePage({ ...page, icon: iconName });
                  } else if (iconPickerType === 'item') {
                    onUpdatePage({ ...page, items: page.items.map(i => i.id === iconPickerId ? { ...i, icon: iconName } : i) });
                  } else {
                    onUpdatePage({ ...page, columns: page.columns.map(c => c.id === iconPickerId ? { ...c, icon: iconName } : c) });
                  }
                  setIconPickerId(null);
                  setIconPickerType(null);
                }}
                onClose={() => { setIconPickerId(null); setIconPickerType(null); }}
              />
            </div>
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
                  const item = page.items.find(i => i.id === datePickerConfig.id);
                  if (item) {
                    handleUpdateItem({ ...item, date: date.toISOString() });
                  }
                  setDatePickerConfig(null);
                }}
                onClose={() => setDatePickerConfig(null)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
    </WorkspacePage>
  );
}
