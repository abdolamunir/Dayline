import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Dumbbell01Icon as Dumbbell, Add01Icon as Plus, MoreHorizontalIcon as MoreHorizontal, Calendar01Icon as CalendarIcon, CheckmarkCircle02Icon as CheckCircle, Clock01Icon as Clock, Target01Icon as Target, Cancel01Icon as X, ArrowDown01Icon as ChevronDown, Link01Icon as Link, StarIcon as Star, UserGroupIcon as Users, SmileIcon as Smile, Activity01Icon as Activity, Message02Icon as MessageSquare } from 'hugeicons-react';
import { ALL_ICONS } from '../components/IconPicker';
import { IconPicker } from '../components/IconPicker';
import { TableView } from '../components/TableView';
import { InnerPageBreadcrumbs } from '../components/InnerPageBreadcrumbs';
import { BlockEditor } from '../components/BlockEditor';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const DEFAULT_HABIT_TABS = [
  { id: 'daily', label: 'Daily', icon: 'Clock' },
  { id: 'weekly', label: 'Weekly', icon: 'CalendarIcon' },
];

const DEFAULT_HABIT_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'Dumbbell', width: '320px' },
  { id: 'frequency', label: 'Frequency', icon: 'Clock', width: '170px' },
  { id: 'streak', label: 'Streak', icon: 'CheckCircle', width: '150px' },
  { id: 'goalId', label: 'Goal', icon: 'Target', width: '200px' },
  { id: 'date', label: 'Created', icon: 'CalendarIcon', width: '180px' },
];

const GOALS_TEMPLATE_VERSION = 'goals-database-v1';

