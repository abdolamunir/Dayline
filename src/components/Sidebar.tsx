import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home01Icon as Home, Search01Icon as Search, Notification01Icon as Bell, Settings01Icon as Settings, Add01Icon as Plus, Message02Icon as MessageSquare, Calendar01Icon as CalendarIcon, InboxIcon as Inbox, PencilEdit01Icon as Pencil, CheckmarkCircle02Icon as CheckCircle2, Target01Icon as Target, Layers01Icon as Layers, Activity01Icon as Activity, SmileIcon as Smile, StethoscopeIcon as Stethoscope, Book01Icon as Book, FeatherIcon as Feather, Folder01Icon as Folder, Dumbbell01Icon as Dumbbell, Restaurant01Icon as Utensils, ShoppingCart01Icon as ShoppingCart, Bookmark01Icon as Bookmark, Airplane01Icon as Plane, LibraryIcon as Library, ShoppingBag01Icon as ShoppingBag, PlayCircle02Icon as MonitorPlay, UserGroupIcon as Users, File01Icon as File, ArrowLeft01Icon as ChevronLeft, ArrowRight01Icon as ChevronRight, StarIcon as Star, Calendar02Icon as CalendarDays, Archive01Icon as Archive, Book02Icon as BookCheck, MoreHorizontalIcon as MoreHorizontal, Delete02Icon as Trash2, Edit02Icon as Edit2, Time02Icon as History, ArrowLeft01Icon as ArrowLeft, ArrowRight01Icon as ArrowRight, SidebarLeftIcon as PanelLeft, ArrowDown01Icon as ChevronDown, Edit01Icon as SquarePen, SidebarLeftIcon as SidebarIcon, DashboardSquare01Icon as LayoutDashboard, DeliveryBox01Icon as Box, DatabaseIcon as Database, Plug01Icon as Plug, Clock01Icon as Clock, File02Icon as FileText, LockIcon as Lock, Shield01Icon as Shield, Wallet01Icon as Wallet, Download01Icon as Download, Upload01Icon as Upload, UserIcon as User, Logout01Icon as LogOut, HelpCircleIcon as HelpCircle, KeyboardIcon as Keyboard, CommandIcon as Command, Moon01Icon as Moon, Copy01Icon as Copy } from 'hugeicons-react';
import { cn } from '../utils/cn';
import { useAppStore } from '../store';
import { IconPicker, ALL_ICONS } from './IconPicker';
import { logout, signInWithGoogle } from '../firebase';

export type ViewType = string;

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCommandPalette: (initialValue?: string, mode?: 'default' | 'create') => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Calendar: CalendarIcon,
};

