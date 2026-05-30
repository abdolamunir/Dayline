import React, { useState } from 'react';
import { useAppStore } from '../store';
import { SmileIcon as Smile, Add01Icon as Plus, MoreHorizontalIcon as MoreHorizontal, Calendar01Icon as CalendarIcon, Activity01Icon as Activity, Clock01Icon as Clock, StarIcon as Star, Cancel01Icon as X, Link01Icon as Link, UserGroupIcon as Users, Message02Icon as MessageSquare, Edit01Icon as Edit } from 'hugeicons-react';
import { TableView } from '../components/TableView';
import { InnerPageBreadcrumbs } from '../components/InnerPageBreadcrumbs';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const DEFAULT_MOOD_TABS = [
  { id: 'recent', label: 'Recent', icon: 'Clock' },
  { id: 'good', label: 'Good', icon: 'Smile' },
  { id: 'meh', label: 'Meh', icon: 'Activity' },
  { id: 'bad', label: 'Bad', icon: 'Star' },
];

const DEFAULT_MOOD_COLUMNS = [
  { id: 'title', label: 'Type', icon: 'Smile', width: '200px' },
  { id: 'intensity', label: 'Intensity', icon: 'Activity', width: '170px' },
  { id: 'date', label: 'Date', icon: 'CalendarIcon', width: '180px' },
  { id: 'journalEntryId', label: 'Journal', icon: 'Clock', width: '200px' },
];

const GOALS_TEMPLATE_VERSION = 'goals-database-v1';