function HabitDetailPage({ habitId, onBack }: { habitId: string; onBack: () => void }) {
  const { habits, goals, tasks, updateHabit, deleteHabit, addTask, updateTask, deleteTask, user } = useAppStore();
  const habit = habits.find(h => h.id === habitId);
  const [activeTab, setActiveTab] = useState('To-Dos');
  const [commentText, setCommentText] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [comments, setComments] = useState([
    { id: '1', name: 'Abdola Munir', time: 'Just now', text: `Let's keep up this habit streak!`, avatar: '' },
  ]);

  if (!habit) return null;

  const habitTasks = tasks.filter(t => t.goalId === habit.goalId);

  const handleUpdate = (updates: Partial<typeof habit>) => {
    updateHabit({ ...habit, ...updates });
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    onBack();
  };

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({ id, title: '', status: 'todo', priority: 'medium', goalId: habit.goalId || '', tags: [] });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      setComments([
        { id: `c${Date.now()}`, name: 'Abdola Munir', time: 'Just now', text: commentText, avatar: '' },
        ...comments
      ]);
      setCommentText('');
    }
  };

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] [&_input]:min-w-0";

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#habit-details:${habit.id}`
      : '';
    if (href && navigator.clipboard) await navigator.clipboard.writeText(href);
    setIsShareMenuOpen(false);
  };

  const toSentenceCase = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="inner-detail-layout flex-1">
        <div className="inner-detail-main">
          <div className="inner-detail-header flex-shrink-0 w-full">
            <div className="inner-detail-titlebar mb-5">
              <div className="inner-detail-titlebar-content flex flex-col items-start gap-3">
                <div className="flex w-full items-center gap-3">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                      setIsIconPickerOpen(true);
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] cursor-pointer hover:bg-white/[0.05] transition-colors"
                  >
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={habit.name}
                      onChange={(e) => handleUpdate({ name: e.target.value })}
                      className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                      placeholder="Untitled Habit"
                    />
                  </div>
                  <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
                    <button onClick={handleCopyLink} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]" title="Copy link">
                      <Link className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => {/* favorite toggle could go here */}}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                      title="Favorite"
                    >
                      <Star className="h-[18px] w-[18px]" />
                    </button>
                    <div className="relative">
                      <button onClick={() => setIsShareMenuOpen(o => !o)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]" title="Invite people">
                        <Users className="h-[18px] w-[18px]" />
                      </button>
                      {isShareMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsShareMenuOpen(false)} />
                          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                            <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]">
                              <Users className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                              Invite people
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={onBack} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]" title="Close">
                      <X className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>
                <InnerPageBreadcrumbs pageId="habits" pageLabel="Habits" itemLabel={habit.name} onPageClick={onBack} />
              </div>
            </div>
          </div>
          <div className="inner-detail-document">
            <div className="min-h-[42vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent=""
                onChange={() => {}}
              />
            </div>
          </div>
        </div>

        <div className="inner-detail-sidebar">
          <div className="inner-detail-properties space-y-2 mb-3">
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <Clock className="w-4 h-4" />
                  <span>Frequency</span>
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--tokyo-text-strong)] capitalize">{habit.frequency}</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <CheckCircle className="w-4 h-4" />
                  <span>Streak</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-[rgba(166,227,125,0.14)] px-2.5 py-0.5 text-sm font-semibold text-[var(--tokyo-green)]">{habit.streak} days</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <Target className="w-4 h-4" />
                  <span>Goal</span>
                </div>
              </div>
              <span className="text-sm text-[var(--tokyo-text-strong)]">{goals.find(g => g.id === habit.goalId)?.title || '—'}</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <CalendarIcon className="w-4 h-4" />
                  <span>Total Logs</span>
                </div>
              </div>
              <span className="text-sm text-[var(--tokyo-text-strong)]">{Object.keys(habit.logs).length}</span>
            </div>
          </div>

          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar px-2 border-b border-[var(--tokyo-border)]">
            {['To-Dos', 'Comments', 'Activity'].map(tabId => (
              <div
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "flex items-center py-2 text-sm font-medium transition-[color,box-shadow] whitespace-nowrap cursor-pointer",
                  activeTab === tabId
                    ? "text-[var(--tokyo-text-strong)] shadow-[inset_0_-3px_0_var(--tokyo-yellow)]"
                    : "text-[var(--tokyo-text-muted)] shadow-[inset_0_-3px_0_transparent] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                {tabId}
              </div>
            ))}
          </div>

          <div className="flex-1 w-full pt-4 px-2 overflow-y-auto">
            {activeTab === 'To-Dos' && (
              <div>
                {habitTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 group hover:bg-white/[0.03] rounded-md transition-all px-1 py-1">
                    <button
                      onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                      className={cn(
                        "shrink-0 rounded-[4px] border-[2px] flex items-center justify-center transition-all cursor-pointer w-4 h-4",
                        task.status === 'done'
                          ? "bg-[var(--tokyo-yellow)] border-[var(--tokyo-yellow)]"
                          : "border-[var(--tokyo-yellow)] bg-transparent hover:bg-[var(--tokyo-yellow)]/10"
                      )}
                    >
                      {task.status === 'done' && (
                        <svg className="w-3 h-3 text-[var(--tokyo-bg)] stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask({ ...task, title: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Backspace' && !task.title) { e.preventDefault(); deleteTask(task.id); } }}
                      placeholder="Task description..."
                      className={cn(
                        "bg-transparent border-none outline-none flex-1 text-sm transition-all placeholder:text-white/10 outline-none focus:outline-none focus:ring-transparent shadow-none",
                        task.status === 'done' ? "text-[var(--tokyo-text-faint)] line-through" : "text-[var(--tokyo-text)]"
                      )}
                    />
                  </div>
                ))}
                <button onClick={handleAddTask} className="flex items-center gap-2 px-1 py-2 text-sm text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-yellow)] transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="font-medium">Add new task</span>
                </button>
              </div>
            )}

            {activeTab === 'Comments' && (
              <>
                <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-lg p-2 mb-6">
                  <div className="flex gap-2 mb-2">
                    <textarea
                      rows={1.5}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your comment..."
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-[11px] resize-none py-0.5 shadow-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[var(--tokyo-text-faint)]">
                      <button className="hover:text-white transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={handleAddComment} className="bg-[var(--tokyo-yellow-dim)] text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors cursor-pointer">
                      Comment
                    </button>
                  </div>
                </div>
                <div className="space-y-4 pb-20">
                  {comments.map((comment, index) => (
                    <div key={comment.id} className={`flex gap-2.5 group pb-4 ${index !== comments.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--tokyo-text-strong)] font-semibold text-sm">{comment.name}</span>
                            <span className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors text-xs">•</span>
                            <span className="text-[var(--tokyo-text-faint)] text-xs">{comment.time}</span>
                          </div>
                          <button className="text-white/10 group-hover:text-[var(--tokyo-text-faint)] transition-colors cursor-pointer">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[var(--tokyo-text)] text-sm leading-relaxed break-words">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'Activity' && (
              <div className="flex items-center gap-3 text-[13px] text-[var(--tokyo-text-faint)]">
                <Activity className="w-3.5 h-3.5" />
                <span>No recent activity</span>
              </div>
            )}
          </div>

          <div className="px-2 pt-2 border-t border-[var(--tokyo-border)]">
            <button onClick={handleDelete} className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#f0a0a8] transition-colors hover:bg-[rgba(112,31,45,0.54)]">
              Delete habit
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isIconPickerOpen && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsIconPickerOpen(false)} />
            <div className="fixed z-[120]" style={{ top: iconPickerPos.y, left: iconPickerPos.x }}>
              <IconPicker
                currentIcon="Dumbbell"
                onSelect={() => setIsIconPickerOpen(false)}
                onClose={() => setIsIconPickerOpen(false)}
              />
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Habits({ onViewChange, selectedHabitId }: { onViewChange?: (view: string) => void, selectedHabitId?: string }) {
  const { habits, goals, viewSettings, updateViewSettings, reorderSidebarItems, sidebarItems } = useAppStore();
  const savedSettings = viewSettings.habits || {};
  const [localSelectedHabitId, setLocalSelectedHabitId] = useState<string | null>(null);
  const shouldUseSaved = savedSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSaved && savedSettings.tabs ? savedSettings.tabs : DEFAULT_HABIT_TABS);
  const [activeTab, setActiveTab] = useState<string>(shouldUseSaved ? (savedSettings.activeTab || 'daily') : 'daily');
  const [columns, setColumns] = useState(shouldUseSaved && savedSettings.columns ? savedSettings.columns : DEFAULT_HABIT_COLUMNS);

  const effectiveSelectedHabitId = selectedHabitId || localSelectedHabitId;
  if (effectiveSelectedHabitId) {
    return <HabitDetailPage habitId={effectiveSelectedHabitId} onBack={() => { if (onViewChange) onViewChange('habits'); else setLocalSelectedHabitId(null); }} />;
  }

  const sidebarItem = sidebarItems.find(i => i.id === 'habits');

  const habitDatabasePage = {
    id: 'habits',
    title: sidebarItem?.label || savedSettings.title || 'Habits',
    description: savedSettings.description || 'Track your daily and weekly routines.',
    icon: sidebarItem?.icon || savedSettings.icon || 'Dumbbell',
    kind: 'database' as const,
    isFavorite: Boolean(sidebarItem?.isFavorite),
    activeTab,
    tabs,
    columns,
    sortConfigs: shouldUseSaved ? (savedSettings.sortConfigs || []) : [],
    items: habits.map(habit => ({
      id: habit.id,
      title: habit.name,
      icon: 'Dumbbell',
      status: habit.frequency,
      priority: habit.streak > 10 ? 'high' : habit.streak > 3 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
      date: '',
      progress: 0,
      properties: {
        frequency: habit.frequency,
        streak: String(habit.streak),
        goalId: goals.find(g => g.id === habit.goalId)?.title || '—',
        logs: Object.keys(habit.logs).length,
      },
    })),
    properties: [
      { id: 'frequency', name: 'Frequency', type: 'text' as const, value: '', icon: 'Clock' },
      { id: 'streak', name: 'Streak', type: 'text' as const, value: '', icon: 'CheckCircle' },
      { id: 'goalId', name: 'Goal', type: 'text' as const, value: '', icon: 'Target' },
    ],
    content: '',
  };

  return (
    <TableView
      page={habitDatabasePage}
      onItemClick={(itemId) => { if (onViewChange) onViewChange(`habit-details:${itemId}`); else setLocalSelectedHabitId(itemId); }}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('habits', {
          ...savedSettings, title: updatedPage.title, description: updatedPage.description, icon: updatedPage.icon,
          tabs: updatedPage.tabs, columns: updatedPage.columns, activeTab: updatedPage.activeTab || activeTab,
          sortConfigs: updatedPage.sortConfigs || [], templateVersion: GOALS_TEMPLATE_VERSION,
        });
        reorderSidebarItems(sidebarItems.map(item => item.id === 'habits' ? { ...item, label: updatedPage.title, icon: updatedPage.icon || item.icon, isFavorite: Boolean(updatedPage.isFavorite) } : item));
        if (updatedPage.activeTab) setActiveTab(updatedPage.activeTab);
      }}
    />
  );
}
