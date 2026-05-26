import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Target01Icon as Target, 
  Add01Icon as Plus, 
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
  File01Icon as FileIcon,
  StarIcon as Star,
  Folder01Icon as FolderKanban
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { IconPicker, ALL_ICONS } from './IconPicker';
import { DatePicker, DateConfig } from './DatePicker';
import { format } from 'date-fns';
import { CustomPage, CustomPageItem } from '../types';
import { useAppStore } from '../store';
import { getPropertyTypeIcon } from '../utils/propertyTypes';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  SettingsGear: SettingsGear,
  Clock: Clock,
  Layers: Layers,
  Circle: Circle,
  CheckCircle: CheckCircle,
  CalendarIcon: CalendarIcon,
  Inbox: Inbox,
  LayoutGrid: LayoutGrid,
  FolderKanban: FolderKanban,
  File: FileIcon,
  Pencil: Pencil,
  Target: Target,
  Hash: Hash,
  Text: Text,
  List: List,
  Users: Users,
  User: User,
  Attachment: Attachment,
  Link: Link,
  AtSign: AtSign,
  Search: Search,
  Plus: Plus,
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

type TableSortConfig = { columnId: string; direction: 'asc' | 'desc' };
const DEFAULT_TABLE_SORT: TableSortConfig = { columnId: 'title', direction: 'asc' };

