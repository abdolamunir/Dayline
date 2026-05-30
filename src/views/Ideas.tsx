import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Idea } from '../types';
import {
  Calendar01Icon as CalendarIcon,
  CheckmarkCircle02Icon as CheckCircle,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  SmileIcon as Smile,
  Add01Icon as Plus,
  StarIcon as Star,
  UserGroupIcon as Users,
  Link01Icon as Link,
  Cancel01Icon as X,
  MoreHorizontalIcon as MoreHorizontal,
  Activity01Icon as Activity,
  AtIcon as AtSign,
  HashtagIcon as Hash,
  AttachmentIcon as Attachment,
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TableView } from '../components/TableView';
import { BlockEditor } from '../components/BlockEditor';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { InnerPageBreadcrumbs } from '../components/InnerPageBreadcrumbs';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { format } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  ...ALL_ICONS,
  Smile: Smile,
  Clock: Clock,
  Circle: Circle,
  CheckCircle: CheckCircle,
  CalendarIcon: CalendarIcon,
};

const DEFAULT_IDEA_TABS = [
  { id: 'active', label: 'Active', icon: 'Smile' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'archived', label: 'Archived', icon: 'Circle' },
];

const DEFAULT_IDEA_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'date', label: 'Created', icon: 'CalendarIcon', width: '180px' },
];

const IDEA_STATUS_OPTIONS = ['active', 'completed', 'archived'];

const toSentenceCase = (str: string) => {
  if (!str) return '';
  const formatted = str.replace(/-/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
};

function IdeasList({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const { ideas, viewSettings, updateViewSettings, replaceIdeas, sidebarItems, reorderSidebarItems } = useAppStore();
  const savedSettings = viewSettings.ideas || {};

  const [tabs, setTabs] = useState(savedSettings.tabs || DEFAULT_IDEA_TABS);
  const [activeTab, setActiveTab] = useState<string>(savedSettings.activeTab || 'active');
  const [columns, setColumns] = useState(savedSettings.columns || DEFAULT_IDEA_COLUMNS);

  useEffect(() => {
    const settings = viewSettings.ideas;
    if (!settings) return;
    if (settings.tabs) setTabs(settings.tabs);
    if (settings.columns) setColumns(settings.columns);
    if (settings.activeTab) setActiveTab(settings.activeTab);
  }, [viewSettings.ideas]);

  useEffect(() => {
    updateViewSettings('ideas', { tabs, columns, activeTab });
  }, [tabs, columns, activeTab]);

  const sidebarItem = sidebarItems.find(i => i.id === 'ideas');
  const ideaDatabasePage = {
    id: 'ideas',
    title: sidebarItem?.label || savedSettings.title || 'Ideas',
    description: savedSettings.description || 'Capture and organise your ideas.',
    icon: sidebarItem?.icon || savedSettings.icon || 'Smile',
    kind: 'database' as const,
    isFavorite: Boolean(sidebarItem?.isFavorite),
    activeTab,
    tabs,
    columns,
    sortConfigs: savedSettings.sortConfigs || [],
    items: ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      icon: idea.icon || 'Smile',
      status: idea.status || 'active',
      priority: idea.priority || 'medium',
      date: idea.createdAt,
      progress: 0,
      isFavorite: Boolean(idea.isFavorite),
      properties: {
        description: idea.description,
        tags: idea.tags,
      },
    })),
    properties: [],
    content: '',
  };

  return (
    <TableView
      page={ideaDatabasePage}
      onItemClick={(itemId) => {
        if (onViewChange) onViewChange(`idea-details:${itemId}`);
      }}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('ideas', {
          ...savedSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab || activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
        });
        reorderSidebarItems(sidebarItems.map(item => (
          item.id === 'ideas'
            ? {
              ...item,
              label: updatedPage.title,
              icon: updatedPage.icon || item.icon,
              isFavorite: Boolean(updatedPage.isFavorite),
            }
            : item
        )));
        if (updatedPage.activeTab) setActiveTab(updatedPage.activeTab);

        const nextIdeas = updatedPage.items.map(item => {
          const existingIdea = ideas.find(idea => idea.id === item.id);
          return existingIdea
            ? {
              ...existingIdea,
              title: item.title,
              icon: item.icon,
              status: item.status,
              priority: item.priority as Idea['priority'],
              createdAt: item.date || existingIdea.createdAt,
              isFavorite: item.isFavorite,
              description: String(item.properties?.description ?? ''),
              tags: (item.properties?.tags as string[]) || [],
            }
            : {
              id: item.id,
              title: item.title,
              description: '',
              tags: [],
              createdAt: item.date || new Date().toISOString(),
              status: item.status,
              priority: item.priority as Idea['priority'],
              icon: item.icon || 'Smile',
              isFavorite: item.isFavorite,
            };
        });
        replaceIdeas(nextIdeas);
      }}
    />
  );
}

