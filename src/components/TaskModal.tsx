import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { useAppStore } from '../store';
import { 
  Cancel01Icon as X, 
  ArrowDown01Icon as ChevronDown,
  MoreHorizontalIcon as MoreHorizontal,
  LayoutLeftIcon as LayoutLeft,
  Time02Icon as Clock,
  ArrowRight01Icon as ArrowRight,
  Globe02Icon as Globe,
  RefreshIcon as Refresh,
  ArrowLeft01Icon as ChevronLeft,
  UserIcon as User,
  Video01Icon as Video,
  Note01Icon as FileText,
  Location01Icon as MapPin,
  Notification01Icon as Bell
} from 'hugeicons-react';
import { cn } from '../utils/cn';
import { getPriorityDotClasses } from '../utils/badges';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const { updateTask, deleteTask } = useAppStore();
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    } else {
      setEditedTask(null);
    }
  }, [task]);

  if (!isOpen || !editedTask) return null;

  const handleSaveAndClose = () => {
    if (editedTask) {
      updateTask(editedTask);
      onClose();
    }
  };

  const handleDelete = () => {
    if (editedTask) {
      deleteTask(editedTask.id);
      onClose();
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      return format(parseISO(`2000-01-01T${timeStr}`), 'h:mm a');
    } catch {
      return timeStr;
    }
  };

  const calculateDuration = () => {
    if (!editedTask.startTime || !editedTask.endTime) return '';
    try {
      const start = parseISO(`2000-01-01T${editedTask.startTime}`);
      const end = parseISO(`2000-01-01T${editedTask.endTime}`);
      const diff = differenceInMinutes(end, start);
      if (diff < 60) return `${diff} min`;
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
    } catch {
      return '';
    }
  };

  const formattedDate = editedTask.dueDate 
    ? format(parseISO(editedTask.dueDate), 'EEE MMM d')
    : 'No Date';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleSaveAndClose}
    >
      <div 
        className="bg-[var(--tokyo-panel)] rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[var(--tokyo-text-strong)] font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button className="flex items-center gap-1.5 text-sm font-medium text-white hover:bg-[var(--tokyo-hover)] px-2 py-1 rounded transition-colors">
            Event
            <ChevronDown className="w-4 h-4 text-[var(--tokyo-text-muted)]" />
          </button>
          <div className="flex items-center gap-1 text-[var(--tokyo-text-muted)]">
            <button onClick={handleDelete} className="p-1.5 hover:bg-[var(--tokyo-hover)] hover:text-red-400 rounded transition-colors" title="Delete">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-[var(--tokyo-hover)] hover:text-white rounded transition-colors">
              <LayoutLeft className="w-4 h-4" />
            </button>
            <button onClick={handleSaveAndClose} className="p-1.5 hover:bg-[var(--tokyo-hover)] hover:text-white rounded transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
          {/* Title */}
          <div className="px-6 py-2 pb-5 border-b border-[var(--tokyo-border)]">
            <input
              type="text"
              value={editedTask.title}
              onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
              placeholder="Event Title"
              className="w-full bg-transparent text-[22px] font-medium text-white placeholder:text-white/20 outline-none"
            />
          </div>

          {/* Time & Date Settings */}
          <div className="px-6 py-4 space-y-5 border-b border-[var(--tokyo-border)]">
            {/* Time Row */}
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-[var(--tokyo-text-faint)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3 text-[15px]">
                  {editedTask.startTime ? (
                    <>
                      <input 
                        type="time" 
                        value={editedTask.startTime}
                        onChange={e => setEditedTask({ ...editedTask, startTime: e.target.value })}
                        className="bg-transparent text-[var(--tokyo-text-strong)] outline-none w-[90px] cursor-pointer"
                      />
                      <ArrowRight className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                      <input 
                        type="time" 
                        value={editedTask.endTime || ''}
                        onChange={e => setEditedTask({ ...editedTask, endTime: e.target.value })}
                        className="bg-transparent text-[var(--tokyo-text-strong)] outline-none w-[90px] cursor-pointer"
                      />
                      <span className="text-[var(--tokyo-text-faint)] ml-1">{calculateDuration()}</span>
                    </>
                  ) : (
                    <span className="text-[var(--tokyo-text-strong)]">All Day</span>
                  )}
                </div>
                <div className="text-[15px] text-[var(--tokyo-text-strong)]">
                  <input 
                    type="date" 
                    value={editedTask.dueDate || ''}
                    onChange={e => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    className="bg-transparent text-[var(--tokyo-text-strong)] outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* All-day Toggle */}
            <div className="flex items-center gap-4 pl-9">
              <button 
                className={cn(
                  "w-8 h-4.5 rounded-full relative transition-colors",
                  !editedTask.startTime ? "bg-[var(--tokyo-purple)]" : "bg-white/20"
                )}
                onClick={() => {
                  if (!editedTask.startTime) {
                    setEditedTask({ ...editedTask, startTime: '09:00', endTime: '10:00' });
                  } else {
                    setEditedTask({ ...editedTask, startTime: undefined, endTime: undefined });
                  }
                }}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all",
                  !editedTask.startTime ? "left-[18px]" : "left-0.5"
                )} />
              </button>
              <span className="text-[15px] text-[var(--tokyo-text-strong)]">All-day</span>
            </div>

            {/* Timezone */}
            <div className="flex items-center gap-4">
              <Globe className="w-5 h-5 text-[var(--tokyo-text-faint)] shrink-0" />
              <span className="text-[15px] text-[var(--tokyo-text-faint)]">GMT+5 <span className="text-[var(--tokyo-text-strong)]">Karachi</span></span>
            </div>

            {/* Recurrence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Refresh className="w-5 h-5 text-[var(--tokyo-text-faint)] shrink-0" />
                <span className="text-[15px] text-[var(--tokyo-text-strong)]">Every weekday <span className="text-[var(--tokyo-text-faint)]">Mon - Fri</span></span>
              </div>
              <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)]">
                <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                <ArrowRight className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="px-6 py-4 space-y-5 border-b border-[var(--tokyo-border)]">
            <div className="flex items-center gap-4 text-[var(--tokyo-text-faint)] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors">
              <User className="w-5 h-5 shrink-0" />
              <span className="text-[15px]">Participants</span>
            </div>
            <div className="flex items-center gap-4 text-[var(--tokyo-text-faint)] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors">
              <Video className="w-5 h-5 shrink-0" />
              <span className="text-[15px]">Conferencing</span>
            </div>
            <div className="flex items-center gap-4 text-[var(--tokyo-text-faint)] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors">
              <FileText className="w-5 h-5 shrink-0" />
              <span className="text-[15px]">AI Meeting Notes and Docs</span>
            </div>
            <div className="flex items-center gap-4 text-[var(--tokyo-text-faint)] cursor-pointer hover:text-[var(--tokyo-text-muted)] transition-colors">
              <MapPin className="w-5 h-5 shrink-0" />
              <span className="text-[15px]">Location</span>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 border-b border-[var(--tokyo-border)]">
            <textarea
              placeholder="Description"
              value={editedTask.description || ''}
              onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
              className="w-full bg-transparent text-[15px] text-[var(--tokyo-text-strong)] placeholder:text-[var(--tokyo-text-faint)] outline-none resize-none h-8"
            />
          </div>

          {/* Calendar & Status */}
          <div className="px-6 py-4 space-y-5">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-4 h-4 rounded-[4px] shrink-0",
                getPriorityDotClasses(editedTask.priority)
              )} />
              <span className="text-[15px] text-[var(--tokyo-text-strong)]">abdolamunir@gmail.com</span>
            </div>
            
            <div className="flex items-center gap-12 pl-8 relative">
              <button 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPos({ x: rect.left, y: rect.bottom + 8 });
                  setIsStatusDropdownOpen(true);
                }}
                className="flex items-center gap-2 text-[15px] text-[var(--tokyo-text-strong)] hover:text-white transition-colors"
              >
                {editedTask.status === 'done' ? 'Free' : 'Busy'}
                <ChevronDown className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
              </button>
              
              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[60]" 
                      onClick={() => setIsStatusDropdownOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="fixed z-[70] bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl p-1.5 w-40 overflow-hidden"
                      style={{ 
                        top: dropdownPos.y, 
                        left: dropdownPos.x 
                      }}
                    >
                      <div className="space-y-0.5">
                        {[
                          { value: 'todo', label: 'Busy' },
                          { value: 'done', label: 'Free' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setEditedTask({ ...editedTask, status: option.value as any });
                              setIsStatusDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group",
                              editedTask.status === option.value ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                            )}
                          >
                            <span>{option.label}</span>
                            {editedTask.status === option.value && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--tokyo-green)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              
              <span className="text-[15px] text-[var(--tokyo-text-strong)] cursor-pointer">Default visibility</span>
            </div>

            <div className="flex items-start gap-4">
              <Bell className="w-5 h-5 text-[var(--tokyo-text-faint)] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-4">
                <span className="text-[15px] text-[var(--tokyo-text-faint)]">Reminders</span>
                <span className="text-[15px] text-[var(--tokyo-text-strong)]">At start of event</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
