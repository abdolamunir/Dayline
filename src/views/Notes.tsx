import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  PencilEdit01Icon as Pencil, 
  MoreHorizontalIcon as MoreHorizontal,
  Target01Icon as Target,
  Add01Icon as Plus,
  Calendar01Icon as CalendarIcon,
  DashboardSquare01Icon as LayoutGrid,
  CheckmarkCircle02Icon as CheckCircle,
  FilterIcon,
  Sorting01Icon as Sort,
  FlashIcon as Lightning,
  Search01Icon as Search,
  Settings01Icon as Settings,
  ArrowDown01Icon as ChevronDown,
  Layers01Icon as Layers,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  InboxIcon as Inbox,
  CheckmarkCircle02Icon as CheckCircle2
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Inbox: Inbox,
  Clock: Clock,
  CheckCircle2: CheckCircle2,
  Target: Target,
};

export function Notes({ onViewChange, selectedNoteId }: { onViewChange?: (view: string) => void, selectedNoteId?: string }) {
  const { notes, updateNote, reorderNotes, addNote } = useAppStore();
  const [localSelectedNoteId, setLocalSelectedNoteId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{
    id: string;
    type: 'priority';
    pos: { x: number, y: number };
    currentValue: string;
  } | null>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [tabs, setTabs] = useState([
    { id: 'inbox', label: 'Inbox', icon: 'Inbox' },
    { id: 'in-progress', label: 'In Progress', icon: 'Clock' },
    { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  ]);

  const [activeTab, setActiveTab] = useState<string>('in-progress');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [columns, setColumns] = useState([
    { id: 'title', label: 'Title', icon: 'Pencil', width: '400px' },
    { id: 'priority', label: 'Priority', icon: 'Clock', width: '120px' },
    { id: 'date', label: 'Date', icon: 'CalendarIcon', width: '140px' },
  ]);

  const filteredNotes = notes;

  const effectiveSelectedNoteId = selectedNoteId || localSelectedNoteId;
  const selectedNote = effectiveSelectedNoteId ? notes.find(n => n.id === effectiveSelectedNoteId) : null;

  if (selectedNote) {
    return (
      <NoteDetailsPage 
        note={selectedNote} 
        onBack={() => {
          if (onViewChange) {
            onViewChange('notes');
          } else {
            setLocalSelectedNoteId(null);
          }
        }} 
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-1">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-stone-500/10 rounded-xl text-stone-300">
          <Pencil className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-stone-100 tracking-tight">Notes</h1>
      </header>

      {/* Tabs & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-1">
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
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
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
                        activeTab === tab.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
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
          className="hidden sm:flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0"
        >
          {tabs.map(tab => {
            const Icon = iconMap[tab.icon] || Target;
            return (
              <Reorder.Item 
                key={tab.id}
                value={tab}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  activeTab === tab.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden">
        <div className={cn("w-full h-full", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
          <table className="w-full text-left border-separate border-spacing-0 min-w-[600px]">
            <thead>
              <tr className="text-white/40 text-[12px] font-medium">
                {columns.map((col, index) => (
                  <th 
                    key={col.id} 
                    style={{ width: col.width }}
                    className={cn(
                      "py-2 border-b border-white/5 group/header whitespace-nowrap",
                      index === 0 ? "pl-0" : "px-4"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="capitalize">{col.label.toLowerCase()}</span>
                    </div>
                  </th>
                ))}
                <th className="py-2 pr-6 border-b border-white/5 w-16 whitespace-nowrap text-right">
                  <MoreHorizontal className="w-4 h-4 text-white/10 ml-auto" />
                </th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              values={filteredNotes} 
              onReorder={reorderNotes}
              className="relative"
            >
              {filteredNotes.map(note => (
                <Reorder.Item 
                  key={note.id} 
                  value={note}
                  as="tr"
                  layout="position"
                  className={cn(
                    "group transition-colors select-none cursor-grab active:cursor-grabbing border-b border-white/[0.03] hover:bg-white/[0.02] whitespace-nowrap",
                    draggingId === note.id ? "cursor-grabbing bg-white/[0.04]" : ""
                  )}
                >
                  <td 
                    className="py-2 pl-0 pr-4 border-b border-white/[0.01] cursor-pointer rounded-l-lg whitespace-nowrap"
                    onClick={() => {
                      if (onViewChange) {
                        onViewChange(`note-details:${note.id}`);
                      } else {
                        setLocalSelectedNoteId(note.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/30 shrink-0">
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white font-medium text-[14px] tracking-tight w-full cursor-pointer">
                        {note.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b border-white/[0.01] whitespace-nowrap">
                    <span 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCustomDropdown({
                          id: note.id,
                          type: 'priority',
                          pos: { x: rect.left, y: rect.bottom + 8 },
                          currentValue: note.priority
                        });
                      }}
                      className={cn(
                        "px-2 py-1 rounded-lg font-medium text-[11px] cursor-pointer hover:opacity-80 transition-opacity",
                        note.priority === 'high' ? "bg-red-500/20 text-red-400" :
                        note.priority === 'medium' ? "bg-orange-500/20 text-orange-400" :
                        "bg-green-500/20 text-green-400"
                      )}>
                      {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b border-white/[0.01] text-[11px] font-medium text-white/50 whitespace-nowrap">
                    {note.createdAt}
                  </td>
                  <td className="py-2 pr-6 border-b border-white/[0.01] text-right whitespace-nowrap">
                    <button className="p-2 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-md transition-all cursor-pointer">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </Reorder.Item>
              ))}
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
              className="fixed z-[140] bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{ 
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200), 
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200) 
              }}
            >
              <div className="px-2.5 py-1.5 text-xs font-bold text-white/30 tracking-wider">
                Select {customDropdown.type.charAt(0).toUpperCase() + customDropdown.type.slice(1)}
              </div>
              <div className="space-y-0.5">
                {['low', 'medium', 'high'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      const note = notes.find(n => n.id === customDropdown.id);
                      if (note) {
                        updateNote({ 
                          ...note, 
                          priority: option as any
                        });
                      }
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group",
                      customDropdown.currentValue === option ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="capitalize">{option}</span>
                    {customDropdown.currentValue === option && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
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

function NoteDetailsPage({ note, onBack }: { note: any, onBack: () => void }) {
  const { updateNote, deleteNote } = useAppStore();
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <button onClick={onBack} className="text-white/50 hover:text-white mb-4">← Back</button>
      <input 
        type="text"
        value={note.title}
        onChange={(e) => updateNote({ ...note, title: e.target.value })}
        className="text-3xl font-bold bg-transparent w-full outline-none text-white"
      />
      <textarea 
        value={note.content}
        onChange={(e) => updateNote({ ...note, content: e.target.value })}
        className="w-full h-64 bg-white/5 p-4 rounded-lg text-white outline-none"
      />
      <button onClick={() => { deleteNote(note.id); onBack(); }} className="text-red-500">Delete Note</button>
    </div>
  );
}
