import React, { useState, useEffect } from 'react';
import { 
  Calendar02Icon as CalendarDays, 
  ArrowLeft01Icon as ChevronLeft, 
  ArrowRight01Icon as ChevronRight,
  Time02Icon as Clock
} from 'hugeicons-react';
import { useAppStore } from '../store';
import { cn } from '../utils/cn';
import { getPriorityBorderClasses } from '../utils/badges';
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
import { WorkspaceHeader } from '../components/ui/DatabaseSurface';

type ViewMode = 'month' | 'week' | 'day';

export function Upcoming() {
  const { tasks } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const calendarSurfaceStyle = { backgroundColor: 'var(--tokyo-bg)' } as const;

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
      <div className="flex flex-col h-full" style={calendarSurfaceStyle}>
        <div className="grid grid-cols-7 border-b border-[var(--tokyo-border-strong)]" style={calendarSurfaceStyle}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-[var(--tokyo-text-muted)] tracking-wider">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5" style={calendarSurfaceStyle}>
          {daysInMonth.map((d) => {
            const dayTasks = tasks.filter(t => t.dueDate === format(d, 'yyyy-MM-dd'));
            const isCurrentMonth = isSameMonth(d, monthStart);
            const isTodayDate = isToday(d);
            
            return (
              <div 
                key={d.toString()} 
                className={cn(
                  "min-h-[120px] border-r border-b border-[var(--tokyo-border)] p-2 transition-colors hover:bg-[var(--tokyo-hover)] flex flex-col",
                  !isCurrentMonth && "text-[var(--tokyo-text-faint)]"
                )}
                style={calendarSurfaceStyle}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                    isTodayDate ? "bg-[var(--tokyo-purple)] text-white" : isCurrentMonth ? "text-[var(--tokyo-text)]" : "text-[var(--tokyo-text-faint)]"
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
                          ? "bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] border-transparent line-through hover:bg-[var(--tokyo-hover)]" 
                          : "bg-[rgba(198,140,255,0.12)] text-[var(--tokyo-purple)] border-[rgba(198,140,255,0.2)] hover:bg-[rgba(198,140,255,0.2)]"
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
      <div className="flex flex-col h-full overflow-hidden" style={calendarSurfaceStyle}>
        <div className="flex border-b border-[var(--tokyo-border)]" style={calendarSurfaceStyle}>
          <div className="w-16 shrink-0 border-r border-[var(--tokyo-border)]" style={calendarSurfaceStyle} />
          <div className="flex-1 grid grid-cols-7" style={calendarSurfaceStyle}>
            {days.map(d => {
              const isTodayDate = isToday(d);
              return (
                <div key={d.toString()} className="py-4 text-center border-r border-[var(--tokyo-border)] last:border-r-0 flex items-center justify-center gap-2" style={calendarSurfaceStyle}>
                  <span className="text-sm font-medium text-[var(--tokyo-text)]">
                    {format(d, 'EEE')}
                  </span>
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium",
                    isTodayDate ? "bg-[var(--tokyo-pink)] text-white" : "text-[var(--tokyo-text)]"
                  )}>
                    {format(d, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative" style={calendarSurfaceStyle}>
          <div className="flex min-h-[1920px]" style={calendarSurfaceStyle}> {/* 24 hours * 80px */}
            <div className="flex-1 grid grid-cols-7 relative" style={calendarSurfaceStyle}>
              {/* Tasks */}
              {days.map((d) => {
                const dayTasks = tasks.filter(t => t.dueDate === format(d, 'yyyy-MM-dd'));
                const allDayTasks = dayTasks.filter(t => !t.startTime);
                const timedTasks = dayTasks.filter(t => t.startTime);

                return (
                  <div key={d.toString()} className="relative border-r border-transparent last:border-r-0" style={calendarSurfaceStyle}>
                    {/* All-day tasks container at the top */}
                    <div className="absolute top-0 left-0 right-0 p-1 space-y-1 z-10">
                      {allDayTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className={cn(
                            "rounded-lg px-3 py-2 text-xs truncate border cursor-pointer transition-colors",
                            task.status === 'done' 
                              ? "bg-transparent text-[var(--tokyo-text-faint)] border-[var(--tokyo-border)] line-through hover:bg-[var(--tokyo-panel-2)]" 
                              : "bg-gradient-to-b from-white/10 to-transparent text-[var(--tokyo-text-strong)] border-[var(--tokyo-border-strong)] hover:border-white/20"
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
                              ? "bg-transparent text-[var(--tokyo-text-faint)] border-[var(--tokyo-border)] hover:bg-[var(--tokyo-panel-2)]" 
                              : "bg-gradient-to-b from-white/5 to-transparent hover:from-white/10",
                            isCurrent && task.status !== 'done' ? "border-[var(--tokyo-pink)]" : "border-[var(--tokyo-border-strong)]"
                          )}
                          style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                        >
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full border-[1.5px] shrink-0 mt-0.5",
                              getPriorityBorderClasses(task.priority)
                            )} />
                            <div className={cn("text-xs font-semibold text-[var(--tokyo-text-strong)] leading-tight", task.status === 'done' && "line-through text-[var(--tokyo-text-faint)]")}>
                              {task.title}
                            </div>
                          </div>
                          <div className="text-xs text-[var(--tokyo-text-muted)] pl-5">
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
      <div className="flex flex-col h-full overflow-hidden" style={calendarSurfaceStyle}>
        <div className="p-4 border-b border-[var(--tokyo-border-strong)] flex items-center justify-between" style={calendarSurfaceStyle}>
          <div>
            <div className="text-2xl font-bold text-[var(--tokyo-text-strong)]">{format(currentDate, 'EEEE')}</div>
            <div className="text-[var(--tokyo-text-muted)]">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          {isToday(currentDate) && (
            <div className="px-3 py-1 rounded-full bg-[rgba(198,140,255,0.2)] text-[var(--tokyo-purple)] text-xs font-medium">
              Today
            </div>
          )}
        </div>
        
        {allDayTasks.length > 0 && (
          <div className="p-4 border-b border-[var(--tokyo-border-strong)] space-y-2" style={calendarSurfaceStyle}>
            <div className="text-xs font-medium text-[var(--tokyo-text-faint)] mb-2">All Day</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allDayTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={cn(
                    "rounded-lg p-3 text-sm border cursor-pointer transition-colors",
                    task.status === 'done' 
                      ? "bg-[var(--tokyo-panel-2)] text-[var(--tokyo-text-faint)] border-[var(--tokyo-border)] line-through hover:bg-[var(--tokyo-panel-3)]" 
                      : "bg-[rgba(198,140,255,0.12)] text-[var(--tokyo-purple)] border-[rgba(198,140,255,0.2)] hover:bg-[rgba(198,140,255,0.2)]"
                  )}
                >
                  <div className="font-medium">{task.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar relative" style={calendarSurfaceStyle}>
          <div className="flex min-h-[1920px]" style={calendarSurfaceStyle}> {/* 24 hours * 80px */}
            <div className="w-20 shrink-0 border-r border-[var(--tokyo-border-strong)]" style={calendarSurfaceStyle}>
              {hours.map(h => (
                <div key={h} className="h-[80px] relative">
                  <span className="absolute -top-2.5 right-4 text-xs font-medium text-[var(--tokyo-text-faint)]">
                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex-1 relative" style={calendarSurfaceStyle}>
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                {hours.map(h => (
                  <div key={h} className="h-[80px] border-b border-[var(--tokyo-border)]" />
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
                        ? "bg-[var(--tokyo-panel-2)]/90 text-[var(--tokyo-text-faint)] border-[var(--tokyo-border-strong)] hover:bg-[var(--tokyo-panel-3)]/90" 
                        : "bg-[rgba(198,140,255,0.2)] text-[var(--tokyo-purple)] border-[rgba(198,140,255,0.4)] backdrop-blur-md hover:bg-[rgba(198,140,255,0.3)]"
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
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 bg-transparent p-4 pt-7 text-white md:px-8 md:pb-8 md:pt-10">
      <WorkspaceHeader
        icon={<CalendarDays className="text-[var(--tokyo-pink)]" />}
        title="Sprint"
        description={getHeaderDateText()}
        count={tasks.filter(task => task.dueDate).length}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--tokyo-panel-2)] rounded-md border border-[var(--tokyo-border-strong)] p-0.5 mr-4">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded transition-colors",
                  viewMode === 'week' ? "bg-[var(--tokyo-panel-3)] text-white" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                )}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded transition-colors",
                  viewMode === 'month' ? "bg-[var(--tokyo-panel-3)] text-white" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                )}
              >
                Month
              </button>
            </div>

            <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded bg-transparent border border-[var(--tokyo-border-strong)] text-[var(--tokyo-text-muted)] hover:text-white hover:bg-[var(--tokyo-hover)] transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={today} className="flex h-8 items-center justify-center rounded bg-transparent border border-[var(--tokyo-border-strong)] px-3 text-[13px] font-medium text-[var(--tokyo-text)] hover:text-white hover:bg-[var(--tokyo-hover)] transition-colors">
              Today
            </button>
            <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded bg-transparent border border-[var(--tokyo-border-strong)] text-[var(--tokyo-text-muted)] hover:text-white hover:bg-[var(--tokyo-hover)] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 overflow-hidden" style={calendarSurfaceStyle}>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
      </div>

      <TaskModal 
        task={selectedTask} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
