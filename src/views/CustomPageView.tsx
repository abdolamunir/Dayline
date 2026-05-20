import React, { useState } from 'react';
import { CustomPage, CustomPageItem } from '../types';
import { useAppStore } from '../store';
import { 
  File01Icon as FileIcon, 
  Add01Icon as Plus, 
  TextIcon as Type, 
  HashtagIcon as Hash, 
  ListViewIcon as List, 
  Calendar01Icon as CalendarIcon, 
  DashboardSquare01Icon as LayoutGrid,
  MoreHorizontalIcon as MoreHorizontal,
  Cancel01Icon as X,
  UserGroupIcon as Users,
  ZapIcon as Zap,
  CheckmarkCircle02Icon as CheckCircle,
  UserIcon as User,
  SmileIcon as Smile,
  AtIcon as AtSign,
  Link01Icon as Link,
  HashtagIcon as Hashtag,
  AttachmentIcon as Attachment,
  Message02Icon as MessageSquare,
  Activity01Icon as Activity,
  CircleIcon as Circle,
  StarIcon as Star
} from 'hugeicons-react';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';
import { BlockEditor } from '../components/BlockEditor';
import { WorkspacePage, WorkspaceHeader, ToolButton } from '../components/ui/DatabaseSurface';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';

interface CustomPageViewProps {
  page: CustomPage;
  onViewChange?: (view: string) => void;
}