function IdeaDetailsPage({ idea, onBack }: { idea: Idea; onBack: () => void }) {
  const { ideas, updateIdea, deleteIdea, user } = useAppStore();
  const [activeTab, setActiveTab] = useState('Comments');
  const [commentText, setCommentText] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [customDropdown, setCustomDropdown] = useState<{
    type: 'status' | 'priority';
    pos: { x: number; y: number };
    currentValue: string;
  } | null>(null);
  const [comments, setComments] = useState([
    { id: '1', name: 'Abdola Munir', time: 'Just now', text: 'This idea has potential. Let\'s explore it further.', avatar: '' },
  ]);

  const handleUpdate = (updates: Partial<Idea>) => {
    updateIdea({ ...idea, ...updates });
  };

  const handleDelete = () => {
    deleteIdea(idea.id);
    onBack();
  };

  const handleCopyLink = async () => {
    const href = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#idea-details:${idea.id}`
      : '';
    if (href && navigator.clipboard) {
      await navigator.clipboard.writeText(href);
    }
    setIsShareMenuOpen(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments([
      {
        id: `c${Date.now()}`,
        name: 'Abdola Munir',
        time: 'Just now',
        text: commentText.trim(),
        avatar: user?.photoURL || '',
      },
      ...comments,
    ]);
    setCommentText('');
  };

  const propertyRowClass = "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 group/prop -mx-2 px-2 py-1 relative";
  const propertyLabelClass = "flex h-8 items-center gap-2 w-[145px] px-2.5 rounded-lg text-[var(--tokyo-text-faint)] text-sm font-medium transition-colors hover:bg-white/[0.03] hover:text-[var(--tokyo-text-muted)] whitespace-nowrap overflow-hidden [&_span]:truncate [&_svg]:shrink-0 [&_svg]:[stroke-width:2.1] cursor-pointer";

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      <div className="inner-detail-layout flex-1">
        <div className="inner-detail-main">
          {/* Header */}
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
                    {React.createElement(ALL_ICONS[idea.icon || 'Smile'] || Smile, { className: "w-6 h-6" })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={idea.title}
                      onChange={(e) => handleUpdate({ title: e.target.value })}
                      className="block min-w-0 w-full bg-transparent !text-2xl md:!text-[28px] !font-semibold leading-tight text-[var(--tokyo-text-strong)] tracking-tight outline-none placeholder:text-white/10"
                      placeholder="Untitled Idea"
                    />
                  </div>
                  <div className="relative flex shrink-0 items-center gap-1.5 text-[var(--tokyo-text-faint)]">
                    <button
                      onClick={() => void handleCopyLink()}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                      title="Copy link"
                    >
                      <Link className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      onClick={() => handleUpdate({ isFavorite: !idea.isFavorite })}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--tokyo-hover)]",
                        idea.isFavorite ? "text-[var(--tokyo-yellow)]" : "text-[var(--tokyo-text-faint)] hover:text-[var(--tokyo-text)]"
                      )}
                      title="Favorite"
                    >
                      <Star className={cn("h-[18px] w-[18px]", idea.isFavorite && "fill-[var(--tokyo-yellow)]")} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setIsShareMenuOpen((open) => !open)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                        title="Invite people"
                      >
                        <Users className="h-[18px] w-[18px]" />
                      </button>
                      {isShareMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsShareMenuOpen(false)} />
                          <div className="dayline-share-menu absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel-2)] py-1.5 shadow-2xl">
                            <button
                              onClick={() => void handleCopyLink()}
                              className="dayline-share-menu-item flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-[var(--tokyo-text)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                            >
                              <Link className="h-4 w-4 text-[var(--tokyo-text-faint)]" />
                              Copy link
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={onBack}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text)]"
                      title="Close"
                    >
                      <X className="h-[18px] w-[18px]" />
                    </button>
                  </div>
                </div>
                <InnerPageBreadcrumbs pageId="ideas" pageLabel="Ideas" itemLabel={idea.title} onPageClick={onBack} />
              </div>
            </div>
          </div>

          <div className="inner-detail-document">
            <div className="min-h-[55vh] text-[var(--tokyo-text-strong)]">
              <BlockEditor
                initialContent={idea.description || ''}
                onChange={(nextContent) => handleUpdate({ description: nextContent })}
              />
            </div>
          </div>
        </div>

        <div className="inner-detail-sidebar">
          {/* Properties */}
          <div className="inner-detail-properties space-y-2">
            {/* Status */}
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  {React.createElement(CheckCircle, { className: "w-4 h-4" })}
                  <span>Status</span>
                </div>
              </div>
              <div className="relative flex items-center gap-2">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCustomDropdown({
                      type: 'status',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: idea.status || 'active',
                    });
                  }}
                  className={cn(
                    "flex items-center px-2.5 py-0.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-all hover:bg-white/[0.03] h-7",
                    idea.status === 'completed'
                      ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]"
                      : idea.status === 'archived'
                        ? "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                        : "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]"
                  )}
                >
                  <span>{toSentenceCase(idea.status || 'active')}</span>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  {React.createElement(Clock, { className: "w-4 h-4" })}
                  <span>Priority</span>
                </div>
              </div>
              <div className="relative flex items-center">
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setCustomDropdown({
                      type: 'priority',
                      pos: { x: rect.left, y: rect.bottom + 8 },
                      currentValue: idea.priority || 'medium',
                    });
                  }}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-white/[0.03] h-7 flex items-center",
                    getPriorityBadgeClasses(idea.priority || 'medium')
                  )}
                >
                  {toSentenceCase(idea.priority || 'medium')}
                </div>
              </div>
            </div>

            {/* Created Date */}
            <div className={propertyRowClass}>
              <div className="w-40 shrink-0 flex items-center">
                <div className={propertyLabelClass}>
                  {React.createElement(CalendarIcon, { className: "w-4 h-4" })}
                  <span>Created</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-0.5 text-sm text-[var(--tokyo-text-faint)]">
                {idea.createdAt ? format(new Date(idea.createdAt), 'MMM d, yyyy') : 'Unknown'}
              </div>
            </div>

            {/* Tags */}
            {idea.tags.length > 0 && (
              <div className={propertyRowClass}>
                <div className="w-40 shrink-0 flex items-center">
                  <div className={propertyLabelClass}>
                    {React.createElement(Hash, { className: "w-4 h-4" })}
                    <span>Tags</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {idea.tags.map(tag => (
                    <span key={tag} className="flex h-6 items-center rounded-md bg-white/[0.035] px-2 text-[12px] font-semibold text-[var(--tokyo-text)]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="inner-detail-tabs flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--tokyo-border)]">
            <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
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
          </div>

          {/* Content Area */}
          <div className="inner-detail-panel-content flex-1 w-full pt-4">
            {activeTab === 'Comments' && (
              <>
                <div className="bg-white/[0.015] border border-[var(--tokyo-border)] rounded-lg p-2 mb-6">
                  <div className="flex gap-2 mb-2">
                    <img
                      src={user?.photoURL || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff'}
                      className="w-6 h-6 rounded-full shrink-0 border border-white/5"
                      alt="me"
                    />
                    <textarea
                      rows={1.5}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add your comment..."
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:ring-transparent focus:border-transparent focus-visible:ring-0 focus-visible:outline-none text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-[11px] resize-none py-0.5 shadow-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[var(--tokyo-text-faint)]">
                      <button className="hover:text-white transition-colors cursor-pointer"><Smile className="w-3.5 h-3.5" /></button>
                      <button className="hover:text-white transition-colors cursor-pointer"><AtSign className="w-3.5 h-3.5" /></button>
                      <button className="hover:text-white transition-colors cursor-pointer"><Link className="w-3.5 h-3.5" /></button>
                      <button className="hover:text-white transition-colors cursor-pointer"><Hash className="w-3.5 h-3.5" /></button>
                      <button className="hover:text-white transition-colors cursor-pointer"><Attachment className="w-3.5 h-3.5" /></button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      className="bg-[var(--tokyo-yellow-dim)] text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-[var(--tokyo-yellow)] transition-colors shadow-md shadow-black/20 cursor-pointer"
                    >
                      Comment
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pb-20">
                  {comments.map((comment, index) => (
                    <div
                      key={comment.id}
                      className={`flex gap-2.5 group pb-4 ${
                        index !== comments.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      <img
                        src={comment.name === 'Abdola Munir' ? (user?.photoURL || comment.avatar || 'https://ui-avatars.com/api/?name=Abdola+Munir&background=0D8ABC&color=fff') : comment.avatar}
                        className="w-7 h-7 rounded-full shrink-0 border border-white/5"
                        alt="avatar"
                      />
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
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-[13px] text-[var(--tokyo-text-faint)]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>No recent activity</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popovers */}
      <AnimatePresence>
        {isIconPickerOpen && iconPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsIconPickerOpen(false)} />
            <div className="fixed z-[120]" style={{ top: iconPickerPos.y, left: iconPickerPos.x }}>
              <IconPicker
                currentIcon={idea.icon || 'Smile'}
                onSelect={(iconName) => {
                  handleUpdate({ icon: iconName });
                  setIsIconPickerOpen(false);
                }}
                onClose={() => setIsIconPickerOpen(false)}
              />
            </div>
          </>
        )}

        {customDropdown && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setCustomDropdown(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="property-popover fixed z-[140] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border)] rounded-xl shadow-2xl p-1.5 w-48 overflow-hidden"
              style={{
                top: Math.min(customDropdown.pos.y, window.innerHeight - 200),
                left: Math.min(customDropdown.pos.x, window.innerWidth - 200),
              }}
            >
              <div className="property-popover-heading px-2.5 py-1 font-bold text-[var(--tokyo-text-faint)] tracking-wider">
                Select {toSentenceCase(customDropdown.type)}
              </div>
              <div className="space-y-0.5">
                {(customDropdown.type === 'status' ? IDEA_STATUS_OPTIONS : ['low', 'medium', 'high']).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      handleUpdate({ [customDropdown.type]: option });
                      setCustomDropdown(null);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors text-left group cursor-pointer",
                      customDropdown.currentValue === option
                        ? "bg-[var(--tokyo-yellow-dim)] text-white"
                        : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                    )}
                  >
                    <span>{toSentenceCase(option)}</span>
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

export function Ideas({ onViewChange, selectedIdeaId }: { onViewChange?: (view: string) => void, selectedIdeaId?: string }) {
  const { ideas } = useAppStore();
  const [localSelectedIdeaId, setLocalSelectedIdeaId] = useState<string | null>(null);

  const effectiveSelectedIdeaId = selectedIdeaId || localSelectedIdeaId;
  const selectedIdea = effectiveSelectedIdeaId ? ideas.find(i => i.id === effectiveSelectedIdeaId) : null;

  if (selectedIdea) {
    return (
      <IdeaDetailsPage
        idea={selectedIdea}
        onBack={() => {
          if (onViewChange) {
            onViewChange('ideas');
          } else {
            setLocalSelectedIdeaId(null);
          }
        }}
      />
    );
  }

  return <IdeasList onViewChange={onViewChange} />;
}
