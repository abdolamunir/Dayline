import React, { useState, useRef, useEffect } from 'react';
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
import { getPriorityBadgeClasses } from '../utils/badges';
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
  const [selectedCell, setSelectedCell] = useState<{ itemId: string; columnId: string } | null>(null);
  const [fillDrag, setFillDrag] = useState<{ sourceItemId: string; columnId: string; targetItemId: string } | null>(null);
  const [resizingColumns, setResizingColumns] = useState<CustomPage['columns'] | null>(null);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerType, setIconPickerType] = useState<'tab' | 'column' | 'main' | 'item' | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
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
  const isFillDraggingRef = useRef(false);
  const fillDragRef = useRef<{ sourceItemId: string; columnId: string; targetItemId: string } | null>(null);
  const latestResizeColumnsRef = useRef<CustomPage['columns'] | null>(null);

  const filteredItems = page.items.filter(item => item.status === activeTab);
  const displayColumns = resizingColumns || page.columns;

  const handleUpdateItem = (updatedItem: CustomPageItem) => {
    const newItems = page.items.map(item => item.id === updatedItem.id ? updatedItem : item);
    onUpdatePage({ ...page, items: newItems });
  };

  const setActiveFillDrag = (drag: { sourceItemId: string; columnId: string; targetItemId: string } | null) => {
    fillDragRef.current = drag;
    setFillDrag(drag);
  };

  const isColumnFillable = (columnId: string) => columnId !== 'progress';

  const getColumnWidthNumber = (width?: string) => {
    const parsed = Number.parseFloat(width || '');
    return Number.isFinite(parsed) ? parsed : 160;
  };

  const startColumnResize = (event: React.PointerEvent, columnId: string, currentWidth?: string) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = getColumnWidthNumber(currentWidth);
    const initialColumns = displayColumns;
    latestResizeColumnsRef.current = initialColumns;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      const nextWidth = Math.max(96, Math.min(520, Math.round(startWidth + pointerEvent.clientX - startX)));
      const nextColumns = initialColumns.map(column => (
        column.id === columnId ? { ...column, width: `${nextWidth}px` } : column
      ));
      latestResizeColumnsRef.current = nextColumns;
      setResizingColumns(nextColumns);
    };

    const cleanup = () => {
      const finalColumns = latestResizeColumnsRef.current || initialColumns;
      setResizingColumns(null);
      latestResizeColumnsRef.current = null;
      onUpdatePage({ ...page, columns: finalColumns });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanup);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', cleanup);
  };

  useEffect(() => {
    if (!selectedCell) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-table-cell-item-id], .property-popover, [data-table-cell-fill-handle]')) return;
      setSelectedCell(null);
      setActiveFillDrag(null);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [selectedCell]);

  const getCellValue = (item: CustomPageItem, columnId: string) => {
    if (columnId === 'title') return item.title;
    if (columnId === 'status') return item.status;
    if (columnId === 'priority') return item.priority;
    if (columnId === 'date') return item.date;
    if (columnId === 'progress') return item.progress;
    return item.properties?.[columnId];
  };

  const withCellValue = (item: CustomPageItem, columnId: string, value: any): CustomPageItem => {
    if (columnId === 'title') return { ...item, title: String(value ?? '') };
    if (columnId === 'status') return { ...item, status: String(value ?? '') };
    if (columnId === 'priority') return { ...item, priority: value as CustomPageItem['priority'] };
    if (columnId === 'date') return { ...item, date: value };
    if (columnId === 'progress') return { ...item, progress: Number(value ?? 0) };
    return { ...item, properties: { ...item.properties, [columnId]: value } };
  };

  const getFillRangeItemIds = (drag = fillDrag) => {
    if (!drag) return [];

    const sourceIndex = filteredItems.findIndex(item => item.id === drag.sourceItemId);
    const targetIndex = filteredItems.findIndex(item => item.id === drag.targetItemId);
    if (sourceIndex < 0 || targetIndex < 0) return [];

    const [start, end] = [sourceIndex, targetIndex].sort((a, b) => a - b);
    return filteredItems.slice(start, end + 1).map(item => item.id);
  };

  const finishFillDrag = (drag = fillDragRef.current) => {
    if (!drag) return;

    const rangeIds = getFillRangeItemIds(drag);
    const sourceItem = page.items.find(item => item.id === drag.sourceItemId);
    if (sourceItem && rangeIds.length > 1) {
      const value = getCellValue(sourceItem, drag.columnId);
      onUpdatePage({
        ...page,
        items: page.items.map(item => (
          rangeIds.includes(item.id) ? withCellValue(item, drag.columnId, value) : item
        )),
      });
    }

    setActiveFillDrag(null);
    window.setTimeout(() => {
      isFillDraggingRef.current = false;
      isDraggingRef.current = false;
    }, 0);
  };

  const startFillDrag = (event: React.PointerEvent, sourceItemId: string, columnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isColumnFillable(columnId)) return;

    const sourceDrag = { sourceItemId, columnId, targetItemId: sourceItemId };
    isFillDraggingRef.current = true;
    isDraggingRef.current = true;
    setCustomDropdown(null);
    setDatePickerConfig(null);
    setSelectedCell({ itemId: sourceItemId, columnId });
    setActiveFillDrag(sourceDrag);

    const updateTargetFromPoint = (_clientX: number, clientY: number) => {
      const columnCells = Array.from(
        document.querySelectorAll<HTMLElement>('[data-table-cell-item-id][data-table-cell-column-id]')
      ).filter(cell => cell.dataset.tableCellColumnId === columnId);

      if (columnCells.length === 0) return;

      const targetCell = columnCells.reduce((closestCell, cell) => {
        const closestRect = closestCell.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        const closestDistance = Math.abs(clientY - (closestRect.top + closestRect.height / 2));
        const cellDistance = Math.abs(clientY - (cellRect.top + cellRect.height / 2));
        return cellDistance < closestDistance ? cell : closestCell;
      }, columnCells[0]);

      const targetItemId = targetCell.dataset.tableCellItemId;
      if (!targetItemId) return;

      setActiveFillDrag({
        sourceItemId,
        columnId,
        targetItemId,
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
      finishFillDrag();
    };

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Escape') return;
      cleanup();
      setActiveFillDrag(null);
      isFillDraggingRef.current = false;
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);
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

  const fillRangeItemIds = getFillRangeItemIds();
  const fillRangeItemIdSet = new Set(fillRangeItemIds);
  const tableWidth = displayColumns.reduce((total, column) => total + getColumnWidthNumber(column.width), 64);

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
      <div className="hidden flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)] pb-1">
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
                  draggingId === tab.id ? "cursor-grabbing" : "cursor-pointer"
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
                className="bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] rounded-lg px-3 py-1.5 text-sm font-medium text-white outline-none focus:border-blue-500/50 w-32"
              />
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingTab(true)}
              className="w-[34px] h-[34px] flex items-center justify-center text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] transition-colors rounded-lg hover:bg-[var(--tokyo-hover)] cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </Reorder.Group>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[var(--tokyo-text-faint)]">
            <button className="p-1.5 hover:text-white transition-colors"><FilterIcon className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Sort className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Lightning className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Search className="w-4 h-4" /></button>
            <button className="p-1.5 hover:text-white transition-colors"><Settings className="w-4 h-4" /></button>
          </div>
          <button 
            onClick={handleNewItem}
            className="bg-[var(--tokyo-yellow-dim)] hover:bg-[var(--tokyo-yellow)] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            New
            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <DatabasePanel className="flex-1">
        <div className={cn("w-full h-full", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <table className="database-table table-fixed text-left" style={{ width: `${tableWidth}px` }}>
            <colgroup>
              {displayColumns.map(column => (
                <col key={column.id} style={{ width: column.width }} />
              ))}
              <col style={{ width: '64px' }} />
            </colgroup>
            <thead>
              <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
                {displayColumns.map((col, index) => (
                  <th 
                    key={col.id} 
                    style={{ width: col.width }}
                    className={cn(
                      "relative px-4 py-2 border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-visible",
                      index === 0 && "pl-[5px]"
                    )}
                  >
                    <div className="flex items-center gap-0.5 w-full overflow-hidden pr-2">
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
                              onUpdatePage({
                                ...page,
                                columns: page.columns.map(c => c.id === col.id ? { ...c, label: editingColumnName } : c)
                              });
                            }
                            setEditingColumnId(null);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingColumnId(null)}
                          className="bg-[var(--tokyo-yellow-dim)] text-white pl-[7px] pr-[9px] h-8 rounded-lg outline-none text-sm font-medium border-none w-fit min-w-[60px]"
                        />
                      ) : (
                        <span 
                          className="capitalize cursor-pointer hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] px-1.5 h-8 rounded-lg transition-colors text-sm font-medium inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis w-fit"
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
                      aria-label={`Resize ${col.label} column`}
                      title="Drag to resize column"
                      onPointerDown={(e) => startColumnResize(e, col.id, col.width)}
                      style={{ cursor: 'col-resize' }}
                      className="absolute right-0 top-1/2 z-20 h-8 w-3 -translate-y-1/2 !cursor-col-resize touch-none before:pointer-events-none before:absolute before:left-1/2 before:top-1/2 before:h-5 before:w-px before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-transparent before:transition-all before:duration-150 hover:before:h-6 hover:before:w-[2px] hover:before:bg-[var(--tokyo-yellow)]"
                    />
                  </th>
                ))}
                <th className="px-6 py-2 border-b border-[var(--tokyo-border)] w-16 whitespace-nowrap text-right">
                </th>
              </tr>
            </thead>
            <tbody className="relative">
              {filteredItems.map(item => (
                <tr 
                  key={item.id} 
                  className="group transition-colors select-none hover:bg-white/[0.02] whitespace-nowrap"
                >
                  {displayColumns.map((col, idx) => {
                    const isCellSelected = selectedCell?.itemId === item.id && selectedCell.columnId === col.id;
                    const isFillColumn = fillDrag?.columnId === col.id;
                    const isInFillRange = isFillColumn && fillRangeItemIdSet.has(item.id);
                    const selectCell = () => setSelectedCell({ itemId: item.id, columnId: col.id });
                    const clearCellSelection = () => {
                      setSelectedCell(null);
                      setActiveFillDrag(null);
                    };

                    return (
                    <td 
                      key={col.id}
                      data-table-cell-item-id={item.id}
                      data-table-cell-column-id={col.id}
                      style={{ width: col.width }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectCell();
                      }}
                      className={cn(
                        "relative h-11 cursor-pointer border-b border-[var(--tokyo-border)] whitespace-nowrap transition-[background-color,box-shadow] duration-100 overflow-visible",
                        idx === 0 ? "pl-[5px] pr-4" : col.id === 'date' ? "pl-3 pr-1" : "px-4",
                        idx === 0 && "rounded-l-lg",
                        idx === displayColumns.length - 1 && "rounded-r-lg",
                        isCellSelected && "bg-[#1E90FF]/5 shadow-[inset_0_0_0_2px_#1E90FF]",
                        isInFillRange && !isCellSelected && "bg-[#1E90FF]/10 shadow-[inset_0_0_0_1px_rgba(30,144,255,0.48)]",
                        isFillColumn && fillDrag && "cursor-ns-resize"
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
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--tokyo-text-faint)] shrink-0 cursor-pointer transition-colors"
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
                              className="bg-transparent border-none outline-none text-sm text-[var(--tokyo-text-strong)] w-full"
                            />
                          ) : (
                            <span 
                              data-open-item-title="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearCellSelection();
                                if (isDraggingRef.current || isFillDraggingRef.current) return;
                                onItemClick(item.id);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingItemId(item.id);
                                setEditingItemTitle(item.title);
                              }}
                              className="text-[var(--tokyo-text-strong)]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
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
                              clearCellSelection();
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
                              item.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                              item.status === 'in-progress' || item.status === 'inbox' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
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
                              clearCellSelection();
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
                              getPriorityBadgeClasses(item.priority)
                            )}
                          >
                            {toSentenceCase(item.priority)}
                          </span>
                        </div>
                      ) : col.id === 'date' ? (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCellSelection();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDatePickerConfig({
                              id: item.id,
                              pos: { x: rect.left, y: rect.bottom + 8 },
                              currentDate: item.date ? new Date(item.date) : undefined
                            });
                          }}
                          className="relative inline-flex w-fit items-center gap-0.5 text-[var(--tokyo-text-faint)] text-[13px] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors"
                        >
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <CalendarIcon className="w-4 h-4" />
                          </div>
                          <span className="">{item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'No date'}</span>
                        </div>
                      ) : col.id === 'progress' ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCellSelection();
                          }}
                          className="flex items-center gap-1"
                        >
                          <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[var(--tokyo-yellow)]/60">
                            <Circle className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]">
                            <span className="text-xs font-medium">{item.progress}%</span>
                          </div>
                        </div>
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCellSelection();
                          }}
                          className="text-[var(--tokyo-text-faint)] text-sm"
                        >
                          {item.properties[col.id] || ''}
                        </span>
                      )}
                      {isCellSelected && isColumnFillable(col.id) && (
                        <button
                          type="button"
                          draggable={false}
                          data-table-cell-fill-handle="true"
                          title="Drag to fill this value down the column"
                          aria-label="Drag to fill this value down the column"
                          onPointerDownCapture={(e) => {
                            startFillDrag(e, item.id, col.id);
                          }}
                          onDragStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className={cn(
                            "absolute -bottom-2 -right-2 z-30 h-4 w-4 touch-none rounded-full border-[3px] border-[var(--tokyo-panel)] bg-[#1E90FF] shadow-[0_4px_12px_rgba(30,144,255,0.38)] transition-transform hover:scale-110 active:scale-95",
                            fillDrag ? "cursor-ns-resize" : "cursor-crosshair"
                          )}
                        />
                      )}
                    </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="group">
                <td 
                  className="h-11 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap cursor-pointer hover:bg-white/[0.02] transition-colors rounded-l-lg"
                  onClick={handleNewItem}
                >
                  <div className="flex items-center gap-1 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)]">
                    <Plus className="w-4 h-4" />
                    <span className="text-[14px]">New page</span>
                  </div>
                </td>
                <td colSpan={displayColumns.length} className="h-11 border-b border-[var(--tokyo-border)] rounded-r-lg"></td>
              </tr>
            </tbody>
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
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left group",
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
