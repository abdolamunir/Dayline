import React, { useState } from 'react';
import { useAppStore } from '../store';
import { 
  CheckmarkCircle02Icon as CheckCircle2, 
  CircleIcon as Circle, 
  Add01Icon as Plus, 
  MoreHorizontalIcon as MoreHorizontal, 
  Calendar01Icon as CalendarIcon, 
  Tag01Icon as Tag,
  ArrowDown01Icon as ChevronDown,
  PlayIcon as Play
} from 'hugeicons-react';
import { cn } from '../utils/cn';
import { Task } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TasksProps {
  title?: string;
  description?: string;
  defaultFilter?: 'all' | 'todo' | 'doing' | 'done';
  hideFilters?: boolean;
  customFilter?: (task: Task) => boolean;
}

export function Tasks({ 
  title = "Tasks", 
  description = "Manage your actionable items.",
  defaultFilter = 'all',
  hideFilters = false,
  customFilter
}: TasksProps = {}) {
  const { tasks, updateTask } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'todo' | 'doing' | 'done'>(defaultFilter);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const filteredTasks = tasks.filter(t => {
    if (customFilter) return customFilter(t);
    return filter === 'all' || t.status === filter;
  });

  const handleTaskToggle = (task: Task) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const getFilterIcon = (f: string) => {
    switch (f) {
      case 'all': return Circle;
      case 'todo': return Circle;
      case 'doing': return Play;
      case 'done': return CheckCircle2;
      default: return Circle;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#E8E6E1] tracking-tight">{title}</h1>
          <p className="text-white/50 mt-1 text-sm md:text-base">{description}</p>
        </div>
        <button className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-colors w-full sm:w-auto cursor-pointer">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </header>

      {!hideFilters && (
        <div className="space-y-4">
          {/* Mobile/Tablet Dropdown */}
          <div className="sm:hidden relative">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="flex items-center justify-between w-full px-4 py-2.5 bg-[#1f1f1f] border border-white/10 rounded-xl text-[#E8E6E1] font-medium"
            >
              <div className="flex items-center gap-2">
                {React.createElement(getFilterIcon(filter), { className: "w-4 h-4" })}
                <span className="capitalize">{filter === 'all' ? 'Status: All' : filter}</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 transition-transform", isFilterDropdownOpen && "rotate-180")} />
            </button>
            
            <AnimatePresence>
              {isFilterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {['all', 'todo', 'doing', 'done'].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFilter(f as any);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors",
                          filter === f ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {React.createElement(getFilterIcon(f), { className: "w-4 h-4" })}
                        <span className="capitalize">{f === 'all' ? 'Status: All' : f}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:flex items-center gap-2 pb-4 overflow-x-auto scrollbar-hide">
            {['all', 'todo', 'doing', 'done'].map((f) => {
              const Icon = getFilterIcon(f);
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer flex items-center gap-2 border",
                    filter === f 
                      ? "bg-[#2a2a2a] border-white/20 text-white" 
                      : "bg-[#1f1f1f] border-white/5 text-white/60 hover:bg-[#2a2a2a] hover:border-white/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {f === 'all' ? 'Status: All' : f}
                  <ChevronDown className="w-3 h-3 text-white/40" />
                </button>
              );
            })}
            
            {/* Extra Buttons */}
            <button className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer flex items-center gap-2 border bg-[#1f1f1f] border-white/5 text-white/60 hover:bg-[#2a2a2a] hover:border-white/10">
              <Tag className="w-4 h-4" />
              Columns
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
            <button className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors cursor-pointer flex items-center gap-2 border bg-[#1f1f1f] border-white/5 text-white/60 hover:bg-[#2a2a2a] hover:border-white/10">
              <CalendarIcon className="w-4 h-4" />
              Date
              <ChevronDown className="w-3 h-3 text-white/40" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#202020] rounded-2xl border border-white/5 overflow-hidden">
        <div className="divide-y divide-white/5">
          {filteredTasks.length > 0 ? filteredTasks.map(task => (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-4">
                <button onClick={() => handleTaskToggle(task)} className="text-white/40 hover:text-blue-500 transition-colors cursor-pointer">
                  {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="flex flex-col">
                  <span className={cn("text-white/80 font-medium", task.status === 'done' && "line-through text-white/40")}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    )}
                    {task.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {task.tags.join(', ')}
                      </span>
                    )}
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-lg font-medium text-[11px]",
                      task.priority === 'high' ? "bg-red-500/20 text-red-400" :
                      task.priority === 'medium' ? "bg-orange-500/20 text-orange-400" :
                      "bg-green-500/20 text-green-400"
                    )}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-white/40 hover:text-white/80 hover:bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )) : (
            <div className="p-8 text-center text-white/40">
              No tasks found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
