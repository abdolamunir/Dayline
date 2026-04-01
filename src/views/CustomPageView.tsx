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
  CircleIcon as Circle
} from 'hugeicons-react';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

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

  // If the page has tabs and columns, render the TableView
  if (page.tabs && page.tabs.length > 0 && page.columns && page.columns.length > 0) {
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
      case 'text': return <Type className="w-4 h-4 text-white/40" />;
      case 'number': return <Hash className="w-4 h-4 text-white/40" />;
      case 'select': return <List className="w-4 h-4 text-white/40" />;
      case 'date': return <CalendarIcon className="w-4 h-4 text-white/40" />;
      default: return <FileIcon className="w-4 h-4 text-white/40" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 space-y-6 md:space-y-8">
      <div className="flex items-start gap-4 group relative">
        <div className="pt-2">
          <button 
            onClick={handleIconClick}
            className="p-2 hover:bg-white/5 rounded-xl text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Change icon"
          >
            <Icon className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="text-3xl md:text-5xl font-bold bg-transparent border-none outline-none w-full text-white/90 placeholder:text-white/20"
          />
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

      <div className="space-y-2 py-4 border-b border-white/5">
        {page.properties.map(prop => (
          <div key={prop.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop">
            <div className="w-full sm:w-48 flex items-center gap-2 text-white/50">
              {getPropIcon(prop.type)}
              <input
                type="text"
                value={prop.name}
                onChange={(e) => updateProperty(prop.id, 'name', e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full hover:bg-white/5 px-1 py-0.5 rounded"
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
                  className="text-sm w-full text-white/80 hover:bg-white/5 px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  {prop.value ? format(new Date(prop.value), 'MMM d, yyyy') : 'Empty'}
                </div>
              ) : (
                <input
                  type={prop.type === 'number' ? 'number' : 'text'}
                  value={prop.value}
                  onChange={(e) => updateProperty(prop.id, 'value', e.target.value)}
                  placeholder="Empty"
                  className="bg-transparent border-none outline-none text-sm w-full text-white/80 placeholder:text-white/20 hover:bg-white/5 px-2 py-1 rounded"
                />
              )}
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <div className="dropdown relative inline-block">
            <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white/80 hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Add a property
            </button>
            <div className="dropdown-content absolute left-0 mt-1 w-48 bg-[#2F2F2F] rounded-md shadow-xl border border-white/10 hidden opacity-0 z-10 py-1">
              <button onClick={() => addProperty('text')} className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 cursor-pointer"><Type className="w-4 h-4" /> Text</button>
              <button onClick={() => addProperty('number')} className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 cursor-pointer"><Hash className="w-4 h-4" /> Number</button>
              <button onClick={() => addProperty('select')} className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 cursor-pointer"><List className="w-4 h-4" /> Select</button>
              <button onClick={() => addProperty('date')} className="w-full text-left px-4 py-1.5 text-sm text-white/80 hover:bg-white/5 flex items-center gap-2 cursor-pointer"><CalendarIcon className="w-4 h-4" /> Date</button>
            </div>
          </div>
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleContentChange}
        placeholder="Press '/' for commands, or start typing..."
        className="w-full h-[50vh] bg-transparent border-none outline-none text-white/80 placeholder:text-white/20 resize-none text-lg leading-relaxed"
      />
      
      <style>{`
        .dropdown:hover .dropdown-content {
          display: block;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function CustomPageItemDetails({ item, page, onBack, onUpdateItem }: {
  item: CustomPageItem;
  page: CustomPage;
  onBack: () => void;
  onUpdateItem: (item: CustomPageItem) => void;
}) {
  const [activeTab, setActiveTab] = useState('Overview');
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

  return (
    <div className="min-h-full bg-[#191919] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">{page.title}</button>
            <span>/</span>
            <span className="text-white/50 capitalize whitespace-nowrap">{item.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white/30 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={onBack}
              className="text-white/30 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <input 
          type="text"
          value={item.title}
          onChange={(e) => onUpdateItem({ ...item, title: e.target.value })}
          className="w-full bg-transparent text-4xl font-bold text-[#E8E6E1] mb-8 tracking-tight outline-none placeholder:text-white/10"
          placeholder="Untitled Item"
        />
        
        {/* Properties */}
        <div className="space-y-2 mb-12 max-w-2xl">
          {/* Status */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
            </div>
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
                "flex items-center gap-2 px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                item.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                item.status === 'in-progress' || item.status === 'inbox' ? "bg-blue-500/20 text-blue-400" :
                "bg-stone-500/20 text-stone-400"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                item.status === 'completed' ? "bg-emerald-400" :
                item.status === 'in-progress' || item.status === 'inbox' ? "bg-blue-400" :
                "bg-stone-400"
              )} />
              <span>{toSentenceCase(item.status)}</span>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
              <Zap className="w-4 h-4" />
              <span>Priority</span>
            </div>
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
                "px-2 py-0.5 rounded-md text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity",
                item.priority === 'high' ? "bg-red-500/20 text-red-400" : 
                item.priority === 'medium' ? "bg-orange-500/20 text-orange-400" : 
                "bg-green-500/20 text-green-400"
              )}
            >
              {toSentenceCase(item.priority)}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
              <CalendarIcon className="w-4 h-4" />
              <span>Date</span>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: item.date ? new Date(item.date) : undefined
                });
              }}
              className="text-white/90 text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
            >
              {item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'Set date...'}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
              <Circle className="w-4 h-4" />
              <span>Progress</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-yellow-950/30 text-yellow-500">
              <span className="text-[13px] font-medium">{item.progress}%</span>
            </div>
          </div>

          {/* Custom Properties */}
          {page.properties.map(prop => (
            <div key={prop.id} className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
              <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
                {prop.type === 'date' ? <CalendarIcon className="w-4 h-4" /> :
                 prop.type === 'number' ? <Hash className="w-4 h-4" /> :
                 prop.type === 'select' ? <List className="w-4 h-4" /> :
                 <Type className="w-4 h-4" />}
                <span>{prop.name}</span>
              </div>
              <div className="flex-1">
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
                    className="text-white/90 text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
                  >
                    {item.properties[prop.id] ? format(new Date(item.properties[prop.id]), 'MMM d, yyyy') : 'Set date...'}
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
                    className="text-white/90 text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
                  >
                    {item.properties[prop.id] || 'Select...'}
                  </div>
                ) : (
                  <input
                    type={prop.type === 'number' ? 'number' : 'text'}
                    value={item.properties[prop.id] || ''}
                    onChange={(e) => updateProperty(prop.id, e.target.value)}
                    placeholder="Empty"
                    className="bg-transparent border-none outline-none text-[13px] font-medium w-full text-white/90 placeholder:text-white/10 hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 pb-1">
          {[
            { id: 'Overview', icon: LayoutGrid },
            { id: 'Comments', icon: MessageSquare },
            { id: 'Activity', icon: Activity }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 pl-[11px] pr-[13px] py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                activeTab === tab.id ? "bg-white/10 text-[#E8E6E1]" : "text-white/50 hover:bg-white/10 hover:text-[#E8E6E1]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 pt-6 max-w-6xl mx-auto w-full">
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white/30 uppercase tracking-wider">Description</h3>
              <textarea
                value={item.properties.description || ''}
                onChange={(e) => updateProperty('description', e.target.value)}
                placeholder="Add a description..."
                className="w-full min-h-[200px] bg-transparent border-none outline-none text-[#E8E6E1] placeholder:text-white/10 resize-none text-lg leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

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
                Select {toSentenceCase(customDropdown.type === 'custom-select' ? 'Option' : customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? page.tabs.map(t => t.id) : 
                  customDropdown.type === 'priority' ? ['low', 'medium', 'high'] :
                  [] // For custom-select, we'd need options defined in the property schema
                ).map((option) => (
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
