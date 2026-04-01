import React, { useState, useEffect } from 'react';
import { 
  Calendar02Icon as CalendarDays, 
  ArrowLeft01Icon as ChevronLeft, 
  ArrowRight01Icon as ChevronRight,
  Time02Icon as Clock
} from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns';
import { TaskModal } from '../components/TaskModal';
import { Task } from '../types';

type ViewMode = 'month' | 'week' | 'day';

export function Upcoming() {
  const { tasks } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const next = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const today = () => setCurrentDate(new Date());

  const getHeaderDateText = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy');
      }
      return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
    }
    return format(currentDate, 'MMMM d, yyyy');
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex flex-col h-full bg-[#1C1C1C]">
        <div className="grid grid-cols-7 border-b border-white/10 bg-[#202020]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-white/50 tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-white/5">
          {daysInMonth.map((d) => {
            const dayTasks = tasks.filter(t => t.dueDate === format(d, 'yyyy-MM-dd'));
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isTodayDate = isToday(d);
            
            return (
              <div 
                key={d.toString()} 
                className={cn(
                  "min-h-[120px] bg-[#1C1C1C] p-2 transition-colors hover:bg-[#222222] flex flex-col",
                  !isCurrentMonth && "bg-[#181818]"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isTodayDate ? "bg-purple-500 text-white" : isCurrentMonth ? "text-white/80" : "text-white/30"
                  )}>
                    {format(d, 'd')}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {dayTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => handleTaskClick(task)}
                      className={cn(
                        "text-xs px-2 py-1 rounded truncate border cursor-pointer",
                        task.status === 'done' 
                          ? "bg-white/5 text-white/40 border-transparent line-through hover:bg-white/10" 
                          : "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                      )}
                      title={task.title}
                    >
                      {task.startTime && <span className="mr-1 opacity-60">{task.startTime}</span>}
                      {task.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();
    const currentTimeTop = (currentHours + currentMinutes / 60) * 80;

    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#111]">
        <div className="flex border-b border-white/5 bg-[#111]">
          <div className="w-16 shrink-0 border-r border-white/5" />
          <div className="flex-1 grid grid-cols-7">
            {days.map(d => {
              const isTodayDate = isToday(d);
              return (
                <div key={d.toString()} className="py-4 text-center border-r border-white/5 last:border-r-0 flex items-center justify-center gap-2">
                  <span className="text-sm font-medium text-white/80">
                    {format(d, 'EEE')}
                  </span>
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isTodayDate ? "bg-[#F85149] text-white" : "text-white/80"
                  )}>
                    {format(d, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex min-h-[1920px]"> {/* 24 hours * 80px */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Tasks */}
              {days.map((d) => {
                const dayTasks = tasks.filter(t => t.dueDate === format(d, 'yyyy-MM-dd'));
                const allDayTasks = dayTasks.filter(t => !t.startTime);
                const timedTasks = dayTasks.filter(t => t.startTime);

                return (
                  <div key={d.toString()} className="relative border-r border-transparent last:border-r-0">
                    {/* All-day tasks container at the top */}
                    <div className="absolute top-0 left-0 right-0 p-1 space-y-1 z-10">
                      {allDayTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={cn(
                            "rounded-lg px-3 py-2 text-xs truncate border cursor-pointer transition-colors",
                            task.status === 'done' 
                              ? "bg-[#1A1A1A] text-white/40 border-white/5 line-through hover:bg-[#222]" 
                              : "bg-gradient-to-b from-white/10 to-transparent text-white/90 border-white/10 hover:border-white/20"
                          )}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>

                    {/* Timed tasks */}
                    {timedTasks.map(task => {
                      const [hours, minutes] = task.startTime!.split(':').map(Number);
                      const top = (hours + minutes / 60) * 80;
                      let height = 80; // default 1 hour
                      if (task.endTime) {
                        const [endH, endM] = task.endTime!.split(':').map(Number);
                        height = ((endH + endM / 60) - (hours + minutes / 60)) * 80;
                      }
                      
                      const isCurrent = isToday(d) && 
                                        (currentHours + currentMinutes/60) >= (hours + minutes/60) && 
                                        (currentHours + currentMinutes/60) <= (hours + minutes/60 + height/80);

                      return (
                        <div 
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={cn(
                            "absolute left-1 right-1 rounded-xl p-3 overflow-hidden border z-20 cursor-pointer transition-colors flex flex-col gap-1",
                            task.status === 'done' 
                              ? "bg-[#1A1A1A] text-white/40 border-white/5 hover:bg-[#222]" 
                              : "bg-gradient-to-b from-white/5 to-transparent hover:from-white/10",
                            isCurrent && task.status !== 'done' ? "border-[#F85149]" : "border-white/10"
                          )}
                          style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full border-[1.5px] shrink-0 mt-0.5",
                              task.priority === 'high' ? "border-red-400" :
                              task.priority === 'medium' ? "border-yellow-400" :
                              "border-green-400"
                            )} />
                            <div className={cn("text-xs font-semibold text-white/90 leading-tight", task.status === 'done' && "line-through text-white/40")}>
                              {task.title}
                            </div>
                          </div>
                          <div className="text-xs text-white/50 pl-5">
                            {task.startTime} {task.endTime && `- ${task.endTime}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayTasks = tasks.filter(t => t.dueDate === format(currentDate, 'yyyy-MM-dd'));
    const allDayTasks = dayTasks.filter(t => !t.startTime);
    const timedTasks = dayTasks.filter(t => t.startTime);

    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#1C1C1C]">
        <div className="p-4 border-b border-white/10 bg-[#202020] flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-white/90">{format(currentDate, 'EEEE')}</div>
            <div className="text-white/50">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          {isToday(currentDate) && (
            <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
              Today
            </div>
          )}
        </div>
        
        {allDayTasks.length > 0 && (
          <div className="p-4 border-b border-white/10 bg-[#1A1A1A] space-y-2">
            <div className="text-xs font-medium text-white/40 mb-2">All Day</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allDayTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "rounded-lg p-3 text-sm border cursor-pointer transition-colors",
                    task.status === 'done' 
                      ? "bg-[#2A2A2A] text-white/40 border-white/5 line-through hover:bg-[#333]" 
                      : "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20"
                  )}
                >
                  <div className="font-medium">{task.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="flex min-h-[1920px]"> {/* 24 hours * 80px */}
            <div className="w-20 shrink-0 border-r border-white/10 bg-[#1C1C1C]">
              {hours.map(h => (
                <div key={h} className="h-[80px] relative">
                  <span className="absolute -top-2.5 right-4 text-xs font-medium text-white/40">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hours.map(h => (
                  <div key={h} className="h-[80px] border-b border-white/5" />
                ))}
              </div>
              
              {/* Timed Tasks */}
              {timedTasks.map(task => {
                const [hours, minutes] = task.startTime!.split(':').map(Number);
                const top = (hours + minutes / 60) * 80;
                let height = 80; // default 1 hour
                if (task.endTime) {
                  const [endH, endM] = task.endTime!.split(':').map(Number);
                  height = ((endH + endM / 60) - (hours + minutes / 60)) * 80;
                }
                
                return (
                  <div 
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={cn(
                      "absolute left-4 right-4 rounded-xl p-3 text-sm overflow-hidden border shadow-lg z-10 cursor-pointer transition-colors",
                      task.status === 'done' 
                        ? "bg-[#2A2A2A]/90 text-white/40 border-white/10 hover:bg-[#333]/90" 
                        : "bg-purple-500/20 text-purple-300 border-purple-500/40 backdrop-blur-md hover:bg-purple-500/30"
                    )}
                    style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                  >
                    <div className={cn("font-semibold", task.status === 'done' && "line-through")}>{task.title}</div>
                    <div className="opacity-70 text-xs mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {task.startTime} {task.endTime && `- ${task.endTime}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col w-full bg-[#111] text-white">
      <header className="flex flex-col gap-4 mb-6 px-6 pt-6">
        <h1 className="text-4xl font-bold text-white tracking-tight">Sprint 🏃🏻‍♂️</h1>
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium text-white/80">
            {getHeaderDateText()}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#222] rounded-md border border-white/10 p-0.5 mr-4">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded transition-colors",
                  viewMode === 'week' ? "bg-[#333] text-white" : "text-white/40 hover:text-white/80"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded transition-colors",
                  viewMode === 'month' ? "bg-[#333] text-white" : "text-white/40 hover:text-white/80"
                )}
              >
                Month
              </button>
            </div>

            <button onClick={prev} className="p-1.5 rounded bg-transparent border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={today} className="px-3 py-1.5 rounded bg-transparent border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
              Today
            </button>
            <button onClick={next} className="p-1.5 rounded bg-transparent border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 bg-[#111] overflow-hidden">
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      <button className="fixed bottom-6 right-6 w-10 h-10 bg-[#222] hover:bg-[#333] border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors shadow-lg z-50">
        <span className="font-medium text-sm">?</span>
      </button>

      <TaskModal 
        task={selectedTask} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