function MoodDetailPage({ moodId, onBack }: { moodId: string; onBack: () => void }) {
  const { moods, journal, updateMood, deleteMood, tasks, addTask, updateTask, deleteTask } = useAppStore();
  const mood = moods.find(m => m.id === moodId);
  const [activeTab, setActiveTab] = useState('Comments');
  const [commentText, setCommentText] = useState('');
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [comments, setComments] = useState([
    { id: '1', name: 'Abdola Munir', time: 'Just now', text: `Feeling ${mood?.type || 'good'} today.`, avatar: '' },
  ]);

  if (!mood) return null;

  const handleUpdate = (updates: Partial<typeof mood>) => {
    updateMood({ ...mood, ...updates });
  };

  const handleDelete = () => {
    deleteMood(mood.id);
    onBack();
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

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#mood-details:${mood.id}`
      : '';
    if (href && navigator.clipboard) await navigator.clipboard.writeText(href);
    setIsShareMenuOpen(false);
  };

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1]";

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="inner-detail-layout flex-1">
        <div className="inner-detail-main">
          <div className="inner-detail-header flex-shrink-0 w-full">
            <div className="inner-detail-titlebar mb-5">
              <div className="inner-detail-titlebar-content flex flex-col items-start gap-3">
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)]">
                    <Smile className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="!text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight capitalize">{mood.type}</div>
                  </div>
                  <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
                    <button onClick={handleCopyLink} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]" title="Copy link">
                      <Link className="h-[18px] w-[18px]" />
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
                <InnerPageBreadcrumbs pageId="moods" pageLabel="Moods" itemLabel={mood.type} onPageClick={onBack} />
              </div>
            </div>
          </div>
          <div className="inner-detail-document">
            <div className="min-h-[42vh] flex flex-col items-center justify-center gap-6 text-center">
              <div className="text-6xl">
                {mood.type === 'rad' ? '🌟' : mood.type === 'good' ? '🙂' : mood.type === 'meh' ? '😐' : mood.type === 'bad' ? '😔' : '😫'}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    onClick={() => handleUpdate({ intensity: i })}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer",
                      i <= mood.intensity
                        ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-yellow)] scale-110"
                        : "bg-[var(--tokyo-hover)] text-[var(--tokyo-text-faint)] hover:bg-white/[0.05]"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[var(--tokyo-text-muted)]">Intensity: {mood.intensity}/5</p>
            </div>
          </div>
        </div>

        <div className="inner-detail-sidebar">
          <div className="inner-detail-properties space-y-2 mb-3">
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <Smile className="w-4 h-4" />
                  <span>Type</span>
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--tokyo-text-strong)] capitalize">{mood.type}</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <Activity className="w-4 h-4" />
                  <span>Intensity</span>
                </div>
              </div>
              <span className="text-sm text-[var(--tokyo-text-strong)]">{mood.intensity}/5</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <CalendarIcon className="w-4 h-4" />
                  <span>Date</span>
                </div>
              </div>
              <span className="text-sm text-[var(--tokyo-text-strong)]">{mood.date}</span>
            </div>
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  <Edit className="w-4 h-4" />
                  <span>Journal</span>
                </div>
              </div>
              <span className="text-sm text-[var(--tokyo-text-strong)]">
                {mood.journalEntryId ? journal.find(j => j.id === mood.journalEntryId)?.title || '—' : '—'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar px-2 border-b border-[var(--tokyo-border)]">
            {['Comments', 'Activity'].map(tabId => (
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
              Delete mood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Moods({ onViewChange, selectedMoodId }: { onViewChange?: (view: string) => void, selectedMoodId?: string }) {
  const { moods, journal, viewSettings, updateViewSettings, reorderSidebarItems, sidebarItems } = useAppStore();
  const savedSettings = viewSettings.moods || {};
  const [localSelectedMoodId, setLocalSelectedMoodId] = useState<string | null>(null);
  const shouldUseSaved = savedSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSaved && savedSettings.tabs ? savedSettings.tabs : DEFAULT_MOOD_TABS);
  const [activeTab, setActiveTab] = useState<string>(shouldUseSaved ? (savedSettings.activeTab || 'recent') : 'recent');
  const [columns, setColumns] = useState(shouldUseSaved && savedSettings.columns ? savedSettings.columns : DEFAULT_MOOD_COLUMNS);

  const effectiveSelectedMoodId = selectedMoodId || localSelectedMoodId;
  if (effectiveSelectedMoodId) {
    return <MoodDetailPage moodId={effectiveSelectedMoodId} onBack={() => { if (onViewChange) onViewChange('moods'); else setLocalSelectedMoodId(null); }} />;
  }

  const sidebarItem = sidebarItems.find(i => i.id === 'moods');

  const moodDatabasePage = {
    id: 'moods',
    title: sidebarItem?.label || savedSettings.title || 'Moods',
    description: savedSettings.description || 'Track your emotional well-being.',
    icon: sidebarItem?.icon || savedSettings.icon || 'Activity',
    kind: 'database' as const,
    isFavorite: Boolean(sidebarItem?.isFavorite),
    activeTab,
    tabs,
    columns,
    sortConfigs: shouldUseSaved ? (savedSettings.sortConfigs || []) : [],
    items: moods.map(mood => ({
      id: mood.id,
      title: mood.type.charAt(0).toUpperCase() + mood.type.slice(1),
      icon: 'Smile',
      status: mood.type,
      priority: mood.intensity >= 4 ? 'high' : mood.intensity >= 2 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
      date: mood.date,
      progress: mood.intensity * 20,
      properties: {
        type: mood.type,
        intensity: `${mood.intensity}/5`,
        journalEntryId: mood.journalEntryId ? journal.find(j => j.id === mood.journalEntryId)?.title || '—' : '—',
      },
    })),
    properties: [
      { id: 'intensity', name: 'Intensity', type: 'text' as const, value: '', icon: 'Activity' },
      { id: 'journalEntryId', name: 'Journal Entry', type: 'text' as const, value: '', icon: 'Clock' },
    ],
    content: '',
  };

  return (
    <TableView
      page={moodDatabasePage}
      onItemClick={(itemId) => { if (onViewChange) onViewChange(`mood-details:${itemId}`); else setLocalSelectedMoodId(itemId); }}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('moods', {
          ...savedSettings, title: updatedPage.title, description: updatedPage.description, icon: updatedPage.icon,
          tabs: updatedPage.tabs, columns: updatedPage.columns, activeTab: updatedPage.activeTab || activeTab,
          sortConfigs: updatedPage.sortConfigs || [], templateVersion: GOALS_TEMPLATE_VERSION,
        });
        reorderSidebarItems(sidebarItems.map(item => item.id === 'moods' ? { ...item, label: updatedPage.title, icon: updatedPage.icon || item.icon, isFavorite: Boolean(updatedPage.isFavorite) } : item));
        if (updatedPage.activeTab) setActiveTab(updatedPage.activeTab);
      }}
    />
  );
}
