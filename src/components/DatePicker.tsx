import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parse,
  isValid
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bell, 
  RefreshCw, 
  AlertCircle,
  Calendar as CalendarIcon,
  Check
} from 'lucide-react';
import { cn } from '../utils/cn';

interface DatePickerProps {
  selectedDate?: Date;
  initialConfig?: DateConfig;
  onSelect: (date: Date, config?: DateConfig) => void;
  onClose: () => void;
}

export interface DateConfig {
  time?: string;
  reminder?: string;
  alert?: string;
  repeat?: string;
}

export function DatePicker({ selectedDate, initialConfig, onSelect, onClose }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  const [tempDate, setTempDate] = useState<Date | undefined>(selectedDate);
  const [config, setConfig] = useState<DateConfig>(initialConfig || {
    time: '12:00',
    reminder: 'none',
    alert: 'none',
    repeat: 'none'
  });

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleDateClick = (day: Date) => {
    setTempDate(day);
    onSelect(day, config);
  };

  return (
    <div className="dayline-date-picker flex flex-col w-72 bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--tokyo-border)]">
        <div className="text-sm font-bold text-[var(--tokyo-text-strong)]">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-[var(--tokyo-hover)] rounded-md text-[var(--tokyo-text-faint)] hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-[var(--tokyo-hover)] rounded-md text-[var(--tokyo-text-faint)] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        <div className="grid grid-cols-7 mb-2">
          {days.map(day => (
            <div key={day} className="text-center text-[13px] font-bold text-white/20 tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, idx) => {
            const isSelected = tempDate && isSameDay(day, tempDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-8 flex items-center justify-center rounded-md text-[13px] transition-all cursor-pointer",
                  !isCurrentMonth && "text-white/10",
                  isCurrentMonth && !isSelected && "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]",
                  isSelected && "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)] font-bold",
                  isToday && !isSelected && "text-[var(--tokyo-yellow)] font-bold underline underline-offset-4"
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-3 pb-3 space-y-3 border-t border-[var(--tokyo-border)] pt-3 bg-white/[0.01]">
        {/* Time */}
        <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)] transition-colors">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">Time</span>
          </div>
          <input 
            type="time" 
            value={config.time}
            onChange={(e) => {
              const newConfig = { ...config, time: e.target.value };
              setConfig(newConfig);
              if (tempDate) onSelect(tempDate, newConfig);
            }}
            className="bg-transparent text-[var(--tokyo-text-strong)] text-[13px] border-none outline-none focus:text-white cursor-pointer [color-scheme:dark]"
          />
        </div>

        {/* Reminder */}
        <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)] transition-colors">
            <Bell className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">Reminder</span>
          </div>
          <select 
            value={config.reminder}
            onChange={(e) => {
              const newConfig = { ...config, reminder: e.target.value };
              setConfig(newConfig);
              if (tempDate) onSelect(tempDate, newConfig);
            }}
            className="bg-transparent text-[var(--tokyo-text-strong)] text-[13px] border-none outline-none focus:text-white cursor-pointer appearance-none text-right font-medium"
          >
            <option value="none">None</option>
            <option value="at-time">At time</option>
            <option value="5-min">5 min before</option>
            <option value="30-min">30 min before</option>
            <option value="1-hour">1 hour before</option>
          </select>
        </div>

        {/* Repeat */}
        <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] group-hover:text-[var(--tokyo-text-muted)] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[13px] font-medium">Repeat</span>
          </div>
          <select 
            value={config.repeat}
            onChange={(e) => {
              const newConfig = { ...config, repeat: e.target.value };
              setConfig(newConfig);
              if (tempDate) onSelect(tempDate, newConfig);
            }}
            className="bg-transparent text-[var(--tokyo-text-strong)] text-[13px] border-none outline-none focus:text-white cursor-pointer appearance-none text-right font-medium"
          >
            <option value="none">Don't repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

    </div>
  );
}
