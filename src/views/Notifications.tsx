import React from 'react';
import { Notification01Icon as Bell, CheckmarkCircle02Icon as CheckCircle2, Calendar01Icon as CalendarIcon, Target01Icon as Target, Activity01Icon as Activity } from 'hugeicons-react';
import { cn } from '../utils/cn';

export function Notifications() {
  const notifications = [
    {
      id: '1',
      type: 'task',
      title: 'Task Due Soon',
      message: '"Review Q3 OKRs" is due tomorrow.',
      time: '2 hours ago',
      read: false,
      icon: CheckCircle2,
      color: 'text-[var(--tokyo-purple)]',
      bg: 'bg-[rgba(198,140,255,0.14)]'
    },
    {
      id: '2',
      type: 'event',
      title: 'Upcoming Event',
      message: 'Team Sync starts in 15 minutes.',
      time: '15 minutes ago',
      read: false,
      icon: CalendarIcon,
      color: 'text-[var(--tokyo-pink)]',
      bg: 'bg-[rgba(255,77,125,0.2)]'
    },
    {
      id: '3',
      type: 'goal',
      title: 'Goal Milestone',
      message: 'You reached 50% on "Learn Spanish". Keep it up!',
      time: 'Yesterday',
      read: true,
      icon: Target,
      color: 'text-[var(--tokyo-green)]',
      bg: 'bg-[rgba(166,227,125,0.14)]'
    },
    {
      id: '4',
      type: 'habit',
      title: 'Habit Reminder',
      message: 'Don\'t forget to log your "Morning Workout" today.',
      time: 'Yesterday',
      read: true,
      icon: Activity,
      color: 'text-[var(--tokyo-purple)]',
      bg: 'bg-[rgba(198,140,255,0.2)]'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--tokyo-border-strong)] pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--tokyo-yellow-dim)] rounded-lg text-white">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--tokyo-text-strong)] tracking-tight">Notifications</h1>
            <p className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-base">Stay updated on your tasks and projects.</p>
          </div>
        </div>
        <button className="text-sm text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text-strong)] transition-colors w-full sm:w-auto text-left sm:text-right">
          Mark all as read
        </button>
      </header>

      <div className="space-y-4">
        {notifications.map(notification => {
          const Icon = notification.icon;
          return (
            <div 
              key={notification.id} 
              className={cn(
                "p-4 rounded-xl border flex gap-4 transition-colors cursor-pointer",
                notification.read 
                  ? "bg-[var(--tokyo-sidebar)] border-[var(--tokyo-border)] hover:border-[var(--tokyo-border-strong)]" 
                  : "bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-strong)] hover:border-white/20"
              )}
            >
              <div className={cn("p-2 rounded-lg h-fit", notification.bg, notification.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={cn("font-medium", notification.read ? "text-white/70" : "text-[var(--tokyo-text-strong)]")}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-[var(--tokyo-text-faint)]">{notification.time}</span>
                </div>
                <p className={cn("text-sm mt-1", notification.read ? "text-[var(--tokyo-text-faint)]" : "text-[var(--tokyo-text-muted)]")}>
                  {notification.message}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-[var(--tokyo-purple)] mt-2" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