export function Sidebar({ currentView, onViewChange, onOpenCommandPalette, isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, onToggleSidebar }: SidebarProps) {
  const { 
    customPages,
    sidebarItems, 
    reorderSidebarItems, 
    addCustomPage, 
    deleteSidebarItem, 
    updateSidebarItem, 
    duplicateSidebarItem,
    addFolder,
    toggleFolderExpansion,
    moveSidebarItem,
    trash,
    user
  } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'item' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const newItemMenuRef = useRef<HTMLDivElement>(null);
  const hiddenSidebarRowStylesRef = useRef(new Map<HTMLElement, { display: string, pointerEvents: string }>());
  const [selectedSidebarItemIds, setSelectedSidebarItemIds] = useState<string[]>([]);
  const [lastSelectedSidebarItemId, setLastSelectedSidebarItemId] = useState<string | null>(null);
  const [draggingSidebarItemIds, setDraggingSidebarItemIds] = useState<string[]>([]);
  const [primaryDraggingSidebarItemId, setPrimaryDraggingSidebarItemId] = useState<string | null>(null);

  const restoreHiddenSidebarRows = () => {
    hiddenSidebarRowStylesRef.current.forEach((styles, element) => {
      element.style.display = styles.display;
      element.style.pointerEvents = styles.pointerEvents;
    });
    hiddenSidebarRowStylesRef.current.clear();
  };

  const hideNonHeldSelectedSidebarRows = (ids: string[], heldId: string) => {
    restoreHiddenSidebarRows();

    const idsToHide = new Set(ids.filter(id => id !== heldId));
    if (idsToHide.size === 0) return;

    document.querySelectorAll<HTMLElement>('[data-sidebar-item-id]').forEach((element) => {
      const itemId = element.dataset.sidebarItemId;
      if (!itemId || !idsToHide.has(itemId)) return;

      hiddenSidebarRowStylesRef.current.set(element, {
        display: element.style.display,
        pointerEvents: element.style.pointerEvents,
      });
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newItemMenuRef.current && !newItemMenuRef.current.contains(event.target as Node)) {
        setIsNewItemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedSidebarItemIds.length === 0) return;

    const handleDeselect = (event: PointerEvent) => {
      if (event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-sidebar-item-id]')) return;
      setSelectedSidebarItemIds([]);
      setLastSelectedSidebarItemId(null);
    };

    document.addEventListener('pointerdown', handleDeselect);
    return () => document.removeEventListener('pointerdown', handleDeselect);
  }, [selectedSidebarItemIds.length]);

  useEffect(() => {
    const resetDragState = () => {
      restoreHiddenSidebarRows();
      setDraggingSidebarItemIds([]);
      setPrimaryDraggingSidebarItemId(null);
      document.body.style.cursor = '';
    };

    window.addEventListener('dragend', resetDragState);
    window.addEventListener('drop', resetDragState);
    return () => {
      window.removeEventListener('dragend', resetDragState);
      window.removeEventListener('drop', resetDragState);
      restoreHiddenSidebarRows();
      document.body.style.cursor = '';
    };
  }, []);

  // Removed global click listener in favor of transparent overlay

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'item' = 'item') => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + 32;
    let y = rect.bottom;
    
    const menuHeight = type === 'item' ? 160 : 80;
    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight;
    }
      
    setContextMenu({ x, y, id, type });
  };

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim()) {
      updateSidebarItem(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleProfileClick = async () => {
    if (user) {
      setIsProfileOpen(!isProfileOpen);
      return;
    }

    if (isAuthBusy) {
      return;
    }

    try {
      setIsAuthBusy(true);
      setAuthError('');
      await signInWithGoogle();
      setIsProfileOpen(false);
    } catch (error: any) {
      console.error('Unable to sign in with Google.', error);
      const currentDomain = window.location.hostname;
      setAuthError(error?.code === 'auth/unauthorized-domain'
        ? `Add ${currentDomain} in Firebase Auth domains.`
        : 'Google sign-in could not start. Try again.');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (isAuthBusy) {
      return;
    }

    try {
      setIsAuthBusy(true);
      setAuthError('');
      await logout();
      setIsProfileOpen(false);
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleNewDatabasePage = () => {
    const newId = `page-${Date.now()}`;
    addCustomPage({
      id: newId,
      title: 'Untitled',
      icon: 'Target',
      description: 'Track and manage your long-term objectives.',
      kind: 'database',
      activeTab: 'planning',
      tabs: [
        { id: 'planning', label: 'Planning', icon: 'Clock' },
        { id: 'active', label: 'Active', icon: 'Target' },
        { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
        { id: 'paused', label: 'Paused', icon: 'Circle' },
      ],
      columns: [
        { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
        { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
        { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
        { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
        { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
        { id: 'creator', label: 'Creator', icon: 'User', width: '180px' },
      ],
      sortConfigs: [],
      items: [],
      properties: [],
      content: ''
    });
    onViewChange(newId);
  };

  const handleNewDocumentPage = () => {
    const newId = `page-${Date.now()}`;
    addCustomPage({
      id: newId,
      title: 'Untitled doc',
      icon: 'FileText',
      kind: 'document',
      tabs: [],
      columns: [],
      items: [],
      properties: [],
      content: ''
    });
    onViewChange(newId);
  };

  const handleNewFolder = () => {
    const newId = `folder-${Date.now()}`;
    addFolder({
      id: newId,
      label: 'New Folder',
      icon: 'Folder',
      type: 'folder',
      isExpanded: true
    });
    setEditingId(newId);
    setEditValue('New Folder');
    setIsNewItemMenuOpen(false);
  };

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'middle' | null>(null);

  const isMultiSelectableSidebarItem = (id: string) => {
    const item = sidebarItems.find(sidebarItem => sidebarItem.id === id);
    return Boolean(item && item.type !== 'folder' && item.type !== 'trash');
  };

  const handleSidebarItemPointerDown = (e: React.PointerEvent, id: string, isFolder: boolean) => {
    if (e.button !== 0 || e.shiftKey || editingId === id || isFolder) return;
    if (!selectedSidebarItemIds.includes(id) || selectedSidebarItemIds.length <= 1) return;

    hideNonHeldSelectedSidebarRows(selectedSidebarItemIds, id);
    flushSync(() => {
      setDraggingSidebarItemIds(selectedSidebarItemIds);
      setPrimaryDraggingSidebarItemId(id);
    });
  };

  const resetSidebarDragPreviewState = () => {
    restoreHiddenSidebarRows();
    setDraggingSidebarItemIds([]);
    setPrimaryDraggingSidebarItemId(null);
    document.body.style.cursor = '';
  };

  const handleSidebarItemClick = (e: React.MouseEvent, id: string, isFolder: boolean) => {
    if (editingId === id) return;

    if (e.shiftKey && isMultiSelectableSidebarItem(id)) {
      e.preventDefault();
      e.stopPropagation();

      const selectableIds = sidebarItems
        .filter(item => isMultiSelectableSidebarItem(item.id))
        .map(item => item.id);
      const currentIndex = selectableIds.indexOf(id);
      const anchorId = lastSelectedSidebarItemId || (isMultiSelectableSidebarItem(currentView) ? currentView : null);
      const lastIndex = anchorId ? selectableIds.indexOf(anchorId) : -1;

      if (lastIndex >= 0 && currentIndex >= 0 && anchorId !== id) {
        const [start, end] = [lastIndex, currentIndex].sort((a, b) => a - b);
        const rangeIds = selectableIds.slice(start, end + 1);
        setSelectedSidebarItemIds(prev => Array.from(new Set([...prev, ...rangeIds])));
      } else {
        setSelectedSidebarItemIds(prev => (
          prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        ));
      }

      setLastSelectedSidebarItemId(id);
      return;
    }

    resetSidebarDragPreviewState();
    setSelectedSidebarItemIds([]);
    setLastSelectedSidebarItemId(isMultiSelectableSidebarItem(id) ? id : null);

    if (isFolder) {
      toggleFolderExpansion(id);
    } else {
      onViewChange(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    const draggedIds = selectedSidebarItemIds.includes(id) ? selectedSidebarItemIds : [id];
    hideNonHeldSelectedSidebarRows(draggedIds, id);
    flushSync(() => {
      setDraggingSidebarItemIds(draggedIds);
      setPrimaryDraggingSidebarItemId(id);
    });
    document.body.style.cursor = 'pointer';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/dayline-sidebar-items', JSON.stringify(draggedIds));
    e.dataTransfer.effectAllowed = 'move';

    if (draggedIds.length > 1) {
      const sourceItem = sidebarItems.find(item => item.id === id);
      const rowRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const dragPreview = document.createElement('div');
      dragPreview.style.position = 'fixed';
      dragPreview.style.top = '-1000px';
      dragPreview.style.left = '-1000px';
      dragPreview.style.width = `${Math.max(190, Math.min(rowRect.width, 260))}px`;
      dragPreview.style.height = '42px';
      dragPreview.style.pointerEvents = 'none';
      dragPreview.style.transform = 'translateZ(0)';
      const backLayer = document.createElement('div');
      backLayer.style.cssText = 'position:absolute;inset:8px 0 0 12px;border-radius:10px;background:#6E5608;border:1px solid rgba(255,226,145,0.28);transform:rotate(4deg);';
      const middleLayer = document.createElement('div');
      middleLayer.style.cssText = 'position:absolute;inset:4px 0 4px 7px;border-radius:10px;background:#A9820B;border:1px solid rgba(255,234,170,0.34);transform:rotate(2deg);';
      const frontLayer = document.createElement('div');
      frontLayer.style.cssText = 'position:absolute;inset:0 7px 8px 0;display:flex;align-items:center;gap:10px;border-radius:10px;background:linear-gradient(135deg,#D6A611,#9C7809);border:1px solid rgba(255,239,186,0.52);box-shadow:0 18px 42px rgba(0,0,0,0.34),0 1px 0 rgba(255,255,255,0.22) inset;color:#fff;font:700 13px var(--font-sans);padding:0 10px 0 12px;';
      const accent = document.createElement('span');
      accent.style.cssText = 'width:7px;height:22px;border-radius:999px;background:#FFE08A;box-shadow:0 0 18px rgba(255,224,138,0.42);';
      const label = document.createElement('span');
      label.textContent = sourceItem?.label || 'Selected pages';
      label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;';
      const count = document.createElement('span');
      count.textContent = String(draggedIds.length);
      count.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;height:22px;min-width:28px;padding:0 8px;border-radius:999px;background:#FFE08A;color:#2A1E05;font-weight:800;';
      frontLayer.append(accent, label, count);
      dragPreview.append(backLayer, middleLayer, frontLayer);
      document.body.appendChild(dragPreview);
      e.dataTransfer.setDragImage(dragPreview, 22, 18);
      window.setTimeout(() => dragPreview.remove(), 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (id) {
      setDragOverId(id);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      
      const item = sidebarItems.find(i => i.id === id);
      if (item?.type === 'folder') {
        if (y < height * 0.25) setDropPosition('top');
        else if (y > height * 0.75) setDropPosition('bottom');
        else setDropPosition('middle');
      } else {
        if (y < height / 2) setDropPosition('top');
        else setDropPosition('bottom');
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we are leaving the element, not entering a child
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setDragOverId(null);
      setDropPosition(null);
    }
  };

  const handleDragEnd = () => {
    restoreHiddenSidebarRows();
    setDragOverId(null);
    setDropPosition(null);
    setDraggingSidebarItemIds([]);
    setPrimaryDraggingSidebarItemId(null);
    setSelectedSidebarItemIds([]);
    setLastSelectedSidebarItemId(null);
    document.body.style.cursor = '';
  };

  const handleDrop = (e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentDropPosition = dropPosition;
    restoreHiddenSidebarRows();
    setDragOverId(null);
    setDropPosition(null);
    setDraggingSidebarItemIds([]);
    setPrimaryDraggingSidebarItemId(null);
    setSelectedSidebarItemIds([]);
    setLastSelectedSidebarItemId(null);
    document.body.style.cursor = '';
    
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedIds = (() => {
      try {
        const parsed = JSON.parse(e.dataTransfer.getData('application/dayline-sidebar-items') || '[]');
        return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
      } catch {
        return [];
      }
    })();
    const idsToMove = (draggedIds.length ? draggedIds : [draggedId])
      .filter((id, index, ids) => id && ids.indexOf(id) === index);

    if (!draggedId || idsToMove.length === 0 || (targetId && idsToMove.includes(targetId))) return;

    // Prevent dropping a folder into its own descendant
    const isDescendant = (parent: string, potentialChild: string): boolean => {
      const item = sidebarItems.find(i => i.id === potentialChild);
      if (!item || !item.parentId) return false;
      if (item.parentId === parent) return true;
      return isDescendant(parent, item.parentId);
    };

    if (targetId && idsToMove.some(id => isDescendant(id, targetId))) return;

    const newItems = sidebarItems.filter(item => !idsToMove.includes(item.id));
    const draggedItems = sidebarItems
      .filter(item => idsToMove.includes(item.id))
      .map(item => ({ ...item }));
    if (draggedItems.length === 0) return;

    const targetItem = newItems.find(i => i.id === targetId);

    if (targetItem) {
      if (targetItem.type === 'folder' && currentDropPosition === 'middle') {
        // Move into folder
        draggedItems.forEach(item => {
          item.parentId = targetId;
        });
        // Expand the folder so the user sees the item moved in
        if (!targetItem.isExpanded) {
          toggleFolderExpansion(targetId);
        }
        // Insert after the folder
        const targetIndex = newItems.findIndex(i => i.id === targetId);
        newItems.splice(targetIndex + 1, 0, ...draggedItems);
      } else {
        // Move to same level as target
        draggedItems.forEach(item => {
          item.parentId = targetItem.parentId;
        });
        const targetIndex = newItems.findIndex(i => i.id === targetId);
        if (currentDropPosition === 'bottom') {
          newItems.splice(targetIndex + 1, 0, ...draggedItems);
        } else {
          newItems.splice(targetIndex, 0, ...draggedItems);
        }
      }
    } else {
      // Move to root end
      draggedItems.forEach(item => {
        item.parentId = undefined;
      });
      newItems.push(...draggedItems);
    }
    
    reorderSidebarItems(newItems);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Profile Overlay */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileOpen(false)}
        />
      )}

      <div className={cn(
        "fixed md:relative z-50 bg-[var(--tokyo-sidebar)] border-r border-[var(--tokyo-border)] h-screen flex flex-col text-[var(--tokyo-text)] select-none transition-[width,transform] duration-100 ease-out overflow-hidden",
        isCollapsed ? "w-16" : "w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto no-scrollbar pb-8" ref={containerRef}>
            <div className="relative z-20 bg-[var(--tokyo-sidebar)] shrink-0">
              {/* Top Section - Design Match */}
              {!isCollapsed && (
                <div className="px-4 pt-4 pb-1 space-y-2">
                  {/* User Profile & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1 min-w-0">
                      <button 
                        onClick={handleProfileClick}
                        disabled={isAuthBusy}
                        className={cn(
                          "w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors cursor-pointer group disabled:cursor-wait disabled:opacity-70",
                          isProfileOpen && "bg-[var(--tokyo-hover)]"
                        )}
                      >
                        <img 
                          src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=0D8ABC&color=fff`} 
                          alt={user?.displayName || user?.email || 'User'} 
                          className="w-8 h-8 rounded-full object-cover border border-[var(--tokyo-border-strong)] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col min-w-0 flex-1 text-left gap-0.5">
                          <span className="text-[14px] font-semibold text-[var(--tokyo-text-strong)] truncate leading-tight">
                            {user?.displayName || (user ? user.email : isAuthBusy ? 'Signing in...' : 'Sign In')}
                          </span>
                          <span className="text-[12px] text-[var(--tokyo-text-faint)] truncate leading-tight">
                            {user?.email || 'Click to login with Google'}
                          </span>
                        </div>
                          {user && <ChevronDown className={cn("w-3.5 h-3.5 text-[var(--tokyo-text-faint)] transition-transform shrink-0", isProfileOpen && "rotate-180")} />}
                      </button>
                      {authError && (
                        <p className="mt-1 px-1 text-[10px] leading-4 text-[var(--tokyo-pink)]">
                          {authError}
                        </p>
                      )}

                      {isProfileOpen && (
                          <div 
                            className={cn(
                              "dayline-dialog absolute top-full left-0 mt-2 w-56 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-2 border-b border-[var(--tokyo-border)] mb-1">
                              <p className="dayline-dialog-heading text-xs font-medium text-[var(--tokyo-text-faint)]">Account</p>
                            </div>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <User className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Profile
                            </button>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <Settings className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Settings
                            </button>
                            <div className="h-px bg-[var(--tokyo-border)] my-1.5" />
                            <button 
                              onClick={() => {
                                setIsShortcutsOpen(true);
                                setIsProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                            >
                              <Keyboard className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Shortcuts
                            </button>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <HelpCircle className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Help
                            </button>
                            <div className="h-px bg-[var(--tokyo-border)] my-1.5" />
                            <button 
                              onClick={handleLogout}
                              disabled={isAuthBusy}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)] transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                      )}
                    </div>
                    <button 
                      onClick={onToggleSidebar}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--tokyo-panel-2)] text-[var(--tokyo-text-muted)] hover:text-white hover:bg-[var(--tokyo-panel-3)] transition-colors cursor-pointer p-1.5 shrink-0"
                      title="Toggle Sidebar"
                    >
                      <SidebarIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center">
                    <button 
                      onClick={() => onOpenCommandPalette()}
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[var(--tokyo-border)] rounded-lg text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] transition-colors cursor-pointer group"
                    >
                      <span className="text-sm font-medium flex-1 text-left">Quick actions</span>
                      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-[var(--tokyo-border-strong)] bg-transparent">
                        <span className="text-xs font-sans">⌘</span>
                        <span className="text-xs font-sans">K</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Top Actions (Collapsed State) */}
              {isCollapsed && (
                <div className="px-4 pt-4 pb-1 space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    <button 
                      onClick={onToggleSidebar}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--tokyo-panel-2)] text-[var(--tokyo-text-muted)] hover:text-white hover:bg-[var(--tokyo-panel-3)] transition-colors cursor-pointer p-1.5"
                      title="Toggle Sidebar"
                    >
                      <SidebarIcon className="w-4 h-4" />
                    </button>
                    
                    <div className="relative">
                      <button 
                        onClick={handleProfileClick}
                        disabled={isAuthBusy}
                        className="w-8 h-8 rounded-full overflow-hidden border border-[var(--tokyo-border-strong)] hover:border-white/30 transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-70"
                      >
                        <img 
                          src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&background=0D8ABC&color=fff`} 
                          alt={user?.displayName || user?.email || 'User'} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>

                      {isProfileOpen && (
                          <div 
                            className="dayline-dialog absolute top-0 left-full ml-2 w-56 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-2 border-b border-[var(--tokyo-border)] mb-1">
                              <p className="dayline-dialog-heading text-xs font-medium text-[var(--tokyo-text-faint)]">Account</p>
                            </div>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <User className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Profile
                            </button>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <Settings className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Settings
                            </button>
                            <div className="h-px bg-[var(--tokyo-border)] my-1.5" />
                            <button 
                              onClick={() => {
                                setIsShortcutsOpen(true);
                                setIsProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                            >
                              <Keyboard className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Shortcuts
                            </button>
                            <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <HelpCircle className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Help
                            </button>
                            <div className="h-px bg-[var(--tokyo-border)] my-1.5" />
                            <button 
                              onClick={handleLogout}
                              disabled={isAuthBusy}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)] transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onOpenCommandPalette()}
                    className="w-full flex items-center justify-center bg-transparent border border-[var(--tokyo-border)] hover:bg-[var(--tokyo-hover)] text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text)] rounded-md py-1.5 transition-colors cursor-pointer"
                    title="Quick actions"
                  >
                    <Search className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              )}

              <div className="px-4 mt-1 space-y-0.5">
                <button onClick={() => onViewChange('inbox')} className={cn("w-full flex items-center rounded-md py-1.5 transition-colors cursor-pointer group", isCollapsed ? "justify-center" : "px-3 gap-3", currentView === 'inbox' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Inbox className="w-4 h-4 text-[#45aaff] shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">Inbox</span>
                        <span className={cn("text-xs font-medium", currentView === 'inbox' ? "text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)]")}>2</span>
                      </>
                    )}
                  </button>

                  <button onClick={() => onViewChange('today')} className={cn("w-full flex items-center rounded-md py-1.5 transition-colors cursor-pointer group", isCollapsed ? "justify-center" : "px-3 gap-3", currentView === 'today' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Star className="w-4 h-4 text-[var(--tokyo-yellow)] shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">Today</span>
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--tokyo-pink)] text-white text-xs font-bold">1</span>
                      </>
                    )}
                  </button>

                  <button onClick={() => onViewChange('upcoming')} className={cn("w-full flex items-center rounded-md py-1.5 transition-colors cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-3", currentView === 'upcoming' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <CalendarIcon className="w-4 h-4 text-[var(--tokyo-pink)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Upcoming</span>}
                  </button>

                  <button onClick={() => onViewChange('someday')} className={cn("w-full flex items-center rounded-md py-1.5 transition-colors cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-3", currentView === 'someday' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Clock className="w-4 h-4 text-[var(--tokyo-purple)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Someday</span>}
                  </button>

                  <button onClick={() => onViewChange('logbook')} className={cn("w-full flex items-center rounded-md py-1.5 transition-colors cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-3", currentView === 'logbook' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <BookCheck className="w-4 h-4 text-[var(--tokyo-green)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Logbook</span>}
                  </button>
                </div>
                <div className="h-px bg-[var(--tokyo-border)] my-4 mx-4" />
            </div>

            {/* Main Section */}
            <div 
              className="px-4 pb-4 space-y-0.5 min-h-[50px]" 
              onDragOver={(e) => handleDragOver(e)} 
              onDrop={(e) => handleDrop(e)}
            >
              {sidebarItems.filter(item => !item.parentId).map((item, index) => {
                const Icon = iconMap[item.icon] || File;
                const isActive = currentView === item.id || (item.id === 'goals' && currentView.startsWith('goal-details:'));
                
                return (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    editingId={editingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    handleRenameSubmit={handleRenameSubmit}
                    setEditingId={setEditingId}
                    onViewChange={onViewChange}
                    handleContextMenu={handleContextMenu}
                    handleSidebarItemClick={handleSidebarItemClick}
                    handleSidebarItemPointerDown={handleSidebarItemPointerDown}
                    setIconPickerId={setIconPickerId}
                    setIconPickerPos={setIconPickerPos}
                    editInputRef={editInputRef}
                    Icon={Icon}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    dragOverId={dragOverId}
                    dropPosition={dropPosition}
                    toggleFolderExpansion={toggleFolderExpansion}
                    sidebarItems={sidebarItems}
                    iconMap={iconMap}
                    currentView={currentView}
                    selectedSidebarItemIds={selectedSidebarItemIds}
                    draggingSidebarItemIds={draggingSidebarItemIds}
                    primaryDraggingSidebarItemId={primaryDraggingSidebarItemId}
                  />
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="px-4 py-4 space-y-1">
              {!isCollapsed ? (
                <>
                  <div className="relative" ref={newItemMenuRef}>
                    <button 
                      onClick={() => setIsNewItemMenuOpen(!isNewItemMenuOpen)}
                      className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 shrink-0 text-[var(--tokyo-text-faint)]" />
                      <span className="text-sm font-medium flex-1 text-left">New Item</span>
                    </button>
                    
                    {isNewItemMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button 
                          onClick={() => {
                            handleNewDatabasePage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Database className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Database
                        </button>
                        <button 
                          onClick={() => {
                            handleNewDocumentPage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Document
                        </button>
                        <button 
                          onClick={handleNewFolder}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Folder
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onViewChange('trash')}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors cursor-pointer group",
                      currentView === 'trash'
                        ? "bg-[rgba(224,107,138,0.14)] text-[var(--tokyo-pink)]"
                        : "text-[var(--tokyo-pink)] hover:bg-[rgba(224,107,138,0.1)]"
                    )}
                  >
                    <Trash2 className="w-4 h-4 shrink-0 text-current" />
                    <span className="text-sm font-medium flex-1 text-left">Trash</span>
                    {trash.length > 0 && (
                      <span className="text-xs font-medium text-current">{trash.length}</span>
                    )}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative" ref={newItemMenuRef}>
                    <button 
                      onClick={() => setIsNewItemMenuOpen(!isNewItemMenuOpen)}
                      className="p-2 text-[var(--tokyo-text-faint)] hover:text-white transition-colors cursor-pointer" 
                      title="New Item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    {isNewItemMenuOpen && (
                      <div className="absolute bottom-0 left-full ml-2 w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                        <button 
                          onClick={() => {
                            handleNewDatabasePage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Database className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Database
                        </button>
                        <button 
                          onClick={() => {
                            handleNewDocumentPage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Document
                        </button>
                        <button 
                          onClick={() => {
                            handleNewFolder();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-1.5 text-[12px] leading-5 text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Folder className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                          New Folder
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onViewChange('trash')}
                    className={cn(
                      "p-2 rounded-md transition-colors cursor-pointer",
                      currentView === 'trash'
                        ? "bg-[rgba(224,107,138,0.14)] text-[var(--tokyo-pink)]"
                        : "text-[var(--tokyo-pink)] hover:bg-[rgba(224,107,138,0.1)]"
                    )}
                    title="Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    {/* Shortcuts Modal */}
    {isShortcutsOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="fixed inset-0" 
          onClick={() => setIsShortcutsOpen(false)}
        />
        <div className="dayline-dialog relative w-full max-w-lg bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-[var(--tokyo-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--tokyo-hover)] flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-[var(--tokyo-text)]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--tokyo-text-strong)]">Keyboard Shortcuts</h2>
                <p className="text-sm text-[var(--tokyo-text-faint)]">Boost your productivity with quick keys</p>
              </div>
            </div>
            <button 
              onClick={() => setIsShortcutsOpen(false)}
              className="p-2 hover:bg-[var(--tokyo-hover)] rounded-lg text-[var(--tokyo-text-faint)] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 gap-8">
              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-wider mb-4">General</h3>
                <div className="space-y-4">
                  <ShortcutRow label="Open Command Palette" keys={['⌘', 'K']} />
                  <ShortcutRow label="Toggle Sidebar" keys={['⌘', '/']} />
                  <ShortcutRow label="Quick Search" keys={['/']} />
                  <ShortcutRow label="Go to Dashboard" keys={['G', 'D']} />
                  <ShortcutRow label="Go to Tasks" keys={['G', 'T']} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-wider mb-4">Actions</h3>
                <div className="space-y-4">
                  <ShortcutRow label="Create New Task" keys={['C']} />
                  <ShortcutRow label="Create New Note" keys={['N']} />
                  <ShortcutRow label="Create New Idea" keys={['I']} />
                  <ShortcutRow label="Toggle Theme" keys={['⌘', '⇧', 'L']} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-white/20 uppercase tracking-wider mb-4">Navigation</h3>
                <div className="space-y-4">
                  <ShortcutRow label="Next Item" keys={['J']} />
                  <ShortcutRow label="Previous Item" keys={['K']} />
                  <ShortcutRow label="Select Item" keys={['Enter']} />
                  <ShortcutRow label="Go Back" keys={['Esc']} />
                </div>
              </section>
            </div>
          </div>

          <div className="p-4 bg-[var(--tokyo-hover)] text-center">
            <p className="text-xs text-[var(--tokyo-text-faint)]">
              Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)] font-sans mx-1">?</kbd> anywhere to show this menu
            </p>
          </div>
        </div>
      </div>
    )}
    
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[99]" 
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu(null);
            }}
          />
          <div 
            className="sidebar-context-menu fixed bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-xl rounded-lg py-1 w-48 z-[100]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
              {contextMenu.type === 'item' ? (
            <>
              <button 
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  const item = sidebarItems.find(i => i.id === contextMenu.id);
                  if (item) {
                    setEditValue(item.label);
                    setEditingId(contextMenu.id);
                  }
                  setContextMenu(null);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Rename
              </button>
              <button 
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  duplicateSidebarItem(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button 
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  const item = sidebarItems.find(i => i.id === contextMenu.id);
                  if (item) {
                    setIconPickerId(item.id);
                    setIconPickerPos({ x: contextMenu.x, y: contextMenu.y });
                  }
                  setContextMenu(null);
                }}
              >
                <Smile className="w-3.5 h-3.5" />
                Change Icon
              </button>
              <div className="h-px bg-[var(--tokyo-border)] my-1" />
              <button 
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)] transition-colors cursor-pointer"
                onClick={() => {
                  deleteSidebarItem(contextMenu.id);
                  if (currentView === contextMenu.id) {
                    onViewChange('dashboard');
                  }
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          ) : null}
        </div>
        </>
      )}

      {/* Icon Picker Popover */}
      {iconPickerId && iconPickerPos && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => setIconPickerId(null)}
          />
          <div 
            className="fixed z-[120]"
            style={{ 
              top: Math.min(iconPickerPos.y, window.innerHeight - 350), 
              left: Math.min(iconPickerPos.x, window.innerWidth - 280) 
            }}
          >
            <IconPicker 
              currentIcon={sidebarItems.find(i => i.id === iconPickerId)?.icon || 'File'}
              onSelect={(iconName) => {
                const item = sidebarItems.find(i => i.id === iconPickerId);
                if (item) {
                  updateSidebarItem(item.id, item.label, iconName);
                }
                setIconPickerId(null);
              }}
              onClose={() => setIconPickerId(null)}
              onRemove={() => {
                const item = sidebarItems.find(i => i.id === iconPickerId);
                if (item) {
                  updateSidebarItem(item.id, item.label, 'File');
                }
                setIconPickerId(null);
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

function ShortcutRow({ label, keys }: { label: string, keys: string[] }) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-sm text-white/70 group-hover:text-[var(--tokyo-text-strong)] transition-colors">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            <kbd className="min-w-[24px] h-6 px-1.5 flex items-center justify-center rounded bg-[var(--tokyo-hover)] border border-[var(--tokyo-border-strong)] text-xs font-medium text-[var(--tokyo-text-muted)] font-sans shadow-sm">
              {key}
            </kbd>
            {i < keys.length - 1 && <span className="text-xs text-white/20">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  isActive,
  isCollapsed,
  editingId,
  editValue,
  setEditValue,
  handleRenameSubmit,
  setEditingId,
  onViewChange,
  handleContextMenu,
  handleSidebarItemClick,
  handleSidebarItemPointerDown,
  setIconPickerId,
  setIconPickerPos,
  editInputRef,
  Icon,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  dragOverId,
  dropPosition,
  toggleFolderExpansion,
  sidebarItems,
  iconMap,
  currentView,
  selectedSidebarItemIds,
  draggingSidebarItemIds,
  primaryDraggingSidebarItemId
}: any) {
  const isFolder = item.type === 'folder';
  const children = sidebarItems.filter((i: any) => i.parentId === item.id);
  const isDraggingOver = dragOverId === item.id;
  const isSelected = selectedSidebarItemIds?.includes(item.id);
  const isDragging = draggingSidebarItemIds?.includes(item.id);
  const isDragStackAnchor = item.id === primaryDraggingSidebarItemId && draggingSidebarItemIds?.length > 1 && !isFolder;
  const isMergedIntoDragStack = draggingSidebarItemIds?.length > 1 && isDragging && !isDragStackAnchor;
  const dragStackCount = isDragStackAnchor ? draggingSidebarItemIds.length : 0;
  const showBulkDragSelection = isSelected && draggingSidebarItemIds?.length > 0;

  if (isMergedIntoDragStack) {
    return null;
  }

  return (
    <motion.div
      layout
      animate={{
        height: isMergedIntoDragStack ? 0 : 'auto',
        opacity: isMergedIntoDragStack ? 0 : 1,
        marginTop: isMergedIntoDragStack ? 0 : undefined,
        marginBottom: isMergedIntoDragStack ? 0 : undefined,
      }}
      transition={{ type: 'spring', stiffness: 620, damping: 38, mass: 0.48 }}
      style={{ pointerEvents: isMergedIntoDragStack ? 'none' : undefined }}
      className={cn(
        "space-y-0.5 relative",
        isMergedIntoDragStack ? "!mt-0 overflow-hidden" : "overflow-visible"
      )}
    >
      <motion.div 
        layout
        animate={{
          y: isMergedIntoDragStack ? -8 : 0,
          scale: isDragStackAnchor ? 1.02 : isMergedIntoDragStack ? 0.94 : 1,
          x: isDragStackAnchor ? 4 : 0,
        }}
        transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.55 }}
        data-sidebar-item-id={item.id}
        draggable
        onDragStart={(e) => onDragStart(e, item.id)}
        onDragOver={(e) => onDragOver(e, item.id)}
        onDragLeave={(e) => onDragLeave(e)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, item.id)}
        onPointerDown={(e) => handleSidebarItemPointerDown(e, item.id, isFolder)}
        className={cn(
          "flex items-center rounded-md py-1.5 transition-[background-color,color,box-shadow,border-color,width] duration-150 group relative select-none isolate overflow-visible",
          isDragStackAnchor ? "w-[calc(100%-18px)]" : "w-full",
          "cursor-pointer",
          isCollapsed ? "justify-center" : "px-3 gap-3",
          isDragStackAnchor
            ? "bg-transparent text-white z-20"
            : isActive || isSelected || showBulkDragSelection
            ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]"
            : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]",
          isFolder && "font-semibold",
          isDraggingOver && dropPosition === 'middle' && "bg-white/20 scale-[1.02] ring-1 ring-white/30 z-10"
        )}
        title={isCollapsed ? item.label : undefined}
        onContextMenu={(e) => handleContextMenu(e, item.id)}
        onClick={(e) => {
          handleSidebarItemClick(e, item.id, isFolder);
        }}
      >
        {isDragStackAnchor && (
          <>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 top-1 bottom-0 z-0 rounded-lg border border-[#FFE08A]/25 bg-[#6F5607] shadow-[0_10px_22px_rgba(0,0,0,0.22)]"
              initial={false}
              animate={{
                x: isDragging ? 10 : 0,
                y: isDragging ? 9 : 0,
                rotate: isDragging ? 3 : 0,
                opacity: isDragging ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 620, damping: 32, mass: 0.45 }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-1 top-0.5 bottom-0 z-10 rounded-lg border border-[#FFE08A]/35 bg-[#A9820B] shadow-[0_8px_18px_rgba(0,0,0,0.2)]"
              initial={false}
              animate={{
                x: isDragging ? 6 : 0,
                y: isDragging ? 5 : 0,
                rotate: isDragging ? 1.6 : 0,
                opacity: isDragging ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 620, damping: 34, mass: 0.45 }}
            />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 rounded-md border border-[#FFE08A]/55 bg-[linear-gradient(135deg,#D8AA15,#A37E0A)] shadow-[0_18px_44px_rgba(0,0,0,0.34),0_1px_0_rgba(255,255,255,0.24)_inset]"
              initial={false}
              animate={{
                opacity: 1,
              }}
              transition={{ duration: 0.08 }}
            />
          </>
        )}
        {isDraggingOver && dropPosition === 'top' && (
          <div className="pointer-events-none absolute -top-1 left-2 right-2 z-50 h-[2px] rounded-full bg-[var(--tokyo-yellow)] shadow-[0_0_12px_rgba(233,202,53,0.5)]" />
        )}
        {isDraggingOver && dropPosition === 'bottom' && (
          <div className="pointer-events-none absolute -bottom-1 left-2 right-2 z-50 h-[2px] rounded-full bg-[var(--tokyo-yellow)] shadow-[0_0_12px_rgba(233,202,53,0.5)]" />
        )}
        <div className="flex items-center relative z-30">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setIconPickerId(item.id);
              setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
            }}
            className={cn("rounded p-0.5 transition-colors cursor-pointer", !isSelected && "hover:bg-[var(--tokyo-hover)]")}
          >
            <Icon className={cn(
              "w-4 h-4 shrink-0 stroke-[1.5]",
              isActive || isSelected ? "opacity-100" : "opacity-70"
            )} />
          </button>
        </div>
        {!isCollapsed && (
          editingId === item.id ? (
            <input
              ref={editInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleRenameSubmit(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit(item.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="flex-1 bg-transparent outline-none text-[var(--tokyo-text-strong)] text-sm font-medium cursor-text"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="flex-1 flex items-center justify-between min-w-0 relative z-30">
              <span className="text-sm font-medium truncate">{item.label}</span>
              {dragStackCount > 0 && (
                <motion.span
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 24 }}
                  className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FFE08A] px-1.5 text-[11px] font-bold text-[#2A1E05] shadow-sm"
                >
                  {dragStackCount}
                </motion.span>
              )}
              {isFolder && (
                <motion.div
                  animate={{ rotate: item.isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.08 }}
                  className="shrink-0 ml-2"
                >
                  <ChevronRight className="w-3 h-3 text-[var(--tokyo-text-faint)]" />
                </motion.div>
              )}
            </div>
          )
        )}
      </motion.div>

      <AnimatePresence>
        {isFolder && item.isExpanded && !isCollapsed && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 border-l border-[var(--tokyo-border)] pl-2 space-y-0.5 overflow-hidden"
          >
            {children.map((child: any) => {
              const ChildIcon = iconMap[child.icon] || File;
              return (
                <SidebarItem
                  key={child.id}
                  item={child}
                  isActive={currentView === child.id}
                  isCollapsed={isCollapsed}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  handleRenameSubmit={handleRenameSubmit}
                  setEditingId={setEditingId}
                  onViewChange={onViewChange}
                  handleContextMenu={handleContextMenu}
                  handleSidebarItemClick={handleSidebarItemClick}
                  handleSidebarItemPointerDown={handleSidebarItemPointerDown}
                  setIconPickerId={setIconPickerId}
                  setIconPickerPos={setIconPickerPos}
                  editInputRef={editInputRef}
                  Icon={ChildIcon}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDragEnd={onDragEnd}
                  onDrop={onDrop}
                  dragOverId={dragOverId}
                  dropPosition={dropPosition}
                  toggleFolderExpansion={toggleFolderExpansion}
                  sidebarItems={sidebarItems}
                  iconMap={iconMap}
                  currentView={currentView}
                  selectedSidebarItemIds={selectedSidebarItemIds}
                  draggingSidebarItemIds={draggingSidebarItemIds}
                  primaryDraggingSidebarItemId={primaryDraggingSidebarItemId}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
