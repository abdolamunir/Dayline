import React, { useState, useEffect, useRef } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home01Icon as Home, Search01Icon as Search, Notification01Icon as Bell, Settings01Icon as Settings, Add01Icon as Plus, Message02Icon as MessageSquare, Calendar01Icon as CalendarIcon, InboxIcon as Inbox, PencilEdit01Icon as Pencil, CheckmarkCircle02Icon as CheckCircle2, Target01Icon as Target, Layers01Icon as Layers, Activity01Icon as Activity, SmileIcon as Smile, StethoscopeIcon as Stethoscope, Book01Icon as Book, FeatherIcon as Feather, Folder01Icon as Folder, Dumbbell01Icon as Dumbbell, Restaurant01Icon as Utensils, ShoppingCart01Icon as ShoppingCart, Bookmark01Icon as Bookmark, Airplane01Icon as Plane, LibraryIcon as Library, ShoppingBag01Icon as ShoppingBag, PlayCircle02Icon as MonitorPlay, UserGroupIcon as Users, File01Icon as File, ArrowLeft01Icon as ChevronLeft, ArrowRight01Icon as ChevronRight, StarIcon as Star, Calendar02Icon as CalendarDays, Archive01Icon as Archive, Book02Icon as BookCheck, MoreHorizontalIcon as MoreHorizontal, Delete02Icon as Trash2, Edit02Icon as Edit2, Time02Icon as History, ArrowLeft01Icon as ArrowLeft, ArrowRight01Icon as ArrowRight, SidebarLeftIcon as PanelLeft, ArrowDown01Icon as ChevronDown, Edit01Icon as SquarePen, SidebarLeftIcon as SidebarIcon, DashboardSquare01Icon as LayoutDashboard, DeliveryBox01Icon as Box, DatabaseIcon as Database, Plug01Icon as Plug, Clock01Icon as Clock, File02Icon as FileText, LockIcon as Lock, Shield01Icon as Shield, Wallet01Icon as Wallet, Download01Icon as Download, Upload01Icon as Upload, UserIcon as User, Logout01Icon as LogOut, HelpCircleIcon as HelpCircle, KeyboardIcon as Keyboard, CommandIcon as Command, Moon01Icon as Moon, Copy01Icon as Copy, Megaphone01Icon as Megaphone, GiftIcon as Gift, InformationCircleIcon as InfoCircle, Camera01Icon as Camera } from 'hugeicons-react';
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

type ProfileOverrides = {
  name: string;
  username: string;
  email: string;
  photoURL: string;
};

const SIDEBAR_WIDTH_STORAGE_KEY = 'dayline:sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;

const clampSidebarWidth = (width: number) => Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));

const readSidebarWidth = () => {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_WIDTH;

  const storedWidth = Number.parseFloat(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY) || '');
  return Number.isFinite(storedWidth) ? clampSidebarWidth(storedWidth) : DEFAULT_SIDEBAR_WIDTH;
};