export function TableView({ page, onUpdatePage, onItemClick }: TableViewProps) {
  const { areas, user } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>(page.activeTab || page.tabs[1]?.id || page.tabs[0]?.id);
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
  const [editingTabName, setEditingTabName] = useState<string>('');
  const [localTabs, setLocalTabs] = useState(page.tabs);
  const latestTabsRef = useRef(page.tabs);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalTabs(page.tabs);
    }
  }, [page.tabs]);

  useEffect(() => {
    latestTabsRef.current = localTabs;
  }, [localTabs]);
  
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [columnContextMenu, setColumnContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'status' | 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const [areaDropdown, setAreaDropdown] = useState<{
    id: string;
    pos: { x: number; y: number };
    currentValue: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    id: string;
    pos: { x: number; y: number };
    currentDate?: Date;
    config?: DateConfig;
  } | null>(null);
  const [titleValue, setTitleValue] = useState(page.title);
  const [descriptionValue, setDescriptionValue] = useState(page.description || 'Database');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sortConfigs, setSortConfigs] = useState<TableSortConfig[]>(page.sortConfigs || []);
  const [sortPopoverPos, setSortPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const [sortPickerOpen, setSortPickerOpen] = useState<string | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [draggingColumnOffset, setDraggingColumnOffset] = useState(0);
  const [columnDropIndicatorX, setColumnDropIndicatorX] = useState<number | null>(null);

  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const titleEditRef = useRef<HTMLHeadingElement>(null);
  const descriptionEditRef = useRef<HTMLParagraphElement>(null);
  const isDraggingRef = useRef(false);
  const isFillDraggingRef = useRef(false);
  const fillDragRef = useRef<{ sourceItemId: string; columnId: string; targetItemId: string } | null>(null);
  const latestResizeColumnsRef = useRef<CustomPage['columns'] | null>(null);
  const latestColumnsRef = useRef<CustomPage['columns']>(page.columns);
  const suppressOpenUntilRef = useRef(0);

  const filteredItems = useMemo(() => (
    activeTab === 'all'
      ? page.items
      : page.items.filter(item => item.status === activeTab)
  ), [activeTab, page.items]);
  const baseColumns = resizingColumns || page.columns;
  const builtInColumnIds = useMemo(() => new Set(['title', 'status', 'priority', 'date', 'progress', 'creator', 'assigned', 'areas']), []);
  const propertyColumnIds = useMemo(() => new Set(page.properties.map(property => property.id)), [page.properties]);
  const validBaseColumns = useMemo(() => (
    baseColumns.filter(column => builtInColumnIds.has(column.id) || propertyColumnIds.has(column.id))
  ), [baseColumns, builtInColumnIds, propertyColumnIds]);
  const pagePropertyColumns: CustomPage['columns'] = useMemo(() => (
    page.properties.map(property => ({
      id: property.id,
      label: property.name,
      icon: property.icon || getPropertyTypeIcon(property.type),
      width: '180px',
    }))
  ), [page.properties]);
  const allColumns: CustomPage['columns'] = useMemo(() => [
    ...validBaseColumns,
    ...pagePropertyColumns.filter(propertyColumn => !validBaseColumns.some(column => column.id === propertyColumn.id)),
  ], [pagePropertyColumns, validBaseColumns]);
  const displayColumns = useMemo(() => (
    allColumns.filter(column => !column.hidden)
  ), [allColumns]);

  useEffect(() => {
    latestColumnsRef.current = displayColumns;
  }, [displayColumns]);

  useEffect(() => {
    setTitleValue(page.title);
  }, [page.title]);

  useEffect(() => {
    setDescriptionValue(page.description || 'Database');
  }, [page.description]);

  useEffect(() => {
    setSortConfigs(page.sortConfigs || []);
  }, [page.sortConfigs]);

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

  const handleUpdateItem = (updatedItem: CustomPageItem) => {
    const newItems = page.items.map(item => item.id === updatedItem.id ? updatedItem : item);
    onUpdatePage({ ...page, items: newItems });
  };

  const setActiveDatabaseTab = (tabId: string) => {
    setActiveTab(tabId);
    onUpdatePage({ ...page, activeTab: tabId });
  };

  const setActiveFillDrag = (drag: { sourceItemId: string; columnId: string; targetItemId: string } | null) => {
    fillDragRef.current = drag;
    setFillDrag(drag);
  };

  const isColumnFillable = (columnId: string) => columnId !== 'title' && columnId !== 'progress';

  const persistVisibleColumns = (nextVisibleColumns: CustomPage['columns']) => [
    ...nextVisibleColumns,
    ...allColumns.filter(column => column.hidden && !nextVisibleColumns.some(nextColumn => nextColumn.id === column.id)),
  ];

  const hideColumn = (columnId: string) => {
    if (columnId === 'title') return;
    onUpdatePage({
      ...page,
      columns: allColumns.map(column => column.id === columnId ? { ...column, hidden: true } : column),
    });
    setColumnContextMenu(null);
  };

  const deleteColumn = (columnId: string) => {
    if (columnId === 'title') return;

    const isBuiltInColumn = builtInColumnIds.has(columnId);
    const nextColumns = isBuiltInColumn
      ? allColumns.map(column => column.id === columnId ? { ...column, hidden: true } : column)
      : page.columns.filter(column => column.id !== columnId);
    const nextProperties = isBuiltInColumn
      ? page.properties
      : page.properties.filter(property => property.id !== columnId);
    const nextItems = isBuiltInColumn
      ? page.items
      : page.items.map(item => {
          const { [columnId]: _removedValue, ...properties } = item.properties || {};
          return { ...item, properties };
        });

    onUpdatePage({
      ...page,
      columns: nextColumns,
      properties: nextProperties,
      items: nextItems,
      sortConfigs: (page.sortConfigs || []).filter(sortConfig => sortConfig.columnId !== columnId),
    });
    setSortConfigs(currentSorts => currentSorts.filter(sortConfig => sortConfig.columnId !== columnId));
    setColumnContextMenu(null);
  };

  const showColumn = (columnId: string) => {
    onUpdatePage({
      ...page,
      columns: allColumns.map(column => column.id === columnId ? { ...column, hidden: false } : column),
    });
    setColumnContextMenu(null);
  };

  const updateColumn = (columnId: string, updates: Partial<CustomPage['columns'][number]>) => {
    const existingColumn = allColumns.find(column => column.id === columnId);
    const nextProperties = updates.label || updates.icon
      ? page.properties.map(property => (
          property.id === columnId
            ? { ...property, name: updates.label || property.name, icon: updates.icon || property.icon }
            : property
        ))
      : page.properties;
    onUpdatePage({
      ...page,
      columns: page.columns.some(column => column.id === columnId)
        ? page.columns.map(column => column.id === columnId ? { ...column, ...updates } : column)
        : existingColumn
          ? [...page.columns, { ...existingColumn, ...updates }]
          : page.columns,
      properties: nextProperties,
    });
  };

  const commitColumnName = (columnId: string) => {
    const nextName = editingColumnName.trim();
    if (nextName) updateColumn(columnId, { label: nextName });
    setEditingColumnId(null);
  };

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
      setResizingColumns(persistVisibleColumns(nextColumns));
    };

    const cleanup = () => {
      const finalColumns = latestResizeColumnsRef.current || initialColumns;
      setResizingColumns(null);
      latestResizeColumnsRef.current = null;
      onUpdatePage({ ...page, columns: persistVisibleColumns(finalColumns) });
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

  const getColumnMotionStyle = (column: CustomPage['columns'][number]) => ({
    width: column.width,
    x: draggingColumnId === column.id ? Math.round(draggingColumnOffset) : 0,
    zIndex: draggingColumnId === column.id ? 35 : 1,
  });

  const startColumnDrag = (event: React.PointerEvent, columnId: string) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('[data-column-control="true"]')) return;

    event.preventDefault();
    event.stopPropagation();

    const startColumns = latestColumnsRef.current;
    const draggedColumn = startColumns.find(column => column.id === columnId);
    const startIndex = startColumns.findIndex(column => column.id === columnId);
    if (!draggedColumn || startIndex < 0) return;

    const startX = event.clientX;
    const startLeft = startColumns
      .slice(0, startIndex)
      .reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
    const draggedColumnWidth = getColumnWidthNumber(draggedColumn.width);
    const tableRect = tableRef.current?.getBoundingClientRect();
    if (!tableRect) return;

    let latestOffset = 0;
    let animationFrameId: number | null = null;
    let lastRenderedIndicatorX: number | null = startLeft;

    const getDropTarget = (offset: number) => {
      const projectedCenter = startLeft + offset + draggedColumnWidth / 2;
      const remainingColumns = startColumns.filter(column => column.id !== columnId);
      const totalWidth = startColumns.reduce((total, column) => total + getColumnWidthNumber(column.width), 0);
      let targetIndex = remainingColumns.length;

      for (let index = 0; index < remainingColumns.length; index += 1) {
        const column = remainingColumns[index];
        const originalLeft = startColumns
          .slice(0, startColumns.findIndex(startColumn => startColumn.id === column.id))
          .reduce((total, startColumn) => total + getColumnWidthNumber(startColumn.width), 0);
        const columnCenter = originalLeft + getColumnWidthNumber(column.width) / 2;
        if (projectedCenter < columnCenter) {
          targetIndex = index;
          break;
        }
      }

      const targetColumn = remainingColumns[targetIndex];
      const indicatorX = targetColumn
        ? startColumns
            .slice(0, startColumns.findIndex(startColumn => startColumn.id === targetColumn.id))
            .reduce((total, startColumn) => total + getColumnWidthNumber(startColumn.width), 0)
        : totalWidth;

      return { targetIndex, indicatorX };
    };

    const renderDragUpdate = () => {
      animationFrameId = null;
      const roundedOffset = Math.round(latestOffset);
      const target = getDropTarget(roundedOffset);
      const indicatorX = Math.round(target.indicatorX);
      setDraggingColumnOffset(roundedOffset);
      if (lastRenderedIndicatorX !== indicatorX) {
        lastRenderedIndicatorX = indicatorX;
        setColumnDropIndicatorX(indicatorX);
      }
    };

    const scheduleDragUpdate = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(renderDragUpdate);
    };

    setDraggingColumnId(columnId);
    setDraggingColumnOffset(0);
    setColumnDropIndicatorX(startLeft);

    let hasMoved = false;

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      pointerEvent.preventDefault();
      latestOffset = pointerEvent.clientX - startX;
      if (Math.abs(latestOffset) > 3) hasMoved = true;
      scheduleDragUpdate();
    };

    const cleanup = (pointerEvent?: PointerEvent) => {
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      if (!hasMoved) {
        setDraggingColumnId(null);
        setDraggingColumnOffset(0);
        setColumnDropIndicatorX(null);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', cleanup);

        const target = pointerEvent?.target as HTMLElement | null;
        if (target?.closest('[data-column-label="true"]')) {
          setEditingColumnId(columnId);
          setEditingColumnName(draggedColumn.label);
        }
        return;
      }

      const remainingColumns = startColumns.filter(column => column.id !== columnId);
      const finalTarget = getDropTarget(Math.round(latestOffset));
      const nextColumns = [...remainingColumns];
      nextColumns.splice(finalTarget.targetIndex, 0, draggedColumn);
      const nextLeft = nextColumns
        .slice(0, finalTarget.targetIndex)
        .reduce((total, column) => total + getColumnWidthNumber(column.width), 0);

      setColumnDropIndicatorX(Math.round(finalTarget.indicatorX));
      setDraggingColumnOffset(Math.round(startLeft + latestOffset - nextLeft));
      latestColumnsRef.current = nextColumns;
      onUpdatePage({ ...page, columns: persistVisibleColumns(nextColumns) });

      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', cleanup);

      window.setTimeout(() => setColumnDropIndicatorX(null), 120);
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

  const getAreaLabel = (value: any) => {
    if (!value) return '';
    const stringValue = String(value);
    return areas.find(area => area.id === stringValue)?.name || stringValue || '';
  };

  const getPersonAvatar = (name?: string) => {
    const displayName = name || 'Abdola Munir';
    if (displayName === 'Abdola Munir' && user?.photoURL) return user.photoURL;
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(displayName.toLowerCase().replace(/\s+/g, '-'))}`;
  };

  const renderPersonCell = (name?: string) => {
    const displayName = name || 'Abdola Munir';
    return (
      <div className="flex min-w-0 items-center gap-2 text-[var(--tokyo-text-faint)]">
        <img
          src={getPersonAvatar(displayName)}
          className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/10"
          alt={displayName}
        />
        <span className="truncate text-sm font-medium">{displayName}</span>
      </div>
    );
  };

  const withCellValue = (item: CustomPageItem, columnId: string, value: any): CustomPageItem => {
    if (columnId === 'title') return { ...item, title: String(value ?? '') };
    if (columnId === 'status') return { ...item, status: String(value ?? '') };
    if (columnId === 'priority') return { ...item, priority: value as CustomPageItem['priority'] };
    if (columnId === 'date') return { ...item, date: value };
    if (columnId === 'progress') return { ...item, progress: Number(value ?? 0) };
    return { ...item, properties: { ...item.properties, [columnId]: value } };
  };

  const updateSortAt = (sortIndex: number, nextSort: TableSortConfig) => {
    const nextSorts = sortConfigs.map((sortConfig, index) => (
      index === sortIndex ? nextSort : sortConfig
    ));
    setSortConfigs(nextSorts);
    onUpdatePage({ ...page, sortConfigs: nextSorts });
  };

  const setPageSortConfigs = (nextSorts: TableSortConfig[]) => {
    setSortConfigs(nextSorts);
    onUpdatePage({ ...page, sortConfigs: nextSorts });
  };

  const getSortValue = (item: CustomPageItem, columnId: string) => {
    const value = getCellValue(item, columnId);
    if (columnId === 'priority') return ['low', 'medium', 'high'].indexOf(String(value));
    if (columnId === 'date') return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
    if (typeof value === 'number') return value;
    return String(value ?? '').toLowerCase();
  };

  const compareItemsBySort = (firstItem: CustomPageItem, secondItem: CustomPageItem, sortConfig: TableSortConfig) => {
    const firstValue = getSortValue(firstItem, sortConfig.columnId);
    const secondValue = getSortValue(secondItem, sortConfig.columnId);
    let result = 0;

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      result = firstValue - secondValue;
    } else {
      result = String(firstValue).localeCompare(String(secondValue), undefined, { numeric: true, sensitivity: 'base' });
    }

    return sortConfig.direction === 'asc' ? result : -result;
  };

  const visibleItems = useMemo(() => (
    sortConfigs.length > 0
      ? [...filteredItems].sort((firstItem, secondItem) => {
        for (const sortConfig of sortConfigs) {
          const result = compareItemsBySort(firstItem, secondItem, sortConfig);
          if (result !== 0) return result;
        }

        return 0;
      })
      : filteredItems
  ), [filteredItems, sortConfigs]);

  const getFillRangeItemIds = (drag = fillDrag) => {
    if (!drag) return [];

    const sourceIndex = visibleItems.findIndex(item => item.id === drag.sourceItemId);
    const targetIndex = visibleItems.findIndex(item => item.id === drag.targetItemId);
    if (sourceIndex < 0 || targetIndex < 0) return [];

    const [start, end] = [sourceIndex, targetIndex].sort((a, b) => a - b);
    return visibleItems.slice(start, end + 1).map(item => item.id);
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
    setAreaDropdown(null);
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
    const defaultStatus = activeTab === 'all' ? (page.tabs.find(tab => tab.id !== 'all')?.id || activeTab) : activeTab;
    const newItem: CustomPageItem = {
      id,
      title: 'Untitled Item',
      icon: 'File',
      status: defaultStatus,
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
        const nextTabs = [...page.tabs, { id, label: newTabName.trim(), icon: 'Target' }];
        onUpdatePage({
          ...page,
          tabs: nextTabs,
          activeTab: id,
        });
        setActiveTab(id);
      }
      setNewTabName('');
      setIsAddingTab(false);
    } else {
      setIsAddingTab(false);
    }
  };

  const handleDeleteTab = (tabId: string) => {
    if (page.tabs.length <= 1) return;

    const nextTabs = page.tabs.filter(tab => tab.id !== tabId);
    const fallbackTabId = nextTabs[0]?.id || activeTab;
    const nextActiveTab = activeTab === tabId ? fallbackTabId : activeTab;
    const nextItems = page.items.map(item => (
      item.status === tabId ? { ...item, status: fallbackTabId } : item
    ));

    setActiveTab(nextActiveTab);
    onUpdatePage({
      ...page,
      tabs: nextTabs,
      activeTab: nextActiveTab,
      items: nextItems,
    });
  };

  const handleRenameTab = (tabId: string) => {
    if (editingTabName.trim()) {
      const nextTabs = localTabs.map(tab => (
        tab.id === tabId ? { ...tab, label: editingTabName.trim() } : tab
      ));
      setLocalTabs(nextTabs);
      latestTabsRef.current = nextTabs;
      onUpdatePage({ ...page, tabs: nextTabs });
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const handleTabContextMenu = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setTabContextMenu({ x: event.clientX, y: event.clientY, id });
  };

  const handleItemContextMenu = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    setSelectedCell(null);
    setActiveFillDrag(null);
    setItemContextMenu({ x: event.clientX, y: event.clientY, id });
  };

  const handleColumnContextMenu = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    setColumnContextMenu({ x: event.clientX, y: event.clientY, id });
  };

  const duplicateItem = (itemId: string) => {
    const item = page.items.find(candidate => candidate.id === itemId);
    if (!item) return;

    const duplicate: CustomPageItem = {
      ...item,
      id: `item-${Date.now()}`,
      title: `${item.title} Copy`,
      properties: { ...item.properties },
    };
    const itemIndex = page.items.findIndex(candidate => candidate.id === itemId);
    const nextItems = [...page.items];
    nextItems.splice(itemIndex + 1, 0, duplicate);
    onUpdatePage({ ...page, items: nextItems });
  };

  const deleteItem = (itemId: string) => {
    onUpdatePage({ ...page, items: page.items.filter(item => item.id !== itemId) });
  };

  const getCompletedStatus = () => (
    page.tabs.find(tab => tab.id === 'completed')?.id ||
    page.tabs.find(tab => tab.id !== 'all')?.id ||
    page.tabs[0]?.id ||
    'completed'
  );

  const getActiveStatus = () => (
    page.tabs.find(tab => tab.id === 'active')?.id ||
    page.tabs.find(tab => tab.id === 'in-progress')?.id ||
    page.tabs.find(tab => tab.id !== 'all' && tab.id !== 'completed')?.id ||
    page.tabs[0]?.id ||
    'active'
  );

  const fillRangeItemIds = getFillRangeItemIds();
  const fillRangeItemIdSet = new Set(fillRangeItemIds);
  const tableWidth = useMemo(() => (
    displayColumns.reduce((total, column) => total + getColumnWidthNumber(column.width), 0)
  ), [displayColumns]);
  const isTabDragActive = page.tabs.some(tab => tab.id === draggingId);
  const handleRenamePage = () => {
    const nextTitle = titleValue.trim() || page.title;
    onUpdatePage({ ...page, title: nextTitle });
    setTitleValue(nextTitle);
    setIsEditingTitle(false);
  };
  const handleUpdateDescription = () => {
    onUpdatePage({ ...page, description: descriptionValue.trim() || 'Database' });
    setIsEditingDescription(false);
  };
  const handleCopyPageLink = async () => {
    const href = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#${page.id}` : '';
    if (href && navigator.clipboard) await navigator.clipboard.writeText(href);
    setIsShareMenuOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId(page.id);
              setIconPickerType('main');
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className="w-14 h-14 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-[var(--tokyo-hover)] transition-colors"
          >
            {React.createElement(iconMap[page.icon] || FileIcon, { className: "w-7 h-7" })}
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
                    setTitleValue(page.title);
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
                    setTitleValue(page.title);
                    setIsEditingTitle(false);
                  }
                }}
              >
                {isEditingTitle ? titleValue : page.title}
              </h1>
              <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border border-[var(--tokyo-border)] bg-[var(--tokyo-hover)] px-1.5 text-xs font-semibold text-[var(--tokyo-text-faint)]">
                {page.items.length}
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
                  setDescriptionValue(page.description || 'Database');
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
            onClick={() => void handleCopyPageLink()}
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
                <div className="dayline-share-menu absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                  <button className="dayline-share-menu-item flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--tokyo-border)] pb-2 -mx-4 px-4 md:-mx-8 md:px-8">
        <Reorder.Group
          as="div"
          ref={tabContainerRef}
          axis="x"
          values={localTabs}
          onReorder={setLocalTabs}
          className="hidden sm:flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {localTabs.map(tab => {
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
                  onUpdatePage({ ...page, tabs: latestTabsRef.current });
                  window.setTimeout(() => {
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
                  setActiveDatabaseTab(tab.id);
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
                    onBlur={() => {
                      handleRenameTab(tab.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameTab(tab.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    style={{ width: `${Math.max(1, tab.label.length)}ch` }}
                    className="min-w-0 bg-transparent border-none outline-none text-white"
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
            className={cn("p-2 rounded-lg transition-colors", sortConfigs.length > 0 ? "bg-[var(--tokyo-hover)] text-[var(--tokyo-yellow)]" : "hover:text-white")}
            title="Sort"
          >
            <Sort className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNewItem}
            className="ml-2 bg-[var(--tokyo-yellow-dim)] text-white px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 [stroke-width:2.4]" />
            New
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-visible">
        <div className={cn("-ml-6 h-full w-[calc(100%+1.5rem)] pl-6", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <div ref={tableRef} className="relative min-h-full overflow-visible" style={{ width: `${tableWidth}px` }}>
          <table className="text-left border-separate border-spacing-0 table-fixed" style={{ width: `${tableWidth}px` }}>
            <colgroup>
              {displayColumns.map(column => (
                <col key={column.id} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
                {displayColumns.map((col, index) => (
                  <motion.th
                    key={col.id} 
                    layout="position"
                    transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
                    style={getColumnMotionStyle(col)}
                    onPointerDown={(event) => startColumnDrag(event, col.id)}
                    onContextMenu={(event) => handleColumnContextMenu(event, col.id)}
                    className={cn(
                      "relative cursor-grab px-4 py-1 border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-visible active:cursor-grabbing",
                      index === 0 && "pl-[5px]"
                    )}
                  >
                    <div
                      className="flex items-center gap-0.5 w-full min-w-0 overflow-hidden pr-2"
                    >
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
                      {editingColumnId === col.id ? (
                        <input
                          data-column-control="true"
                          autoFocus
                          value={editingColumnName}
                          onChange={(e) => setEditingColumnName(e.target.value)}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => {
                            commitColumnName(col.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitColumnName(col.id);
                            if (e.key === 'Escape') setEditingColumnId(null);
                          }}
                          className="bg-[var(--tokyo-hover)] text-[var(--tokyo-text-strong)] px-2 h-7 rounded-md outline-none text-sm font-medium border border-[var(--tokyo-border)] min-w-0 w-full"
                        />
                      ) : (
                        <span 
                          data-column-label="true"
                          className="capitalize cursor-pointer text-[var(--tokyo-text-muted)]/80 hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] px-1 h-7 rounded-md transition-colors text-sm font-medium inline-flex min-w-0 max-w-full items-center whitespace-nowrap overflow-hidden text-ellipsis"
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
                        draggingColumnId && "pointer-events-none opacity-0"
                      )}
                    />
                  </motion.th>
                ))}
              </tr>
            </thead>
            <Reorder.Group
              as="tbody"
              axis="y"
              values={visibleItems}
              onReorder={(newItems) => {
                const visibleItemIds = new Set(visibleItems.map(item => item.id));
                const otherItems = page.items.filter(item => !visibleItemIds.has(item.id));
                onUpdatePage({ ...page, items: [...otherItems, ...newItems] });
              }}
              className="relative"
            >
              {visibleItems.map(item => (
                  <Reorder.Item
                  key={item.id} 
                  value={item}
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
                  onDragStart={() => {
                    setDraggingId(item.id);
                    isDraggingRef.current = true;
                    document.body.style.cursor = 'grabbing';
                    setSelectedCell(null);
                    setActiveFillDrag(null);
                  }}
                  onDragEnd={(_event, info) => {
                    setDraggingId(null);
                    setHoveredTabId(null);
                    suppressOpenUntilRef.current = Date.now() + 250;
                    document.body.style.cursor = '';
                    window.setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 80);

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

                    if (droppedOnTabId && droppedOnTabId !== item.status) {
                      handleUpdateItem({ ...item, status: droppedOnTabId });
                    }
                  }}
                  onContextMenu={(e) => handleItemContextMenu(e, item.id)}
                  className={cn(
                    "group cursor-grab transition-colors select-none whitespace-nowrap active:cursor-grabbing",
                    draggingId === item.id && [
                      "[&>td]:!border-b-transparent [&>td]:!bg-transparent [&>td]:!shadow-none",
                      "[&>td:not([data-table-cell-column-id='title'])>*]:opacity-0",
                      "[&>td[data-table-cell-column-id='title']]:relative [&>td[data-table-cell-column-id='title']]:z-20 [&>td[data-table-cell-column-id='title']]:rounded-lg [&>td[data-table-cell-column-id='title']]:!bg-[linear-gradient(135deg,rgba(216,170,21,0.82),rgba(163,126,10,0.72))]",
                      "[&>td[data-table-cell-column-id='title']]:!text-[var(--tokyo-text-strong)] [&>td[data-table-cell-column-id='title']]:backdrop-blur-[1px] [&>td[data-table-cell-column-id='title']]:shadow-[0_18px_44px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]",
                      "[&>td[data-table-cell-column-id='title']_*]:!text-[var(--tokyo-text-strong)]"
                    ]
                  )}
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
                    const propertyDefinition = page.properties.find(property => property.id === col.id);
                    const rawPropertyValue = item.properties[col.id];
                    const formattedPropertyValue = propertyDefinition?.type === 'date' && rawPropertyValue
                      ? format(new Date(rawPropertyValue), 'MMM d, yyyy')
                      : rawPropertyValue;
                    const isPersonProperty = propertyDefinition?.type === 'person'
                      || propertyDefinition?.type === 'created-by'
                      || propertyDefinition?.type === 'last-edited-by';

                    return (
                    <motion.td
                      key={col.id}
                      layout="position"
                      transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
                      data-table-cell-item-id={item.id}
                      data-table-cell-column-id={col.id}
                      style={getColumnMotionStyle(col)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (col.id === 'title') {
                          clearCellSelection();
                          if (isDraggingRef.current || isFillDraggingRef.current || Date.now() < suppressOpenUntilRef.current) return;
                          onItemClick(item.id);
                          return;
                        }
                        selectCell();
                      }}
                      className={cn(
                        "relative h-12 cursor-pointer border-b border-[var(--tokyo-border)] whitespace-nowrap transition-[background-color,box-shadow] duration-100 overflow-visible group-hover:bg-white/[0.02]",
                        idx === 0 ? "pl-[5px] pr-4" : col.id === 'date' ? "pl-4 pr-1" : "px-4",
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
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameItem();
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                              className="bg-transparent border-none outline-none text-sm leading-5 font-medium text-[var(--tokyo-text-strong)]/70 w-full"
                            />
                          ) : (
                            <span 
                              data-open-item-title="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearCellSelection();
                                setEditingItemId(item.id);
                                setEditingItemTitle(item.title);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingItemId(item.id);
                                setEditingItemTitle(item.title);
                              }}
                              className="text-[var(--tokyo-text-strong)]/70 font-medium text-sm leading-5 cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
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
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              item.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                              item.status === 'active' || item.status === 'in-progress' || item.status === 'inbox' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                              item.status === 'planning' ? "bg-stone-500/20 text-stone-400" :
                              "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
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
                              "inline-flex items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                              getPriorityBadgeClasses(item.priority)
                            )}
                          >
                            {toSentenceCase(item.priority)}
                          </span>
                        </div>
                      ) : col.id === 'areas' ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCellSelection();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAreaDropdown({
                              id: item.id,
                              pos: { x: rect.left, y: rect.bottom + 8 },
                              currentValue: String(item.properties?.[col.id] || '')
                            });
                          }}
                          className="relative flex items-center"
                        >
                          <span className="inline-flex max-w-full items-center px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity bg-[var(--tokyo-hover)] text-[var(--tokyo-text-muted)]">
                            <span className="max-w-[140px] overflow-hidden text-ellipsis">
                              {getAreaLabel(item.properties?.[col.id])}
                            </span>
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
                          className="flex w-full cursor-pointer items-center gap-2"
                        >
                          <span className="inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-md bg-[rgba(154,214,139,0.08)] px-1.5 text-xs font-medium text-[var(--tokyo-green)]">
                            {item.progress}%
                          </span>
                          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[rgba(154,214,139,0.14)]">
                            <div
                              className="h-full rounded-full bg-[var(--tokyo-green)] transition-[width] duration-200 ease-out"
                              style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                            />
                          </div>
                        </div>
                      ) : col.id === 'assigned' || col.id === 'creator' || isPersonProperty ? (
                        renderPersonCell(
                          col.id === 'creator' || propertyDefinition?.type === 'created-by' || propertyDefinition?.type === 'last-edited-by'
                            ? 'Abdola Munir'
                            : String(formattedPropertyValue || 'Unassigned')
                        )
                      ) : (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            clearCellSelection();
                          }}
                          className="text-[var(--tokyo-text-faint)] text-sm"
                        >
                          {formattedPropertyValue || ''}
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
                    </motion.td>
                    );
                  })}
                </Reorder.Item>
              ))}
              <tr className="group">
                {displayColumns.map(column => (
                  column.id === 'title' ? (
                    <motion.td
                      key={column.id}
                      layout="position"
                      transition={{ layout: { duration: 0.16, ease: [0.23, 1, 0.32, 1] as const } }}
                      style={getColumnMotionStyle(column)}
                      className="h-12 pl-[5px] pr-4 border-b border-[var(--tokyo-border)] whitespace-nowrap cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={handleNewItem}
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

      {/* Popovers */}
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
                onClick={() => hideColumn(columnContextMenu.id)}
                className="flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-left font-medium text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Hide column
              </button>
              <button
                type="button"
                disabled={columnContextMenu.id === 'title'}
                onClick={() => deleteColumn(columnContextMenu.id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-[var(--tokyo-pink)] transition-colors hover:bg-[rgba(255,77,125,0.12)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
                Delete column
              </button>
              {allColumns.some(column => column.hidden) && (
                <div className="mt-1 border-t border-[var(--tokyo-border)] pt-1">
                  <div className="px-2.5 py-1 text-[11px] font-medium text-[var(--tokyo-text-faint)]">Hidden columns</div>
                  {allColumns.filter(column => column.hidden).map(column => (
                    <button
                      key={column.id}
                      type="button"
                      onClick={() => showColumn(column.id)}
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
                    setPageSortConfigs([]);
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
                      const sortColumn = displayColumns.find(column => column.id === sortConfig.columnId) || displayColumns[0];

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
                                {displayColumns.map(column => (
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
                            onClick={() => setPageSortConfigs(sortConfigs.filter((_, sortIndex) => sortIndex !== index))}
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
                    setPageSortConfigs([...sortConfigs, { columnId: displayColumns[0]?.id || DEFAULT_TABLE_SORT.columnId, direction: DEFAULT_TABLE_SORT.direction }]);
                    setSortPickerOpen(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Sort</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPageSortConfigs([])}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-[var(--tokyo-text-muted)] transition-colors hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete sort</span>
                </button>
              </div>
            </motion.div>
          </>
        )}

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
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="fixed z-[140] w-48 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 text-[13px] shadow-2xl"
              style={{
                top: Math.min(tabContextMenu.y, window.innerHeight - 100),
                left: Math.min(tabContextMenu.x, window.innerWidth - 200),
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const tab = localTabs.find(candidate => candidate.id === tabContextMenu.id);
                  if (tab) {
                    setEditingTabId(tab.id);
                    setEditingTabName(tab.label);
                  }
                  setTabContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <Pencil className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  const tab = localTabs.find(candidate => candidate.id === tabContextMenu.id);
                  if (tab) {
                    setIconPickerId(tab.id);
                    setIconPickerType('tab');
                    setIconPickerPos({ x: tabContextMenu.x, y: tabContextMenu.y });
                  }
                  setTabContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <Smile className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                Change Icon
              </button>
              <div className="my-1 h-px bg-[var(--tokyo-border)]" />
              <button
                type="button"
                onClick={() => {
                  handleDeleteTab(tabContextMenu.id);
                  setTabContextMenu(null);
                }}
                disabled={page.tabs.length <= 1}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-pink)] transition-colors hover:bg-[rgba(255,77,125,0.12)] disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </motion.div>
          </>
        )}

        {itemContextMenu && (
          <>
            <div
              className="fixed inset-0 z-[130]"
              onClick={() => setItemContextMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setItemContextMenu(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="fixed z-[140] w-60 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 text-[13px] shadow-2xl"
              style={{
                top: Math.min(itemContextMenu.y, window.innerHeight - 220),
                left: Math.min(itemContextMenu.x, window.innerWidth - 252),
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const item = page.items.find(candidate => candidate.id === itemContextMenu.id);
                  if (item) {
                    setEditingItemId(item.id);
                    setEditingItemTitle(item.title);
                  }
                  setItemContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <Pencil className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  setIconPickerId(itemContextMenu.id);
                  setIconPickerType('item');
                  setIconPickerPos({ x: itemContextMenu.x, y: itemContextMenu.y });
                  setItemContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <Smile className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                Change Icon
              </button>
              <div className="my-1 h-px bg-[var(--tokyo-border)]" />
              <button
                type="button"
                onClick={() => {
                  const item = page.items.find(candidate => candidate.id === itemContextMenu.id);
                  if (item) {
                    const completedStatus = getCompletedStatus();
                    handleUpdateItem({
                      ...item,
                      status: item.status === completedStatus ? getActiveStatus() : completedStatus,
                    });
                  }
                  setItemContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <CheckCircle className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                {page.items.find(candidate => candidate.id === itemContextMenu.id)?.status === getCompletedStatus() ? 'Mark as Active' : 'Mark as Completed'}
              </button>
              <button
                type="button"
                onClick={() => {
                  duplicateItem(itemContextMenu.id);
                  setItemContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
              >
                <Copy className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                Duplicate Page
              </button>
              <div className="my-1 h-px bg-[var(--tokyo-border)]" />
              <button
                type="button"
                onClick={() => {
                  deleteItem(itemContextMenu.id);
                  setItemContextMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-1.5 text-left text-[var(--tokyo-pink)] transition-colors hover:bg-[rgba(255,77,125,0.12)]"
              >
                <Trash2 className="h-4 w-4" />
                Delete Page
              </button>
            </motion.div>
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

        {areaDropdown && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setAreaDropdown(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="property-popover fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-lg shadow-2xl p-1 w-48 overflow-hidden text-[13px]"
              style={{
                top: Math.min(areaDropdown.pos.y, window.innerHeight - 200),
                left: Math.min(areaDropdown.pos.x, window.innerWidth - 200)
              }}
            >
              <div className="property-popover-heading px-2.5 py-1 font-bold text-[var(--tokyo-text-faint)] tracking-normal">
                Select Area
              </div>
              <div className="space-y-0.5">
                {areas.map(area => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      const item = page.items.find(candidate => candidate.id === areaDropdown.id);
                      if (item) handleUpdateItem(withCellValue(item, 'areas', area.id));
                      setAreaDropdown(null);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors",
                      areaDropdown.currentValue === area.id || areaDropdown.currentValue === area.name
                        ? "bg-[var(--tokyo-yellow-dim)] text-white"
                        : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                    )}
                  >
                    <span className="truncate">{area.name}</span>
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
                    ? (localTabs.find(t => t.id === iconPickerId)?.icon || 'Target')
                    : iconPickerType === 'main'
                      ? page.icon
                      : iconPickerType === 'item'
                        ? (page.items.find(i => i.id === iconPickerId)?.icon || 'File')
                        : (displayColumns.find(c => c.id === iconPickerId)?.icon || 'Target')
                }
                onSelect={(iconName) => {
                  if (iconPickerType === 'tab') {
                    const nextTabs = localTabs.map(t => t.id === iconPickerId ? { ...t, icon: iconName } : t);
                    setLocalTabs(nextTabs);
                    latestTabsRef.current = nextTabs;
                    onUpdatePage({ ...page, tabs: nextTabs });
                  } else if (iconPickerType === 'main') {
                    onUpdatePage({ ...page, icon: iconName });
                  } else if (iconPickerType === 'item') {
                    onUpdatePage({ ...page, items: page.items.map(i => i.id === iconPickerId ? { ...i, icon: iconName } : i) });
                  } else {
                    updateColumn(iconPickerId, { icon: iconName });
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