export function CustomPageView({ page, onViewChange }: CustomPageViewProps) {
  const { updateCustomPage } = useAppStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    id: string;
    pos: { x: number, y: number };
    currentDate?: Date;
  } | null>(null);

  const selectedItem = selectedItemId ? page.items.find(i => i.id === selectedItemId) : null;

  if (selectedItem) {
    return (
      <CustomPageItemDetails 
        item={selectedItem}
        page={page}
        onBack={() => setSelectedItemId(null)}
        onUpdateItem={(updatedItem) => {
          const newItems = page.items.map(i => i.id === updatedItem.id ? updatedItem : i);
          updateCustomPage({ ...page, items: newItems });
        }}
      />
    );
  }

  if ((page.kind !== 'document') && page.tabs && page.tabs.length > 0 && page.columns && page.columns.length > 0) {
    return (
      <TableView 
        page={page} 
        onUpdatePage={(updatedPage) => updateCustomPage(updatedPage)}
        onItemClick={(itemId) => setSelectedItemId(itemId)}
      />
    );
  }

  const Icon = ALL_ICONS[page.icon] || FileIcon;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updateCustomPage({ ...page, title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCustomPage({ ...page, content: e.target.value });
  };

  const handleIconClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
    setIsIconPickerOpen(true);
  };

  const addProperty = (type: 'text' | 'number' | 'select' | 'date') => {
    const newProp = {
      id: `prop-${Date.now()}`,
      name: `New ${type}`,
      type,
      value: ''
    };
    updateCustomPage({ ...page, properties: [...page.properties, newProp] });
  };

  const updateProperty = (id: string, field: 'name' | 'value', val: any) => {
    const newProps = page.properties.map(p => p.id === id ? { ...p, [field]: val } : p);
    updateCustomPage({ ...page, properties: newProps });
  };

  const getPropIcon = (type: string) => {
    switch(type) {
      case 'text': return <Type className="w-4 h-4 text-[var(--tokyo-text-faint)]" />;
      case 'number': return <Hash className="w-4 h-4 text-[var(--tokyo-text-faint)]" />;
      case 'select': return <List className="w-4 h-4 text-[var(--tokyo-text-faint)]" />;
      case 'date': return <CalendarIcon className="w-4 h-4 text-[var(--tokyo-text-faint)]" />;
      default: return <FileIcon className="w-4 h-4 text-[var(--tokyo-text-faint)]" />;
    }
  };

  return (
    <WorkspacePage className="max-w-5xl">
      <WorkspaceHeader
        icon={<Icon className="h-4 w-4" />}
        title={
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full bg-transparent text-[22px] font-semibold leading-tight text-[var(--tokyo-text-strong)] outline-none placeholder:text-white/18 md:text-2xl"
          />
        }
        description="Document page"
        actions={
          <ToolButton onClick={handleIconClick} title="Change icon">
            Change icon
          </ToolButton>
        }
      />

      <div className="group relative">
        <div className="hidden pt-2">
          <button 
            onClick={handleIconClick}
            className="p-2 hover:bg-[var(--tokyo-hover)] rounded-xl text-[var(--tokyo-text-muted)] hover:text-white transition-colors cursor-pointer"
            title="Change icon"
          >
            <Icon className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>

        {isIconPickerOpen && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsIconPickerOpen(false)} />
            <div 
              className="fixed z-[120]"
              style={{ 
                top: Math.min(iconPickerPos.y, window.innerHeight - 350), 
                left: Math.min(iconPickerPos.x, window.innerWidth - 280) 
              }}
            >
              <IconPicker 
                currentIcon={page.icon}
                onSelect={(iconName) => {
                  updateCustomPage({ ...page, icon: iconName });
                  setIsIconPickerOpen(false);
                }}
                onClose={() => setIsIconPickerOpen(false)}
                onRemove={() => {
                  updateCustomPage({ ...page, icon: 'File' });
                  setIsIconPickerOpen(false);
                }}
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
                top: Math.min(datePickerConfig.pos.y, window.innerHeight - 350), 
                left: Math.min(datePickerConfig.pos.x, window.innerWidth - 280) 
              }}
            >
              <DatePicker 
                selectedDate={datePickerConfig.currentDate}
                onSelect={(date) => {
                  updateProperty(datePickerConfig.id, 'value', date.toISOString());
                  setDatePickerConfig(null);
                }}
                onClose={() => setDatePickerConfig(null)}
              />
            </div>
          </>
        )}
      </div>

      <div className="space-y-2 border-b border-white/[0.06] py-3">
        {page.properties.map(prop => (
          <div key={prop.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop">
            <div className="w-full sm:w-48 flex items-center gap-2 text-[var(--tokyo-text-muted)]">
              {getPropIcon(prop.type)}
              <input
                type="text"
                value={prop.name}
                onChange={(e) => updateProperty(prop.id, 'name', e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full hover:bg-[var(--tokyo-hover)] px-1 py-0.5 rounded"
              />
            </div>
            <div className="flex-1">
              {prop.type === 'date' ? (
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDatePickerConfig({
                      id: prop.id,
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentDate: prop.value ? new Date(prop.value) : undefined
                    });
                  }}
                  className="text-sm w-full text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  {prop.value ? format(new Date(prop.value), 'MMM d, yyyy') : 'Empty'}
                </div>
              ) : (
                <input
                  type={prop.type === 'number' ? 'number' : 'text'}
                  value={prop.value}
                  onChange={(e) => updateProperty(prop.id, 'value', e.target.value)}
                  placeholder="Empty"
                  className="bg-transparent border-none outline-none text-sm w-full text-[var(--tokyo-text)] placeholder:text-white/20 hover:bg-[var(--tokyo-hover)] px-2 py-1 rounded"
                />
              )}
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <div className="dropdown relative inline-block">
            <button className="flex items-center gap-1 text-[12px] font-medium text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] px-2 py-1 rounded transition-colors cursor-pointer">
              <Plus className="w-3 h-3" /> Add a property
            </button>
            <div className="dropdown-content absolute left-0 mt-1 w-48 bg-[var(--tokyo-panel-2)] rounded-md shadow-xl border border-[var(--tokyo-border-strong)] hidden opacity-0 z-10 py-1">
              <button onClick={() => addProperty('text')} className="w-full text-left px-4 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2 cursor-pointer"><Type className="w-4 h-4" /> Text</button>
              <button onClick={() => addProperty('number')} className="w-full text-left px-4 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2 cursor-pointer"><Hash className="w-4 h-4" /> Number</button>
              <button onClick={() => addProperty('select')} className="w-full text-left px-4 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2 cursor-pointer"><List className="w-4 h-4" /> Select</button>
              <button onClick={() => addProperty('date')} className="w-full text-left px-4 py-1.5 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2 cursor-pointer"><CalendarIcon className="w-4 h-4" /> Date</button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-[55vh] py-5 text-[var(--tokyo-text-strong)]">
        <BlockEditor
          initialContent={content}
          onChange={(nextContent) => {
            setContent(nextContent);
            updateCustomPage({ ...page, content: nextContent });
          }}
        />
      </div>
      
      <style>{`
        .dropdown:hover .dropdown-content {
          display: block;
          opacity: 1;
        }
      `}</style>
    </WorkspacePage>
  );
}

function CustomPageItemDetails({ item, page, onBack, onUpdateItem }: {
  item: CustomPageItem;
  page: CustomPage;
  onBack: () => void;
  onUpdateItem: (item: CustomPageItem) => void;
}) {
  const { user, updateCustomPage } = useAppStore();
  const [activeTab, setActiveTab] = useState('Overview');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      name: 'Stephen Robert',
      avatar: 'https://i.pravatar.cc/150?u=4',
      time: '50m ago',
      text: 'Create a comprehensive set of UI components, ensuring consistency in style and functionality.',
      reactions: [{ emoji: '👍', count: 1 }]
    },
    {
      id: 2,
      name: 'Raheem Sterling',
      avatar: 'https://i.pravatar.cc/150?u=2',
      time: '25m ago',
      text: 'I will do it ASAP.'
    }
  ]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    type: 'status' | 'priority' | string;
    pos: { x: number, y: number };
    currentValue: string;
    propId?: string;
  } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    pos: { x: number, y: number };
    currentDate?: Date;
    propId?: string;
  } | null>(null);

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    const formatted = str.replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
  };

  const updateProperty = (propId: string, value: any) => {
    onUpdateItem({
      ...item,
      properties: {
        ...item.properties,
        [propId]: value
      }
    });
  };

  const handleDeleteProperty = (propId: string) => {
    const newProps = page.properties.filter(p => p.id !== propId);
    const newItemProperties = { ...item.properties };
    delete newItemProperties[propId];
    updateCustomPage({
      ...page,
      properties: newProps,
      items: page.items.map(i => i.id === item.id ? { ...i, properties: newItemProperties } : i)
    });
  };

  const addProperty = (type: 'text' | 'number' | 'select' | 'date') => {
    const newProp = {
      id: `prop-${Date.now()}`,
      name: `New ${type}`,
      type,
      value: ''
    };
    updateCustomPage({ ...page, properties: [...page.properties, newProp] });
    setIsPropertyPickerOpen(false);
  };

  const handleDelete = () => {
    const newItems = page.items.filter(i => i.id !== item.id);
    updateCustomPage({ ...page, items: newItems });
    onBack();
  };

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#item-details:${item.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    setComments([
      {
        id: Date.now(),
        name: 'Abdola Munir',
        avatar: user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff',
        time: 'Just now',
        text: commentText.trim()
      },
      ...comments
    ]);
    setCommentText('');
  };

  const propertyRowClass = "flex items-center h-9 -mx-3 px-3 group";

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full w-full flex-1">
        {/* Header */}
        <div className="flex-shrink-0 w-full">
          <div className="mb-5 flex items-center gap-3">
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                setIsIconPickerOpen(true);
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
            >
              {React.createElement(ALL_ICONS[item.icon] || FileIcon, { className: "w-6 h-6" })}
            </div>
            <div className="min-w-0 flex-1">
              <input 
                type="text"
                value={item.title}
                onChange={(e) => onUpdateItem({ ...item, title: e.target.value })}
                className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                placeholder="Untitled Item"
              />
            </div>
            <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
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
              <button
                onClick={() => setIsShareMenuOpen((open) => !open)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                title="More"
              >
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </button>
              <button 
                onClick={onBack}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                title="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
              {isShareMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsShareMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                    <button
                      onClick={() => void handleCopyLink()}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                    >
                      <Link className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                      Copy page link
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <X className="h-4 w-4 text-red-400" />
                      Delete item
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Properties - Vertical List */}
        <div className="space-y-2 mb-12 max-w-3xl pl-2.5">
          {/* Status */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Status</span>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    type: 'status',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: item.status
                  });
                }}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7",
                  item.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                  item.status === 'in-progress' || item.status === 'inbox' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                  "bg-stone-500/20 text-stone-400"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  item.status === 'completed' ? "bg-[var(--tokyo-green)]" :
                  item.status === 'in-progress' || item.status === 'inbox' ? "bg-[var(--tokyo-purple)]" :
                  "bg-stone-400"
                )} />
                <span>{toSentenceCase(item.status)}</span>
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Priority</span>
              </div>
            </div>
            <div className="relative flex items-center">
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCustomDropdown({
                    type: 'priority',
                    pos: { x: rect.left, y: rect.bottom + 8 },
                    currentValue: item.priority
                  });
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] -ml-2.5 h-7 flex items-center",
                  getPriorityBadgeClasses(item.priority)
                )}
              >
                {toSentenceCase(item.priority)}
              </div>
            </div>
          </div>

          {/* Date */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                <span>Date</span>
              </div>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: item.date ? new Date(item.date) : undefined
                });
              }}
              className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white"
            >
              {item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'Set date...'}
            </div>
          </div>

          {/* Progress */}
          <div className={propertyRowClass}>
            <div className="w-40 shrink-0 flex items-center">
              <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                <Circle className="w-4 h-4" />
                <span>Progress</span>
              </div>
            </div>
            <div className="flex items-center hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 transition-all">
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]">
                <span className="text-[13px] font-medium">{item.progress}%</span>
              </div>
            </div>
          </div>

          {/* Custom Properties */}
          {page.properties.map(prop => (
            <div key={prop.id} className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-[145px] text-[var(--tokyo-text-faint)] text-sm font-medium">
                  {prop.type === 'date' ? <CalendarIcon className="w-4 h-4" /> :
                   prop.type === 'number' ? <Hash className="w-4 h-4" /> :
                   prop.type === 'select' ? <List className="w-4 h-4" /> :
                   <Type className="w-4 h-4" />}
                  <span>{prop.name}</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-4">
                {prop.type === 'date' ? (
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDatePickerConfig({
                        pos: { x: rect.left, y: rect.bottom + 8 },
                        currentDate: item.properties[prop.id] ? new Date(item.properties[prop.id]) : undefined,
                        propId: prop.id
                      });
                    }}
                    className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white flex-1"
                  >
                    {item.properties[prop.id] ? format(new Date(item.properties[prop.id]), 'MMM d, yyyy') : 'Empty'}
                  </div>
                ) : prop.type === 'select' ? (
                  <div 
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setCustomDropdown({
                        type: 'custom-select',
                        pos: { x: rect.left, y: rect.bottom + 8 },
                        currentValue: item.properties[prop.id] || '',
                        propId: prop.id
                      });
                    }}
                    className="text-[var(--tokyo-text-strong)] text-sm font-medium cursor-pointer hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 flex items-center transition-all hover:text-white flex-1"
                  >
                    {item.properties[prop.id] || 'Select...'}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center hover:bg-white/[0.03] px-2.5 -ml-2.5 rounded-lg h-7 transition-all group/val">
                    <input
                      type={prop.type === 'number' ? 'number' : 'text'}
                      value={item.properties[prop.id] || ''}
                      onChange={(e) => updateProperty(prop.id, e.target.value)}
                      placeholder="Empty"
                      className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-sm font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/10 outline-none focus:outline-none focus:ring-transparent shadow-none"
                    />
                  </div>
                )}
                <button 
                  onClick={() => handleDeleteProperty(prop.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Add property */}
          <div className="flex items-center h-8">
            <button 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPropertyPickerPos({ x: rect.left, y: rect.bottom + 8 });
                setIsPropertyPickerOpen(true);
              }}
              className="flex items-center gap-1.5 text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text-muted)] text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add property</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)]">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pl-2.5">
            {['Overview', 'Comments', 'Activity'].map(tabId => (
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
        <div className="flex-1 w-full pl-2.5 pt-4">
          {activeTab === 'Overview' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[12px] font-semibold text-[var(--tokyo-text-faint)] uppercase tracking-wider">Description</h3>
                <textarea
                  value={item.properties.description || ''}
                  onChange={(e) => updateProperty('description', e.target.value)}
                  placeholder="Add a description..."
                  className="w-full min-h-[200px] bg-transparent border-none outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/10 resize-none text-[13px] leading-relaxed focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent py-0 shadow-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'Comments' && (
            <>
              {/* Comment Input */}
              <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-xl p-3 mb-8">
                <div className="flex gap-2.5 mb-2.5">
                  <img src={user?.photoURL || "https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff"} className="w-7 h-7 rounded-full shrink-0 border border-white/5" alt="me" />
                  <textarea 
                    rows={1.5}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add your comment..." 
                    className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent focus-visible:ring-0 focus-visible:outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-xs resize-none py-0.5 shadow-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 text-[var(--tokyo-text-faint)]">
                    <button className="hover:text-white transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><AtSign className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Link className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Hashtag className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-white transition-colors cursor-pointer"><Attachment className="w-3.5 h-3.5" /></button>
                  </div>
                  <button 
                    onClick={handleAddComment}
                    className="bg-[var(--tokyo-yellow-dim)] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-lg shadow-black/20 cursor-pointer"
                  >
                    Comment
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-4 pb-20">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group bg-white/[0.01] border border-[var(--tokyo-border)] rounded-xl p-3.5 hover:bg-white/[0.02] transition-all">
                    <img src={comment.avatar} className="w-7 h-7 rounded-full shrink-0 border border-white/5" alt="avatar" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--tokyo-text-strong)] font-semibold text-xs">{comment.name}</span>
                          <span className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors text-[10px]">•</span>
                          <span className="text-[var(--tokyo-text-faint)] text-[10px]">{comment.time}</span>
                        </div>
                        <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[var(--tokyo-text)] text-xs leading-relaxed break-words">
                        {comment.text}
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors h-5 w-5 flex items-center justify-center rounded hover:bg-white/5 cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                        {comment.reactions?.map((reaction, ri) => (
                          <button key={ri} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--tokyo-yellow-soft)] border border-[var(--tokyo-yellow-dim)] text-[10px] text-[var(--tokyo-yellow)] font-medium hover:bg-[var(--tokyo-yellow-dim)]/20 transition-all h-5 cursor-pointer">
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                        <button className="text-[var(--tokyo-text-muted)] text-[11px] font-medium hover:text-white transition-colors ml-1 cursor-pointer">Reply</button>
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
      </div>

      {/* Popovers */}
      <AnimatePresence>
        {isIconPickerOpen && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsIconPickerOpen(false)} />
            <div 
              className="fixed z-[120]"
              style={{ top: iconPickerPos.y, left: iconPickerPos.x }}
            >
              <IconPicker 
                selectedIcon={item.icon || 'File01Icon'}
                onSelect={(iconName) => {
                  onUpdateItem({ ...item, icon: iconName });
                  setIsIconPickerOpen(false);
                }}
                onClose={() => setIsIconPickerOpen(false)}
              />
            </div>
          </>
        )}

        {isPropertyPickerOpen && propertyPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsPropertyPickerOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[120] bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] rounded-lg shadow-2xl py-1.5 w-48 overflow-hidden"
              style={{ top: propertyPickerPos.y, left: propertyPickerPos.x }}
            >
              <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--tokyo-text-faint)] uppercase tracking-wider">Property Types</div>
              <div className="space-y-0.5">
                <button onClick={() => addProperty('text')} className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2.5 cursor-pointer"><Type className="w-4 h-4 text-[var(--tokyo-text-faint)]" /> Text</button>
                <button onClick={() => addProperty('number')} className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2.5 cursor-pointer"><Hash className="w-4 h-4 text-[var(--tokyo-text-faint)]" /> Number</button>
                <button onClick={() => addProperty('select')} className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2.5 cursor-pointer"><List className="w-4 h-4 text-[var(--tokyo-text-faint)]" /> Select</button>
                <button onClick={() => addProperty('date')} className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] flex items-center gap-2.5 cursor-pointer"><CalendarIcon className="w-4 h-4 text-[var(--tokyo-text-faint)]" /> Date</button>
              </div>
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
                Select {toSentenceCase(customDropdown.type === 'custom-select' ? 'Option' : customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? page.tabs.map(t => t.id) : 
                  customDropdown.type === 'priority' ? ['low', 'medium', 'high'] :
                  customDropdown.propId ? (page.properties.find(p => p.id === customDropdown.propId)?.value || '').split(',').map((s: string) => s.trim()).filter(Boolean) : []
                ).map((option: string) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (customDropdown.type === 'status' || customDropdown.type === 'priority') {
                        onUpdateItem({ ...item, [customDropdown.type]: option });
                      } else if (customDropdown.propId) {
                        updateProperty(customDropdown.propId, option);
                      }
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left group cursor-pointer",
                      customDropdown.currentValue === option ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                    )}
                  >
                    <span>{toSentenceCase(option)}</span>
                  </button>
                ))}
                {customDropdown.type === 'custom-select' && customDropdown.propId && (
                  <div className="px-2 py-1 border-t border-[var(--tokyo-border)] mt-1.5">
                    <input
                      type="text"
                      placeholder="Add option..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const val = e.currentTarget.value.trim();
                          const prop = page.properties.find(p => p.id === customDropdown.propId);
                          const existingOptions = prop?.value ? prop.value.split(',').map((s: string) => s.trim()) : [];
                          if (!existingOptions.includes(val)) {
                            const newOptions = [...existingOptions, val].join(', ');
                            const newProps = page.properties.map(p => p.id === customDropdown.propId ? { ...p, value: newOptions } : p);
                            updateCustomPage({ ...page, properties: newProps });
                            updateProperty(customDropdown.propId, val);
                          } else {
                            updateProperty(customDropdown.propId, val);
                          }
                          e.currentTarget.value = '';
                          setCustomDropdown(null);
                        }
                      }}
                      className="w-full bg-transparent border-none p-0 text-xs text-[var(--tokyo-text-strong)] focus:ring-0 outline-none focus:outline-none focus:ring-transparent"
                    />
                  </div>
                )}
              </div>
            </motion.div>
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
                  if (datePickerConfig.propId) {
                    updateProperty(datePickerConfig.propId, date.toISOString());
                  } else {
                    onUpdateItem({ ...item, date: date.toISOString() });
                  }
                  setDatePickerConfig(null);
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