export function Sidebar({ currentView, onViewChange, onOpenCommandPalette, isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, onToggleSidebar }: SidebarProps) {
  const { 
    customPages,
    notes,
    projects,
    goals,
    areas,
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
    user,
    updateNote,
    updateProject,
    updateGoal,
    updateArea,
    updateCustomPage
  } = useAppStore();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string, type: 'item', parentId?: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingParentId, setEditingParentId] = useState<string | undefined>(undefined);
  const [editValue, setEditValue] = useState('');
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerParentId, setIconPickerParentId] = useState<string | undefined>(undefined);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [productUpdatesEnabled, setProductUpdatesEnabled] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewItemMenuOpen, setIsNewItemMenuOpen] = useState(false);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profileOverrides, setProfileOverrides] = useState<ProfileOverrides | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileOverrides>({ name: '', username: '', email: '', photoURL: '' });
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const newItemMenuRef = useRef<HTMLDivElement>(null);
  const hiddenSidebarRowStylesRef = useRef(new Map<HTMLElement, { display: string, pointerEvents: string }>());
  const [selectedSidebarItemIds, setSelectedSidebarItemIds] = useState<string[]>([]);
  const [lastSelectedSidebarItemId, setLastSelectedSidebarItemId] = useState<string | null>(null);
  const [draggingSidebarItemIds, setDraggingSidebarItemIds] = useState<string[]>([]);
  const [primaryDraggingSidebarItemId, setPrimaryDraggingSidebarItemId] = useState<string | null>(null);
  const fixedSidebarItemIds = new Set(['favourites', 'shared', 'private']);

  const profileStorageKey = user?.uid ? `dayline:user-profile:v1:${user.uid}` : null;
  const defaultProfile = React.useMemo<ProfileOverrides>(() => ({
    name: user?.displayName || user?.email?.split('@')[0] || 'User',
    username: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    photoURL: user?.photoURL || '',
  }), [user?.displayName, user?.email, user?.photoURL]);
  const activeProfile = profileOverrides || defaultProfile;
  const activeProfilePhoto = activeProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeProfile.name || activeProfile.email || 'User')}&background=0D8ABC&color=fff`;
  const activeProfileName = activeProfile.name || activeProfile.email || 'User';
  const activeProfileEmail = activeProfile.email || user?.email || '';

  useEffect(() => {
    if (isCollapsed) return;
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidth));
  }, [isCollapsed, sidebarWidth]);

  const handleSidebarResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    setIsResizingSidebar(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setSidebarWidth(clampSidebarWidth(startWidth + moveEvent.clientX - startX));
    };

    const handlePointerUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

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
    if (!profileStorageKey) {
      setProfileOverrides(null);
      setProfileDraft(defaultProfile);
      return;
    }

    try {
      const savedProfile = window.localStorage.getItem(profileStorageKey);
      if (!savedProfile) {
        setProfileOverrides(null);
        setProfileDraft(defaultProfile);
        return;
      }

      const parsedProfile = JSON.parse(savedProfile) as Partial<ProfileOverrides>;
      const nextProfile = {
        ...defaultProfile,
        ...parsedProfile,
      };
      setProfileOverrides(nextProfile);
      setProfileDraft(nextProfile);
    } catch {
      setProfileOverrides(null);
      setProfileDraft(defaultProfile);
    }
  }, [defaultProfile, profileStorageKey]);

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

  const handleContextMenu = (e: React.MouseEvent, id: string, type: 'item' = 'item', parentId?: string) => {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + 32;
    let y = rect.bottom;
    
    const menuHeight = type === 'item' ? 160 : 80;
    if (y + menuHeight > window.innerHeight) {
      y = rect.top - menuHeight;
    }
      
    setContextMenu({ x, y, id, type, parentId });
  };

  const handleRenameSubmit = (id: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      const note = notes.find(n => n.id === id);
      const project = projects.find(p => p.id === id);
      const goal = goals.find(g => g.id === id);
      const area = areas.find(a => a.id === id);
      const customPage = customPages.find(p => p.id === id);

      if (note) updateNote({ ...note, title: trimmed });
      else if (project) updateProject(project.id, { name: trimmed });
      else if (goal) updateGoal({ ...goal, title: trimmed });
      else if (area) updateArea(area.id, { name: trimmed });
      else if (customPage) updateCustomPage({ ...customPage, title: trimmed });
      
      // Also handle custom page items
      customPages.forEach(p => {
        if (p.items) {
          const found = p.items.find(item => item.id === id);
          if (found) {
            const nextItems = p.items.map(item => item.id === id ? { ...item, title: trimmed } : item);
            updateCustomPage({ ...p, items: nextItems });
          }
        }
      });

      updateSidebarItem(id, trimmed);
    }
    setEditingId(null);
    setEditingParentId(undefined);
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

  const openProfileEditor = () => {
    setProfileDraft(activeProfile);
    setIsProfileEditorOpen(true);
    setIsProfileOpen(false);
  };

  const openSettings = () => {
    setProfileDraft(activeProfile);
    setIsSettingsOpen(true);
    setIsProfileOpen(false);
  };

  const handleProfilePhotoFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileDraft((current) => ({
        ...current,
        photoURL: typeof reader.result === 'string' ? reader.result : current.photoURL,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const nextProfile = {
      name: profileDraft.name.trim() || defaultProfile.name,
      username: profileDraft.username.trim(),
      email: profileDraft.email.trim() || defaultProfile.email,
      photoURL: profileDraft.photoURL,
    };

    setProfileOverrides(nextProfile);
    if (profileStorageKey) {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
    }
    setIsProfileEditorOpen(false);
    setIsSettingsOpen(false);
  };

  const renderAboutMenuItems = () => (
    <>
      <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
        <Megaphone className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
        Send us feedback
      </button>
      <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
        <Gift className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
        What's new
      </button>
      <button onClick={(e) => e.preventDefault()} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
        <InfoCircle className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
        Version
      </button>
    </>
  );

  const handleNewDatabasePage = (parentId?: string) => {
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
    }, parentId);
    if (parentId) {
      const parent = sidebarItems.find(item => item.id === parentId);
      if (parent && !parent.isExpanded) {
        toggleFolderExpansion(parentId);
      }
    }
    onViewChange(newId);
  };

  const handleNewDocumentPage = (parentId?: string) => {
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
    }, parentId);
    if (parentId) {
      const parent = sidebarItems.find(item => item.id === parentId);
      if (parent && !parent.isExpanded) {
        toggleFolderExpansion(parentId);
      }
    }
    onViewChange(newId);
  };

  const handleNewFolder = () => {
    const newId = `folder-${Date.now()}`;
    addFolder({
      id: newId,
      label: 'New Category',
      icon: 'Folder',
      type: 'folder',
      isExpanded: true
    });
    setEditingId(newId);
    setEditValue('New Category');
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

  const handleSidebarItemClick = (e: React.MouseEvent, id: string, isFolder: boolean, clickedItem?: any) => {
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
      const view = clickedItem?.view || id;
      onViewChange(view);
    }
  };

  const setSidebarItemFavorite = (id: string, isFavorite: boolean) => {
    reorderSidebarItems(sidebarItems.map(item => (
      item.id === id ? { ...item, isFavorite } : item
    )));
  };

  const setPageFavorite = (id: string, isFavorite: boolean) => {
    const page = customPages.find(candidate => candidate.id === id);
    if (page) {
      updateCustomPage({ ...page, isFavorite });
      return;
    }

    const item = sidebarItems.find(candidate => candidate.id === id);
    if (item && item.type !== 'folder' && item.type !== 'trash') {
      setSidebarItemFavorite(id, isFavorite);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string, parentId?: string) => {
    const draggedIds = selectedSidebarItemIds.includes(id) ? selectedSidebarItemIds : [id];
    hideNonHeldSelectedSidebarRows(draggedIds, id);
    flushSync(() => {
      setDraggingSidebarItemIds(draggedIds);
      setPrimaryDraggingSidebarItemId(id);
    });
    document.body.style.cursor = 'pointer';
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.setData('application/dayline-sidebar-items', JSON.stringify(draggedIds));
    if (parentId) {
      e.dataTransfer.setData('source-parent', parentId);
    }
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
      const isSmartFolder = item?.id === 'favourites' || item?.id === 'shared';
      if (item?.type === 'folder' && !isSmartFolder) {
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
    if (!draggedId) return;

    const sourceParent = e.dataTransfer.getData('source-parent');
    
    // Find matching dragged object in store to handle favorites
    const draggedNote = notes.find(n => n.id === draggedId);
    const draggedProject = projects.find(p => p.id === draggedId);
    const draggedGoal = goals.find(g => g.id === draggedId);
    const draggedArea = areas.find(a => a.id === draggedId);
    const draggedCustomPage = customPages.find(p => p.id === draggedId);

    if (
      (targetId === 'shared' && currentDropPosition === 'middle') ||
      (targetId && sidebarItems.find(i => i.id === targetId)?.parentId === 'shared')
    ) {
      return;
    }

    const isTargetFavourites = (
      (targetId === 'favourites' && currentDropPosition === 'middle') ||
      (targetId && sidebarItems.find(i => i.id === targetId)?.parentId === 'favourites' && currentDropPosition === 'middle')
    );

    if (isTargetFavourites) {
      // Dragged into Favourites!
      if (draggedNote) updateNote({ ...draggedNote, isFavorite: true });
      if (draggedProject) updateProject(draggedProject.id, { isFavorite: true });
      if (draggedGoal) updateGoal({ ...draggedGoal, isFavorite: true });
      if (draggedArea) updateArea(draggedArea.id, { isFavorite: true });
      if (draggedCustomPage) updateCustomPage({ ...draggedCustomPage, isFavorite: true });
      if (!draggedNote && !draggedProject && !draggedGoal && !draggedArea && !draggedCustomPage) {
        const draggedSidebarItem = sidebarItems.find(item => item.id === draggedId);
        if (draggedSidebarItem && draggedSidebarItem.type !== 'folder' && draggedSidebarItem.type !== 'trash') {
          setSidebarItemFavorite(draggedId, true);
        }
      }
      return;
    }

    // Dragged out of Favourites!
    if (sourceParent === 'favourites') {
      if (draggedNote) updateNote({ ...draggedNote, isFavorite: false });
      if (draggedProject) updateProject(draggedProject.id, { isFavorite: false });
      if (draggedGoal) updateGoal({ ...draggedGoal, isFavorite: false });
      if (draggedArea) updateArea(draggedArea.id, { isFavorite: false });
      if (draggedCustomPage) {
        updateCustomPage({ ...draggedCustomPage, isFavorite: false });
      }
      if (!draggedNote && !draggedProject && !draggedGoal && !draggedArea && !draggedCustomPage) {
        const draggedSidebarItem = sidebarItems.find(item => item.id === draggedId);
        if (draggedSidebarItem) {
          setSidebarItemFavorite(draggedId, false);
        }
      }
    }

    // If it's a virtual child note/project/goal/area that is NOT in sidebarItems, we don't do sidebar item reordering
    const isVirtual = draggedNote || draggedProject || draggedGoal || draggedArea;
    if (isVirtual && sourceParent !== 'favourites') {
      // Not dragged from Favourites, and not dropped in Favourites, so do nothing for virtual elements
      return;
    }

    // Normal sidebar item reordering/moving logic
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

    if (idsToMove.length === 0 || (targetId && idsToMove.includes(targetId))) return;

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

    // If a custom page is dragged from Favourites or is just in sidebarItems,
    // let's check if we dragged it out of Favourites (or if we dragged it in general).
    // If it's a custom page, since it is in sidebarItems, we want to update its parentId!
    if (draggedCustomPage && draggedItems.length === 0) {
      const itemInSidebar = sidebarItems.find(i => i.id === draggedCustomPage.id);
      if (itemInSidebar) {
        draggedItems.push({ ...itemInSidebar });
      } else {
        draggedItems.push({
          id: draggedCustomPage.id,
          label: draggedCustomPage.title,
          icon: draggedCustomPage.icon,
          type: 'custom',
        });
      }
    }

    if (draggedItems.length === 0) return;

    if (sourceParent === 'favourites') {
      draggedItems.forEach(item => {
        item.isFavorite = false;
      });
    }

    const targetItem = newItems.find(i => i.id === targetId);

    if (targetItem) {
      if (targetItem.type === 'folder' && currentDropPosition === 'middle') {
        // Move into folder
        draggedItems.forEach(item => {
          item.parentId = targetId;
        });
        if (!targetItem.isExpanded) {
          toggleFolderExpansion(targetId);
        }
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

      {isProfileEditorOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          onMouseDown={() => setIsProfileEditorOpen(false)}
        >
          <div
            className="dayline-dialog w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-bg)] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <h2 className="text-[32px] font-bold leading-tight text-[var(--tokyo-text-strong)]">
                Edit Profile
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--tokyo-text-muted)]">
                Update your name, username, email, and display picture for {activeProfileEmail || 'this account'}.
              </p>

              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--tokyo-text)]">Name</span>
                    <input
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((current) => ({ ...current, name: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm text-[var(--tokyo-text-strong)] outline-none transition-colors placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)]"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--tokyo-text)]">Username</span>
                    <input
                      value={profileDraft.username}
                      onChange={(e) => setProfileDraft((current) => ({ ...current, username: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm text-[var(--tokyo-text-strong)] outline-none transition-colors placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)]"
                      placeholder="username"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--tokyo-text)]">Email</span>
                    <input
                      type="email"
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft((current) => ({ ...current, email: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm text-[var(--tokyo-text-strong)] outline-none transition-colors placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)]"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold text-[var(--tokyo-text)]">Display Picture</span>
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleProfilePhotoFile(e.dataTransfer.files?.[0]);
                    }}
                    className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--tokyo-text-faint)] bg-[var(--tokyo-panel)] px-4 py-10 text-center text-[var(--tokyo-text-muted)] transition-colors hover:border-[var(--tokyo-yellow)] hover:bg-[var(--tokyo-hover)]"
                  >
                    <img
                      src={profileDraft.photoURL || activeProfilePhoto}
                      alt={profileDraft.name || activeProfileName}
                      className="h-20 w-20 rounded-full border border-[var(--tokyo-border-strong)] object-cover"
                    />
                    <span className="mt-8 flex items-center gap-2 text-sm font-medium">
                      <Upload className="h-4 w-4" />
                      Drag & drop a photo here
                    </span>
                    <span className="mt-3 rounded-md border border-[var(--tokyo-border-strong)] px-2.5 py-1 text-xs text-[var(--tokyo-text)]">
                      or select file
                    </span>
                  </button>
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleProfilePhotoFile(e.target.files?.[0])}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--tokyo-border)] px-8 py-5 sm:px-10">
              <button
                onClick={() => setIsProfileEditorOpen(false)}
                className="rounded-lg bg-[var(--tokyo-panel-2)] px-5 py-2.5 text-sm font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-panel-3)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="rounded-lg bg-[var(--tokyo-yellow-dim)] px-5 py-2.5 text-sm font-semibold text-[var(--tokyo-text-strong)] transition-colors hover:bg-[var(--tokyo-yellow)]"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
          onMouseDown={() => setIsSettingsOpen(false)}
        >
          <div
            className="dayline-dialog flex h-[min(86vh,760px)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-bg)] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <aside className="hidden w-64 shrink-0 border-r border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 py-6 md:block">
              <div className="mb-9 flex items-center gap-3 px-3 text-[var(--tokyo-text-strong)]">
                <Settings className="h-5 w-5" />
                <span className="text-base font-bold">Settings</span>
              </div>

              <div className="space-y-7">
                <section>
                  <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tokyo-text-faint)]">Space</p>
                  {[
                    { label: 'Members', icon: Users },
                    { label: 'Space Settings', icon: Folder },
                    { label: 'Usage', icon: Activity },
                    { label: 'Billing', icon: Wallet },
                    { label: 'Integrations', icon: Plug },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </section>

                <section>
                  <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tokyo-text-faint)]">Personal</p>
                  {[
                    { label: 'Account', icon: User, active: true },
                    { label: 'Appearance', icon: Moon },
                    { label: 'Notifications', icon: Bell },
                    { label: 'Keyboard Shortcuts', icon: Keyboard },
                    { label: 'API Keys', icon: Lock },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.label === 'Keyboard Shortcuts') {
                            setIsShortcutsOpen(true);
                            setIsSettingsOpen(false);
                          }
                        }}
                        className={cn(
                          "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
                          item.active
                            ? "bg-[var(--tokyo-panel-2)] text-[var(--tokyo-text-strong)] shadow-[inset_0_0_0_1px_var(--tokyo-border)]"
                            : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        {item.label}
                      </button>
                    );
                  })}
                </section>

                <section>
                  <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wide text-[var(--tokyo-text-faint)]">App</p>
                  <button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
                    <Stethoscope className="h-4.5 w-4.5" />
                    Experimental
                  </button>
                </section>
              </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col bg-[var(--tokyo-bg)]">
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--tokyo-border)] px-6 md:px-8">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-[var(--tokyo-text-faint)]">Settings</span>
                  <ChevronRight className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                  <span className="text-[var(--tokyo-text-strong)]">Account</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                  title="Close settings"
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-20">
                <div className="max-w-4xl">
                  <h2 className="text-2xl font-bold text-[var(--tokyo-text-strong)]">Account</h2>

                  <div className="mt-9 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--tokyo-text-strong)]">Profile photo</h3>
                      <p className="mt-1 text-sm font-semibold leading-5 text-[var(--tokyo-text-muted)]">
                        JPG, PNG or GIF. Max 5MB. Drag and drop to upload.
                      </p>
                    </div>
                    <div className="flex items-center gap-5">
                      <img
                        src={profileDraft.photoURL || activeProfilePhoto}
                        alt={profileDraft.name || activeProfileName}
                        className="h-16 w-16 rounded-xl border border-[var(--tokyo-border)] object-cover"
                      />
                      <button
                        onClick={() => profilePhotoInputRef.current?.click()}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleProfilePhotoFile(event.dataTransfer.files?.[0]);
                        }}
                        className="inline-flex h-11 items-center gap-3 rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-4 text-sm font-semibold text-[var(--tokyo-text-strong)] transition-colors hover:border-[var(--tokyo-border-strong)] hover:bg-[var(--tokyo-panel-2)]"
                      >
                        <Camera className="h-5 w-5" />
                        Change Photo
                      </button>
                      <input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleProfilePhotoFile(event.target.files?.[0])}
                      />
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                    <label className="text-sm font-bold text-[var(--tokyo-text-strong)]" htmlFor="settings-profile-name">Name</label>
                    <input
                      id="settings-profile-name"
                      value={profileDraft.name}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm text-[var(--tokyo-text-strong)] outline-none transition-colors placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)]"
                      placeholder="Click to edit"
                    />
                  </div>

                  <div className="mt-5 grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                    <label className="text-sm font-bold text-[var(--tokyo-text-strong)]" htmlFor="settings-profile-email">Email</label>
                    <input
                      id="settings-profile-email"
                      type="email"
                      value={profileDraft.email}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
                      className="h-11 rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm text-[var(--tokyo-text-strong)] outline-none transition-colors placeholder:text-[var(--tokyo-text-faint)] focus:border-[var(--tokyo-border-strong)]"
                      placeholder="Email"
                    />
                  </div>

                  <div className="my-8 h-px bg-[var(--tokyo-border)]" />

                  <p className="mb-5 text-xs font-bold uppercase tracking-wide text-[var(--tokyo-text-muted)]">Communications</p>
                  <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--tokyo-text-strong)]">Product updates</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--tokyo-text-muted)]">Occasional tips and feature announcements</p>
                    </div>
                    <button
                      onClick={() => setProductUpdatesEnabled((enabled) => !enabled)}
                      className="flex h-11 items-center justify-between rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-panel)] px-3 text-sm font-semibold text-[var(--tokyo-text-muted)] transition-colors hover:border-[var(--tokyo-border-strong)]"
                    >
                      {productUpdatesEnabled ? 'Enabled' : 'Disabled'}
                      <span className={cn(
                        "relative h-7 w-12 rounded-full transition-colors",
                        productUpdatesEnabled ? "bg-[var(--tokyo-yellow-dim)]" : "bg-[var(--tokyo-panel-3)]"
                      )}>
                        <span className={cn(
                          "absolute top-1 h-5 w-5 rounded-full bg-[var(--tokyo-bg)] transition-transform",
                          productUpdatesEnabled ? "translate-x-6" : "translate-x-1"
                        )} />
                      </span>
                    </button>
                  </div>

                  <div className="my-8 h-px bg-[var(--tokyo-border)]" />

                  <p className="mb-5 text-xs font-bold uppercase tracking-wide text-[var(--tokyo-text-muted)]">Account Actions</p>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--tokyo-text-strong)]">Sign out</h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--tokyo-text-muted)]">Log out of your account</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isAuthBusy}
                        className="inline-flex h-11 w-fit items-center gap-3 rounded-lg px-4 text-sm font-bold text-[var(--tokyo-pink)] transition-colors hover:bg-[rgba(255,77,125,0.12)] disabled:opacity-50"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign out
                      </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:items-center">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--tokyo-text-strong)]">Reset onboarding</h3>
                        <p className="mt-1 text-sm font-semibold text-[var(--tokyo-text-muted)]">Replay welcome overlays and onboarding</p>
                      </div>
                      <button className="inline-flex h-11 w-fit items-center gap-3 rounded-lg px-4 text-sm font-bold text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)]">
                        <History className="h-5 w-5" />
                        Reset onboarding
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-[var(--tokyo-border)] px-6 py-4 md:px-8">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg bg-[var(--tokyo-panel-2)] px-5 py-2.5 text-sm font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-panel-3)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="rounded-lg bg-[var(--tokyo-yellow-dim)] px-5 py-2.5 text-sm font-semibold text-[var(--tokyo-text-strong)] transition-colors hover:bg-[var(--tokyo-yellow)]"
                >
                  Save Settings
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      <div className={cn(
        "dayline-sidebar-surface fixed md:relative z-50 bg-[var(--tokyo-sidebar)] border-r border-[var(--tokyo-border)] h-screen flex shrink-0 flex-col text-[var(--tokyo-text)] select-none overflow-hidden",
        isResizingSidebar ? "transition-[transform] duration-0" : "transition-[width,transform] duration-100 ease-out",
        isCollapsed && "w-16",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
        style={isCollapsed ? undefined : { width: sidebarWidth, flexBasis: sidebarWidth }}
      >
        {!isCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onPointerDown={handleSidebarResizeStart}
            className={cn(
              "absolute right-[-4px] top-0 z-[80] hidden h-full w-2 cursor-col-resize touch-none md:block",
              "before:absolute before:left-1/2 before:top-0 before:h-full before:w-[3px] before:-translate-x-1/2 before:bg-transparent before:transition-colors",
              "hover:before:bg-[var(--tokyo-yellow)]",
              isResizingSidebar && "before:bg-[var(--tokyo-yellow)]"
            )}
          />
        )}
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
                          src={activeProfilePhoto} 
                          alt={activeProfileName} 
                          className="w-8 h-8 rounded-full object-cover border border-[var(--tokyo-border-strong)] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col min-w-0 flex-1 text-left gap-0.5">
                          <span className="text-[14px] font-semibold text-[var(--tokyo-text-strong)] truncate leading-tight">
                            {user ? activeProfileName : isAuthBusy ? 'Signing in...' : 'Sign In'}
                          </span>
                          <span className="text-[12px] text-[var(--tokyo-text-faint)] truncate leading-tight">
                            {activeProfileEmail || 'Click to login with Google'}
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
                              "dayline-dialog absolute top-full left-0 mt-2 w-56 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100"
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-2 border-b border-[var(--tokyo-border)] mb-1">
                              <p className="dayline-dialog-heading text-xs font-medium text-[var(--tokyo-text-faint)]">Account</p>
                            </div>
                            <button onClick={openProfileEditor} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <User className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Profile
                            </button>
                            <button onClick={openSettings} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
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
                            {renderAboutMenuItems()}
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[var(--tokyo-border)] rounded-lg text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] active:bg-[var(--tokyo-hover)] cursor-pointer group"
                    >
                      <span className="text-sm font-medium flex-1 text-left">Quick actions</span>
                      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded border border-[var(--tokyo-border-strong)] bg-transparent">
                        <span className="text-sm leading-none font-sans">⌘</span>
                        <span className="text-xs leading-none font-sans">K</span>
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
                          src={activeProfilePhoto} 
                          alt={activeProfileName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </button>

                      {isProfileOpen && (
                          <div 
                            className="dayline-dialog absolute top-0 left-full ml-2 w-56 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 z-[160] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-2 border-b border-[var(--tokyo-border)] mb-1">
                              <p className="dayline-dialog-heading text-xs font-medium text-[var(--tokyo-text-faint)]">Account</p>
                            </div>
                            <button onClick={openProfileEditor} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
                              <User className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                              Profile
                            </button>
                            <button onClick={openSettings} className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer">
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
                            {renderAboutMenuItems()}
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

                  <div>
                    <button 
                      onClick={() => onOpenCommandPalette()}
                      className="w-full flex items-center justify-center bg-transparent border border-[var(--tokyo-border)] hover:bg-[var(--tokyo-hover)] active:bg-[var(--tokyo-hover)] text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text)] rounded-md py-1.5 cursor-pointer"
                      title="Quick actions"
                    >
                      <Search className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )}              <div className="px-4 mt-1 space-y-0.5">
                <button onClick={() => onViewChange('inbox')} className={cn("w-full flex items-center rounded-md py-1.5 cursor-pointer group", isCollapsed ? "justify-center" : "px-3 gap-2", currentView === 'inbox' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Inbox className="w-4 h-4 text-[#45aaff] shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">Inbox</span>
                        <span className={cn("text-xs font-medium", currentView === 'inbox' ? "text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)]")}>2</span>
                      </>
                    )}
                  </button>

                  <button onClick={() => onViewChange('today')} className={cn("w-full flex items-center rounded-md py-1.5 cursor-pointer group", isCollapsed ? "justify-center" : "px-3 gap-2", currentView === 'today' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Star className="w-4 h-4 text-[var(--tokyo-yellow)] shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">Today</span>
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[var(--tokyo-pink)] text-white text-xs font-bold">1</span>
                      </>
                    )}
                  </button>

                  <button onClick={() => onViewChange('upcoming')} className={cn("w-full flex items-center rounded-md py-1.5 cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-2", currentView === 'upcoming' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <CalendarIcon className="w-4 h-4 text-[var(--tokyo-pink)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Upcoming</span>}
                  </button>

                  <button onClick={() => onViewChange('someday')} className={cn("w-full flex items-center rounded-md py-1.5 cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-2", currentView === 'someday' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <Clock className="w-4 h-4 text-[var(--tokyo-purple)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Someday</span>}
                  </button>

                  <button onClick={() => onViewChange('logbook')} className={cn("w-full flex items-center rounded-md py-1.5 cursor-pointer", isCollapsed ? "justify-center" : "px-3 gap-2", currentView === 'logbook' ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]")}>
                    <BookCheck className="w-4 h-4 text-[var(--tokyo-green)] shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium flex-1 text-left">Logbook</span>}
                  </button>
              </div>
                <div className="h-px bg-[var(--tokyo-border)] my-2.5 mx-7" />
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
                    editingParentId={editingParentId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    handleRenameSubmit={handleRenameSubmit}
                    setEditingId={setEditingId}
                    onViewChange={onViewChange}
                    handleContextMenu={handleContextMenu}
                    handleSidebarItemClick={handleSidebarItemClick}
                    handleSidebarItemPointerDown={handleSidebarItemPointerDown}
                    setIconPickerId={setIconPickerId}
                    setIconPickerParentId={setIconPickerParentId}
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
                    onCreateDatabaseInFolder={handleNewDatabasePage}
                    onCreateDocumentInFolder={handleNewDocumentPage}
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
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white cursor-pointer group"
                    >
                      <Plus className="w-4 h-4 shrink-0 text-[var(--tokyo-text-faint)] group-hover:text-white" />
                      <span className="text-sm font-medium flex-1 text-left text-[var(--tokyo-text)] group-hover:text-white">New Item</span>
                    </button>
                    
                    {isNewItemMenuOpen && (
                      <div className="sidebar-context-menu absolute bottom-full left-0 mb-2 w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-lg py-1 z-[160] overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-100">
                        <button 
                          onClick={() => {
                            handleNewDatabasePage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Database
                        </button>
                        <button 
                          onClick={() => {
                            handleNewDocumentPage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Document
                        </button>
                        <button 
                          onClick={handleNewFolder}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Category
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => onViewChange('trash')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer group",
                      currentView === 'trash'
                        ? "bg-[rgba(224,107,138,0.14)] text-[var(--tokyo-pink)]"
                        : "text-[var(--tokyo-pink)] hover:bg-[rgba(224,107,138,0.1)]"
                    )}
                  >
                    <Trash2 className="w-4 h-4 shrink-0 text-current" />
                    <span className="text-sm font-medium flex-1 text-left">Trash</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative" ref={newItemMenuRef}>
                    <button 
                      onClick={() => setIsNewItemMenuOpen(!isNewItemMenuOpen)}
                      className="p-2 text-[var(--tokyo-text-faint)] hover:text-white cursor-pointer" 
                      title="New Item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    
                    {isNewItemMenuOpen && (
                      <div className="sidebar-context-menu absolute bottom-0 left-full ml-2 w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-lg py-1 z-[160] overflow-hidden animate-in fade-in slide-in-from-left-1 duration-100">
                        <button 
                          onClick={() => {
                            handleNewDatabasePage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Database className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Database
                        </button>
                        <button 
                          onClick={() => {
                            handleNewDocumentPage();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Document
                        </button>
                        <button 
                          onClick={() => {
                            handleNewFolder();
                            setIsNewItemMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
                          New Category
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onViewChange('trash')}
                    className={cn(
                      "p-2 rounded-md cursor-pointer",
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
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
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
                contextMenu.id === 'favourites' ? (
                  <>
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        setEditValue(sidebarItems.find(i => i.id === 'favourites')?.label || 'Favourites');
                        setEditingId('favourites');
                        setEditingParentId(undefined);
                        setContextMenu(null);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    <div className="h-px bg-[var(--tokyo-border)] my-1" />
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-yellow)] hover:bg-yellow-500/10 hover:text-[var(--tokyo-yellow)] transition-colors cursor-pointer"
                      onClick={() => {
                        // Unfavorite everything!
                        notes.forEach(n => { if (n.isFavorite) updateNote({ ...n, isFavorite: false }); });
                        projects.forEach(p => { if (p.isFavorite) updateProject(p.id, { isFavorite: false }); });
                        goals.forEach(g => { if (g.isFavorite) updateGoal({ ...g, isFavorite: false }); });
                        areas.forEach(a => { if (a.isFavorite) updateArea(a.id, { isFavorite: false }); });
                        customPages.forEach(p => {
                          let changed = false;
                          const nextItems = p.items?.map(item => {
                            if (item.isFavorite) {
                              changed = true;
                              return { ...item, isFavorite: false };
                            }
                            return item;
                          }) || [];
                          if (p.isFavorite || changed) {
                            updateCustomPage({ ...p, isFavorite: false, items: nextItems });
                          }
                        });
                        if (sidebarItems.some(item => item.isFavorite)) {
                          reorderSidebarItems(sidebarItems.map(item => (
                            item.isFavorite ? { ...item, isFavorite: false } : item
                          )));
                        }
                        setContextMenu(null);
                      }}
                    >
                      <Star className="w-3.5 h-3.5 shrink-0" color="#e9ca35" fill="#e9ca35" strokeWidth={0} />
                      Unpin All
                    </button>
                  </>
                ) : (contextMenu.parentId === 'favourites' || (!sidebarItems.some(i => i.id === contextMenu.id) && contextMenu.id !== 'favourites')) ? (
                  <>
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        const note = notes.find(n => n.id === contextMenu.id);
                        const project = projects.find(p => p.id === contextMenu.id);
                        const goal = goals.find(g => g.id === contextMenu.id);
                        const area = areas.find(a => a.id === contextMenu.id);
                        const customPage = customPages.find(p => p.id === contextMenu.id);
                        const sidebarItem = sidebarItems.find(i => i.id === contextMenu.id);
                        
                        let pageItem: any = null;
                        customPages.forEach(p => {
                          if (p.items) {
                            const found = p.items.find(item => item.id === contextMenu.id);
                            if (found) pageItem = found;
                          }
                        });

                        const currentLabel = note?.title || project?.name || goal?.title || area?.name || customPage?.title || pageItem?.title || sidebarItem?.label || '';
                        setEditValue(currentLabel);
                        setEditingId(contextMenu.id);
                        setEditingParentId(contextMenu.parentId || 'favourites');
                        setContextMenu(null);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        setIconPickerId(contextMenu.id);
                        setIconPickerParentId(contextMenu.parentId || 'favourites');
                        setIconPickerPos({ x: contextMenu.x, y: contextMenu.y });
                        setContextMenu(null);
                      }}
                    >
                      <Smile className="w-3.5 h-3.5" />
                      Change Icon
                    </button>
                    <div className="h-px bg-[var(--tokyo-border)] my-1" />
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-yellow)] hover:bg-yellow-500/10 hover:text-[var(--tokyo-yellow)] transition-colors cursor-pointer"
                      onClick={() => {
                        const note = notes.find(n => n.id === contextMenu.id);
                        const project = projects.find(p => p.id === contextMenu.id);
                        const goal = goals.find(g => g.id === contextMenu.id);
                        const area = areas.find(a => a.id === contextMenu.id);
                        const customPage = customPages.find(p => p.id === contextMenu.id);

                        if (note) updateNote({ ...note, isFavorite: false });
                        if (project) updateProject(project.id, { isFavorite: false });
                        if (goal) updateGoal({ ...goal, isFavorite: false });
                        if (area) updateArea(area.id, { isFavorite: false });
                        if (customPage) updateCustomPage({ ...customPage, isFavorite: false });
                        if (!note && !project && !goal && !area && !customPage) {
                          const sidebarItem = sidebarItems.find(i => i.id === contextMenu.id);
                          if (sidebarItem) {
                            setSidebarItemFavorite(sidebarItem.id, false);
                          }
                        }

                        // Also handle custom page items
                        customPages.forEach(p => {
                          if (p.items) {
                            const found = p.items.find(item => item.id === contextMenu.id);
                            if (found) {
                              const nextItems = p.items.map(item => item.id === contextMenu.id ? { ...item, isFavorite: false } : item);
                              updateCustomPage({ ...p, items: nextItems });
                            }
                          }
                        });

                        setContextMenu(null);
                      }}
                    >
                      <Star className="w-3.5 h-3.5 shrink-0" color="#e9ca35" fill="#e9ca35" strokeWidth={0} />
                      Remove Favourite
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                      onClick={() => {
                        const item = sidebarItems.find(i => i.id === contextMenu.id);
                        if (item) {
                          setEditValue(item.label);
                          setEditingId(contextMenu.id);
                          setEditingParentId(contextMenu.parentId);
                        }
                        setContextMenu(null);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    {!fixedSidebarItemIds.has(contextMenu.id) && (
                      <button 
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        onClick={() => {
                          if (contextMenu.id !== 'favourites') {
                            duplicateSidebarItem(contextMenu.id);
                          }
                          setContextMenu(null);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </button>
                    )}
                    {sidebarItems.find(i => i.id === contextMenu.id)?.type !== 'folder' && contextMenu.id !== 'favourites' && (
                      <button 
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                        onClick={() => {
                          const item = sidebarItems.find(i => i.id === contextMenu.id);
                          if (item) {
                            setIconPickerId(item.id);
                            setIconPickerParentId(item.parentId);
                            setIconPickerPos({ x: contextMenu.x, y: contextMenu.y });
                          }
                          setContextMenu(null);
                        }}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        Change Icon
                      </button>
                    )}
                    {(() => {
                      const item = sidebarItems.find(i => i.id === contextMenu.id);
                      const page = customPages.find(p => p.id === contextMenu.id);
                      const isFavorite = page?.isFavorite || item?.isFavorite || false;
                      return item?.type !== 'folder' && item?.type !== 'trash' && contextMenu.id !== 'favourites' ? (
                        <button 
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] hover:text-white transition-colors cursor-pointer"
                          onClick={() => {
                            setPageFavorite(contextMenu.id, !isFavorite);
                            setContextMenu(null);
                          }}
                        >
                          {isFavorite ? (
                            <Star className="w-3.5 h-3.5 shrink-0" color="#e9ca35" fill="#e9ca35" strokeWidth={0} />
                          ) : (
                            <Star className="w-3.5 h-3.5 shrink-0 text-[var(--tokyo-text-faint)]" />
                          )}
                          {isFavorite ? 'Remove Favourite' : 'Add to Favourites'}
                        </button>
                      ) : null;
                    })()}
                    {!fixedSidebarItemIds.has(contextMenu.id) && (
                      <>
                        <div className="h-px bg-[var(--tokyo-border)] my-1" />
                        <button 
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] leading-5 font-medium text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] hover:text-[var(--tokyo-pink)] transition-colors cursor-pointer"
                          onClick={() => {
                            if (contextMenu.id === 'favourites') {
                          // Unfavorite everything!
                          notes.forEach(n => { if (n.isFavorite) updateNote({ ...n, isFavorite: false }); });
                          projects.forEach(p => { if (p.isFavorite) updateProject(p.id, { isFavorite: false }); });
                          goals.forEach(g => { if (g.isFavorite) updateGoal({ ...g, isFavorite: false }); });
                          areas.forEach(a => { if (a.isFavorite) updateArea(a.id, { isFavorite: false }); });
                          customPages.forEach(p => {
                            let changed = false;
                            const nextItems = p.items.map(item => {
                              if (item.isFavorite) {
                                changed = true;
                                return { ...item, isFavorite: false };
                              }
                              return item;
                            });
                            if (p.isFavorite || changed) {
                              updateCustomPage({ ...p, isFavorite: false, items: nextItems });
                            }
                          });
                          if (sidebarItems.some(item => item.isFavorite)) {
                            reorderSidebarItems(sidebarItems.map(item => (
                              item.isFavorite ? { ...item, isFavorite: false } : item
                            )));
                          }
                        } else {
                          deleteSidebarItem(contextMenu.id);
                          if (currentView === contextMenu.id) {
                            onViewChange('dashboard');
                          }
                        }
                        setContextMenu(null);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </>
                    )}
                  </>
                )
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
              currentIcon={(() => {
                const note = notes.find(n => n.id === iconPickerId);
                const project = projects.find(p => p.id === iconPickerId);
                const goal = goals.find(g => g.id === iconPickerId);
                const area = areas.find(a => a.id === iconPickerId);
                const customPage = customPages.find(p => p.id === iconPickerId);
                
                let pageItem: any = null;
                customPages.forEach(p => {
                  if (p.items) {
                    const found = p.items.find(item => item.id === iconPickerId);
                    if (found) pageItem = found;
                  }
                });

                const item = sidebarItems.find(i => i.id === iconPickerId);
                
                return note?.icon || project?.icon || goal?.icon || area?.icon || customPage?.icon || pageItem?.icon || item?.icon || 'File';
              })()}
              onSelect={(iconName) => {
                const note = notes.find(n => n.id === iconPickerId);
                const project = projects.find(p => p.id === iconPickerId);
                const goal = goals.find(g => g.id === iconPickerId);
                const area = areas.find(a => a.id === iconPickerId);
                const customPage = customPages.find(p => p.id === iconPickerId);
                const item = sidebarItems.find(i => i.id === iconPickerId);

                if (note) updateNote({ ...note, icon: iconName });
                else if (project) updateProject(project.id, { icon: iconName });
                else if (goal) updateGoal({ ...goal, icon: iconName });
                else if (area) updateArea(area.id, { icon: iconName });
                else if (customPage) updateCustomPage({ ...customPage, icon: iconName });
                
                // Also handle custom page items
                customPages.forEach(p => {
                  if (p.items) {
                    const found = p.items.find(item => item.id === iconPickerId);
                    if (found) {
                      const nextItems = p.items.map(item => item.id === iconPickerId ? { ...item, icon: iconName } : item);
                      updateCustomPage({ ...p, items: nextItems });
                    }
                  }
                });

                if (item) {
                  updateSidebarItem(item.id, item.label, iconName);
                }
                setIconPickerId(null);
                setIconPickerParentId(undefined);
              }}
              onClose={() => { setIconPickerId(null); setIconPickerParentId(undefined); }}
              onRemove={() => {
                const note = notes.find(n => n.id === iconPickerId);
                const project = projects.find(p => p.id === iconPickerId);
                const goal = goals.find(g => g.id === iconPickerId);
                const area = areas.find(a => a.id === iconPickerId);
                const item = sidebarItems.find(i => i.id === iconPickerId);

                if (note) updateNote({ ...note, icon: undefined });
                else if (project) updateProject(project.id, { icon: undefined });
                else if (goal) updateGoal({ ...goal, icon: undefined });
                else if (area) updateArea(area.id, { icon: undefined });
                else if (customPages.find(p => p.id === iconPickerId)) {
                  const customPage = customPages.find(p => p.id === iconPickerId);
                  if (customPage) updateCustomPage({ ...customPage, icon: undefined });
                }
                
                // Also handle custom page items
                customPages.forEach(p => {
                  if (p.items) {
                    const found = p.items.find(item => item.id === iconPickerId);
                    if (found) {
                      const nextItems = p.items.map(item => item.id === iconPickerId ? { ...item, icon: undefined } : item);
                      updateCustomPage({ ...p, items: nextItems });
                    }
                  }
                });

                if (item) {
                  updateSidebarItem(item.id, item.label, 'File');
                }
                setIconPickerId(null);
                setIconPickerParentId(undefined);
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
  editingParentId,
  editValue,
  setEditValue,
  handleRenameSubmit,
  setEditingId,
  onViewChange,
  handleContextMenu,
  handleSidebarItemClick,
  handleSidebarItemPointerDown,
  setIconPickerId,
  setIconPickerParentId,
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
  primaryDraggingSidebarItemId,
  onCreateDatabaseInFolder,
  onCreateDocumentInFolder
}: any) {
  const isFolder = item.type === 'folder';
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [createMenuPos, setCreateMenuPos] = useState<{ top: number; left: number } | null>(null);
  const store = useAppStore();
  const isSharedItem = (candidate: any) => (
    Boolean(candidate?.isShared) ||
    (Array.isArray(candidate?.sharedWith) && candidate.sharedWith.length > 0)
  );

  const children = item.id === 'favourites' 
    ? (() => {
        const favoritedAreas = (store.areas || []).filter(a => a.isFavorite).map(area => ({
          id: area.id,
          parentId: 'favourites',
          label: area.name,
          icon: area.icon || 'Layers',
          type: 'custom',
          view: `area-details:${area.id}`,
        }));

        const favoritedProjects = (store.projects || []).filter(p => p.isFavorite).map(project => ({
          id: project.id,
          parentId: 'favourites',
          label: project.name,
          icon: project.icon || 'Folder',
          type: 'custom',
          view: `project-details:${project.id}`,
        }));

        const favoritedGoals = (store.goals || []).filter(g => g.isFavorite).map(goal => ({
          id: goal.id,
          parentId: 'favourites',
          label: goal.title,
          icon: goal.icon || 'Target',
          type: 'custom',
          view: `goal-details:${goal.id}`,
        }));

        const favoritedNotes = (store.notes || []).filter(n => n.isFavorite).map(note => ({
          id: note.id,
          parentId: 'favourites',
          label: note.title || 'Untitled Note',
          icon: note.icon || 'Pencil',
          type: 'custom',
          view: `note-details:${note.id}`,
        }));

        const favoritedCustomPages = (store.customPages || []).filter(page => page.isFavorite).map(page => ({
          id: page.id,
          parentId: 'favourites',
          label: page.title || 'Untitled Page',
          icon: page.icon || 'FileText',
          type: 'custom',
          view: `page-${page.id}`,
        }));

        const favoritedSidebarItems = (store.sidebarItems || [])
          .filter(sidebarItem => (
            sidebarItem.isFavorite &&
            sidebarItem.id !== 'favourites' &&
            sidebarItem.type !== 'folder' &&
            sidebarItem.type !== 'trash' &&
            !(store.customPages || []).some(page => page.id === sidebarItem.id)
          ))
          .map(sidebarItem => ({
            ...sidebarItem,
            parentId: 'favourites',
            view: sidebarItem.id,
          }));

        const favoritedPageItems: any[] = [];
        (store.customPages || []).forEach(page => {
          if (page.items) {
            page.items.forEach(cItem => {
              if (cItem.isFavorite) {
                favoritedPageItems.push({
                  id: cItem.id,
                  parentId: 'favourites',
                  label: cItem.title || 'Untitled Item',
                  icon: cItem.icon || 'FileText',
                  type: 'custom',
                  view: `page-item:${page.id}:${cItem.id}`,
                  badge: page.title,
                });
              }
            });
          }
        });

        return [
          ...favoritedAreas,
          ...favoritedProjects,
          ...favoritedGoals,
          ...favoritedNotes,
          ...favoritedCustomPages,
          ...favoritedSidebarItems,
          ...favoritedPageItems,
        ];
      })()
    : item.id === 'shared'
      ? (() => {
          const sharedCustomPages = (store.customPages || [])
            .filter(page => isSharedItem(page))
            .map(page => ({
              id: page.id,
              parentId: 'shared',
              label: page.title || 'Untitled Page',
              icon: page.icon || (page.kind === 'database' ? 'Database' : 'FileText'),
              type: 'custom',
              view: `page-${page.id}`,
            }));

          const sharedSidebarItems = (store.sidebarItems || [])
            .filter(sidebarItem => (
              isSharedItem(sidebarItem) &&
              sidebarItem.id !== 'favourites' &&
              sidebarItem.id !== 'shared' &&
              sidebarItem.type !== 'folder' &&
              sidebarItem.type !== 'trash' &&
              !(store.customPages || []).some(page => page.id === sidebarItem.id)
            ))
            .map(sidebarItem => ({
              ...sidebarItem,
              parentId: 'shared',
              view: sidebarItem.id,
            }));

          return [
            ...sharedCustomPages,
            ...sharedSidebarItems,
          ];
        })()
    : sidebarItems.filter((i: any) => i.parentId === item.id);
  const isDraggingOver = dragOverId === item.id;
  const isSelected = selectedSidebarItemIds?.includes(item.id);
  const isDragging = draggingSidebarItemIds?.includes(item.id);
  const isDragStackAnchor = item.id === primaryDraggingSidebarItemId && draggingSidebarItemIds?.length > 1 && !isFolder;
  const isMergedIntoDragStack = draggingSidebarItemIds?.length > 1 && isDragging && !isDragStackAnchor;
  const dragStackCount = isDragStackAnchor ? draggingSidebarItemIds.length : 0;
  const showBulkDragSelection = isSelected && draggingSidebarItemIds?.length > 0;
  const isNestedItem = Boolean(item.parentId);

  if (isMergedIntoDragStack) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-0.5 relative",
        isMergedIntoDragStack ? "!mt-0 overflow-hidden" : "overflow-visible"
      )}
    >
      <div
        data-sidebar-item-id={item.id}
        draggable
        onDragStart={(e) => onDragStart(e, item.id, item.parentId)}
        onDragOver={(e) => onDragOver(e, item.id)}
        onDragLeave={(e) => onDragLeave(e)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, item.id)}
        onPointerDown={(e) => handleSidebarItemPointerDown(e, item.id, isFolder)}
        className={cn(
          "dayline-sidebar-row flex items-center rounded-md group relative select-none isolate overflow-visible",
          isNestedItem ? "py-1" : "py-1.5",
          isDragStackAnchor ? "w-[calc(100%-18px)]" : "w-full",
          "cursor-pointer",
          isCollapsed ? "justify-center" : isFolder ? "px-3 gap-1.5" : "px-3 gap-2",
          isDragStackAnchor
            ? "bg-transparent text-white z-20"
            : isActive || isSelected || showBulkDragSelection
            ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]"
            : isNestedItem
            ? "text-[var(--tokyo-text-muted)]/88 hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
            : "text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)]",
          isFolder && "font-semibold",
          isDraggingOver && dropPosition === 'middle' && "bg-white/20 scale-[1.02] ring-1 ring-white/30 z-10"
        )}
        title={isCollapsed ? item.label : undefined}
        onContextMenu={(e) => handleContextMenu(e, item.id, 'item', item.parentId)}
        onClick={(e) => {
          if (isFolder) {
            toggleFolderExpansion(item.id);
            return;
          }

          handleSidebarItemClick(e, item.id, isFolder, item);
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
              transition={{ duration: 0.08, ease: 'easeOut' }}
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
              transition={{ duration: 0.08, ease: 'easeOut' }}
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
          {isFolder ? (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpansion(item.id);
              }}
              className="rounded p-0.5 cursor-pointer"
              title={item.isExpanded ? 'Collapse category' : 'Expand category'}
            >
              <motion.span
                animate={{ rotate: item.isExpanded ? 90 : 0 }}
                transition={{ duration: 0.08 }}
                className="flex items-center justify-center"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[var(--tokyo-text-faint)]" />
              </motion.span>
            </button>
          ) : (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setIconPickerId(item.id);
                if (setIconPickerParentId) setIconPickerParentId(item.parentId);
                setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
              }}
              className={cn("rounded p-0.5 transition-colors cursor-pointer", !isSelected && "hover:bg-[var(--tokyo-hover)]")}
            >
              <Icon className={cn(
                "w-4 h-4 shrink-0 stroke-[1.5]",
                isActive || isSelected ? "opacity-100" : isNestedItem ? "opacity-72" : "opacity-70"
              )} />
            </button>
          )}
        </div>
        {!isCollapsed && (
          (editingId === item.id && editingParentId === item.parentId) ? (
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
              {isFolder && item.id !== 'favourites' && item.id !== 'shared' && (
                <div className="relative ml-2 shrink-0">
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const menuWidth = 168;
                      setCreateMenuPos({
                        top: Math.min(rect.bottom + 6, window.innerHeight - 96),
                        left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
                      });
                      setIsCreateMenuOpen(open => !open);
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded text-[var(--tokyo-text-faint)] opacity-0 transition-[opacity,background-color,color] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)] group-hover:opacity-100"
                    title="Create in category"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  {isCreateMenuOpen && createMenuPos && createPortal(
                    <>
                      <div
                        className="fixed inset-0 z-[240]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreateMenuOpen(false);
                        }}
                      />
                      <div
                        className="sidebar-context-menu fixed z-[250] w-[168px] overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1 shadow-2xl"
                        style={{ top: createMenuPos.top, left: createMenuPos.left }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onCreateDatabaseInFolder(item.id);
                            setIsCreateMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-medium text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
                        >
                          <Database className="h-3.5 w-3.5 text-[var(--tokyo-text-faint)]" />
                          New Database
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCreateDocumentInFolder(item.id);
                            setIsCreateMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-medium text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-white"
                        >
                          <FileText className="h-3.5 w-3.5 text-[var(--tokyo-text-faint)]" />
                          New Document
                        </button>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              )}
              {dragStackCount > 0 && (
                <motion.span
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.08, ease: 'easeOut' }}
                  className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FFE08A] px-1.5 text-[11px] font-bold text-[#2A1E05] shadow-sm"
                >
                  {dragStackCount}
                </motion.span>
              )}
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {isFolder && item.isExpanded && !isCollapsed && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -2 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -2 }}
            transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
            className="ml-6 mt-0.5 space-y-0.5 overflow-hidden pl-1 pr-1"
          >
            {children.map((child: any) => {
              const ChildIcon = iconMap[child.icon] || File;
              return (
                <SidebarItem
                  key={child.id}
                  item={child}
                  isActive={child.view ? currentView === child.view : currentView === child.id}
                  isCollapsed={isCollapsed}
                  editingId={editingId}
                  editingParentId={editingParentId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  handleRenameSubmit={handleRenameSubmit}
                  setEditingId={setEditingId}
                  onViewChange={onViewChange}
                  handleContextMenu={handleContextMenu}
                  handleSidebarItemClick={handleSidebarItemClick}
                  handleSidebarItemPointerDown={handleSidebarItemPointerDown}
                  setIconPickerId={setIconPickerId}
                  setIconPickerParentId={setIconPickerParentId}
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
                  onCreateDatabaseInFolder={onCreateDatabaseInFolder}
                  onCreateDocumentInFolder={onCreateDocumentInFolder}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
