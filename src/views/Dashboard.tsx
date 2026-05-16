import React, { useState } from 'react';
import { useAppStore } from '../store';
import { format, isToday, parseISO } from 'date-fns';
import { CheckmarkCircle02Icon as CheckCircle2, CircleIcon as Circle, Calendar01Icon as CalendarIcon, Activity01Icon as Activity, Target01Icon as Target, SmileIcon as Smile, HappyIcon as Laugh, Sad01Icon as Meh, Sad01Icon as Frown, AngryIcon as Angry, Cancel01Icon as X, Calendar02Icon as CalendarDays, CheckmarkSquare02Icon as CheckSquare, ReloadIcon as RotateCw, UserIcon as PersonStanding } from 'hugeicons-react';
import { cn } from '../utils/cn';
import { Mood } from '../types';

export function Dashboard() {
  const { tasks, habits, events, updateTask, updateHabit, addMood, moods } = useAppStore();
  const [showBriefing, setShowBriefing] = useState(false);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayTasks = tasks.filter(t => t.dueDate === todayStr);
  const topPriorities = tasks.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 3);
  const todayEvents = events.filter(e => e.date === todayStr);
  
  const hasLoggedMoodToday = moods.some(m => m.date === todayStr);

  const handleTaskToggle = (task: any) => {
    updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleHabitToggle = (habit: any) => {
    const isCompleted = habit.logs[todayStr];
    const newLogs = { ...habit.logs };
    if (isCompleted) {
      delete newLogs[todayStr];
    } else {
      newLogs[todayStr] = true;
    }
    updateHabit({ ...habit, logs: newLogs, streak: isCompleted ? Math.max(0, habit.streak - 1) : habit.streak + 1 });
  };

  const handleMoodLog = (type: Mood['type'], intensity: number) => {
    if (hasLoggedMoodToday) return;
    addMood({
      id: `m${Date.now()}`,
      type,
      intensity,
      date: todayStr
    });
  };

  const dayAbbr = format(today, 'EEE');
  const monthYear = format(today, "MMMM''yy");
  const fullDay = format(today, 'EEEE');

  const meetingCount = todayEvents.length || 3;
  const taskCount = todayTasks.length || 2;
  const habitCount = habits.length || 1;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10">
      {showBriefing ? (
        <div className="bg-[var(--tokyo-panel)] rounded-[32px] p-8 md:p-10 flex flex-col gap-8 shadow-2xl border border-[var(--tokyo-border)] relative overflow-hidden">
          <button 
            onClick={() => setShowBriefing(false)}
            className="absolute top-6 right-6 text-white/20 hover:text-[var(--tokyo-text-muted)] transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Top Row */}
          <div className="flex justify-between items-start">
            <div className="flex items-baseline">
              <h1 className="text-7xl md:text-8xl font-bold text-[var(--tokyo-text-strong)] tracking-tighter">{dayAbbr}</h1>
              <div className="w-5 h-5 md:w-6 md:h-6 bg-[var(--tokyo-pink)] rounded-full ml-2 mb-3 md:mb-5"></div>
            </div>
            <div className="text-right flex flex-col justify-end pt-2 pr-8">
              <div className="text-[var(--tokyo-text-muted)] text-xl md:text-2xl font-medium tracking-tight">{monthYear}</div>
              <div className="text-[var(--tokyo-text-muted)] text-xl md:text-2xl tracking-tight">{fullDay}</div>
            </div>
          </div>

          {/* Main Text */}
          <div className="text-[28px] md:text-[40px] font-medium leading-[1.3] tracking-tight text-[var(--tokyo-text-muted)] max-w-4xl">
            Good morning, <img src="https://i.pravatar.cc/150?u=alexey" alt="Alexey" className="inline-block w-10 h-10 md:w-12 md:h-12 rounded-full align-middle mx-1 border border-[var(--tokyo-border-strong)]" /> <span className="text-[var(--tokyo-text-strong)]">Alexey.</span><br />
            You have <CalendarDays className="inline-block w-8 h-8 md:w-10 md:h-10 align-middle text-[var(--tokyo-text-strong)] mx-1 pb-1" strokeWidth={2} /> <span className="text-[var(--tokyo-text-strong)]">{meetingCount} meetings,</span><br />
            <CheckSquare className="inline-block w-8 h-8 md:w-10 md:h-10 align-middle text-[var(--tokyo-text-strong)] mr-1 pb-1" strokeWidth={2} /> <span className="text-[var(--tokyo-text-strong)]">{taskCount} tasks</span> and <RotateCw className="inline-block w-8 h-8 md:w-10 md:h-10 align-middle text-[var(--tokyo-text-strong)] mx-1 pb-1" strokeWidth={2} /> <span className="text-[var(--tokyo-text-strong)]">{habitCount} habit</span><br />
            today. You're <span className="text-[var(--tokyo-text-strong)]">mostly free</span><br />
            after 4 pm.
          </div>

          {/* Bottom Row */}
          <div className="flex items-center gap-6 mt-4 text-base md:text-lg">
            <div className="flex items-center gap-2 text-white font-medium">
              <PersonStanding className="w-5 h-5 md:w-6 md:h-6 text-[var(--tokyo-purple)]" />
              <span>4.7K steps</span>
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <span>7.3 hours</span>
            </div>
            <div className="flex items-center gap-2 text-white font-medium">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-[var(--tokyo-green)]" />
              <span>36 mins</span>
            </div>
          </div>
        </div>
      ) : (
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--tokyo-text-strong)] tracking-tight">Good morning.</h1>
            <p className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-base">{format(today, 'EEEE, MMMM do, yyyy')}</p>
          </div>
          <button 
            onClick={() => setShowBriefing(true)}
            className="bg-[var(--tokyo-yellow-dim)] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-white/20 transition-colors cursor-pointer"
          >
            Show Briefing
          </button>
        </header>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Focus Section */}
        <section className="col-span-1 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[var(--tokyo-text)] font-medium">
            <Target className="w-5 h-5 text-[var(--tokyo-yellow)]" />
            <h2>Focus Priorities</h2>
          </div>
          <div className="bg-[var(--tokyo-sidebar)] rounded-2xl p-5 border border-[var(--tokyo-border)] space-y-3">
            {topPriorities.length > 0 ? topPriorities.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[var(--tokyo-hover)] rounded-lg transition-colors group">
                <button onClick={() => handleTaskToggle(task)} className="text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-yellow)] transition-colors">
                  {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-[var(--tokyo-yellow)]" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={cn("text-[var(--tokyo-text)] font-medium", task.status === 'done' && "line-through text-[var(--tokyo-text-faint)]")}>
                  {task.title}
                </span>
              </div>
            )) : (
              <p className="text-[var(--tokyo-text-faint)] text-sm">No high priorities for today. Enjoy the calm.</p>
            )}
          </div>
        </section>

        {/* Mood Check-in */}
        <section className="col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-[var(--tokyo-text)] font-medium">
            <Smile className="w-5 h-5 text-[var(--tokyo-green)]" />
            <h2>Mood Check-in</h2>
          </div>
          <div className="bg-[var(--tokyo-sidebar)] rounded-2xl p-5 border border-[var(--tokyo-border)] flex flex-col justify-center h-[140px]">
            {hasLoggedMoodToday ? (
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)] rounded-full flex items-center justify-center mx-auto">
                  <Smile className="w-6 h-6" />
                </div>
                <p className="text-[var(--tokyo-text-muted)] font-medium text-sm">Mood logged for today</p>
              </div>
            ) : (
              <div className="flex justify-between items-center px-2">
                {[
                  { type: 'awful', icon: <Angry className="w-8 h-8 text-[var(--tokyo-pink)]" />, intensity: 1 },
                  { type: 'bad', icon: <Frown className="w-8 h-8 text-[var(--tokyo-yellow)]" />, intensity: 2 },
                  { type: 'meh', icon: <Meh className="w-8 h-8 text-[var(--tokyo-yellow)]" />, intensity: 3 },
                  { type: 'good', icon: <Smile className="w-8 h-8 text-green-400" />, intensity: 4 },
                  { type: 'rad', icon: <Laugh className="w-8 h-8 text-[var(--tokyo-green)]" />, intensity: 5 },
                ].map(m => (
                  <button
                    key={m.type}
                    onClick={() => handleMoodLog(m.type as Mood['type'], m.intensity)}
                    className="hover:scale-125 transition-transform origin-bottom"
                    title={m.type}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Tasks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--tokyo-text)] font-medium">
            <CheckCircle2 className="w-5 h-5 text-[var(--tokyo-purple)]" />
            <h2>Today's Tasks</h2>
          </div>
          <div className="bg-[var(--tokyo-sidebar)] rounded-2xl p-4 border border-[var(--tokyo-border)] space-y-2 min-h-[200px]">
            {todayTasks.length > 0 ? todayTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-[var(--tokyo-hover)] rounded-lg transition-colors">
                <button onClick={() => handleTaskToggle(task)} className="mt-0.5 text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-purple)] transition-colors">
                  {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-[var(--tokyo-purple)]" /> : <Circle className="w-4 h-4" />}
                </button>
                <span className={cn("text-[var(--tokyo-text)] text-sm", task.status === 'done' && "line-through text-[var(--tokyo-text-faint)]")}>
                  {task.title}
                </span>
              </div>
            )) : (
              <p className="text-[var(--tokyo-text-faint)] text-sm p-2">No tasks due today.</p>
            )}
          </div>
        </section>

        {/* Habits */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--tokyo-text)] font-medium">
            <Activity className="w-5 h-5 text-[var(--tokyo-purple)]" />
            <h2>Habits</h2>
          </div>
          <div className="bg-[var(--tokyo-sidebar)] rounded-2xl p-4 border border-[var(--tokyo-border)] space-y-3 min-h-[200px]">
            {habits.map(habit => {
              const isCompleted = habit.logs[todayStr];
              return (
                <div key={habit.id} className="flex items-center justify-between p-2 hover:bg-[var(--tokyo-hover)] rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleHabitToggle(habit)} className={cn(
                      "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                      isCompleted ? "bg-[var(--tokyo-purple)] border-[var(--tokyo-purple)] text-white" : "border-white/20 hover:border-[var(--tokyo-purple)] text-transparent"
                    )}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[var(--tokyo-text)] text-sm font-medium">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[var(--tokyo-text-muted)] bg-[var(--tokyo-hover)] px-2 py-1 rounded-full">
                    <Activity className="w-3 h-3" />
                    {habit.streak}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--tokyo-text)] font-medium">
            <CalendarIcon className="w-5 h-5 text-[var(--tokyo-pink)]" />
            <h2>Schedule</h2>
          </div>
          <div className="bg-[var(--tokyo-sidebar)] rounded-2xl p-4 border border-[var(--tokyo-border)] space-y-3 min-h-[200px]">
            {todayEvents.length > 0 ? todayEvents.map(event => (
              <div key={event.id} className="flex flex-col p-2 border-l-2 border-rose-500 bg-[rgba(255,77,125,0.12)] rounded-r-lg">
                <span className="text-[var(--tokyo-text-strong)] text-sm font-medium">{event.title}</span>
                <span className="text-[var(--tokyo-text-muted)] text-xs mt-1">{event.time} {event.location && `• ${event.location}`}</span>
              </div>
            )) : (
              <p className="text-[var(--tokyo-text-faint)] text-sm p-2">No events scheduled for today.</p>
            )}
          </div>
        </section>
      </div>
      

    </div>
  );
}
