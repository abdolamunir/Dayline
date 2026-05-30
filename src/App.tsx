/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { ContextPanel } from './components/ContextPanel';
import { CommandPalette } from './components/CommandPalette';
import { AppProvider, useAppStore } from './store';
import {
  Cancel01Icon as X,
  CheckmarkCircle02Icon as CheckCircle,
  Copy01Icon as Copy,
  Link01Icon as Link,
  Menu01Icon as Menu,
  Search01Icon as SearchIcon,
  UserGroupIcon as Users,
} from 'hugeicons-react';

const LAST_VIEW_STORAGE_KEY = 'dayline:last-view';

const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const Dashboard = lazy(() => import('./views/Dashboard').then(module => ({ default: module.Dashboard })));
const Tasks = lazy(() => import('./views/Tasks').then(module => ({ default: module.Tasks })));
const Projects = lazy(() => import('./views/Projects').then(module => ({ default: module.Projects })));
const Areas = lazy(() => import('./views/Areas').then(module => ({ default: module.Areas })));
const Habits = lazy(() => import('./views/Habits').then(module => ({ default: module.Habits })));
const Ideas = lazy(() => import('./views/Ideas').then(module => ({ default: module.Ideas })));
const Notes = lazy(() => import('./views/Notes').then(module => ({ default: module.Notes })));
const Goals = lazy(() => import('./views/Goals').then(module => ({ default: module.Goals })));
const Journal = lazy(() => import('./views/Journal').then(module => ({ default: module.Journal })));
const Moods = lazy(() => import('./views/Moods').then(module => ({ default: module.Moods })));
const CustomPageView = lazy(() => import('./views/CustomPageView').then(module => ({ default: module.CustomPageView })));
const Upcoming = lazy(() => import('./views/Upcoming').then(module => ({ default: module.Upcoming })));
const Trash = lazy(() => import('./views/Trash').then(module => ({ default: module.Trash })));
const Inbox = lazy(() => import('./views/Inbox').then(module => ({ default: module.Inbox })));
const Today = lazy(() => import('./views/Today').then(module => ({ default: module.Today })));
const Someday = lazy(() => import('./views/Someday').then(module => ({ default: module.Someday })));

const readLastView = (): ViewType => {
  if (typeof window === 'undefined') return 'inbox';
  return window.localStorage.getItem(LAST_VIEW_STORAGE_KEY) || 'inbox';
};

function ViewLoadingFallback() {
  return (
    <div className="grid h-full min-h-[320px] place-items-center text-[var(--tokyo-text-muted)]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(214,204,219,0.14)] border-t-[var(--tokyo-yellow)]" />
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>(() => readLastView());
  const [viewRefreshKey, setViewRefreshKey] = useState(0);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteInitialValue, setCommandPaletteInitialValue] = useState('');
  const [commandPaletteMode, setCommandPaletteMode] = useState<'default' | 'create'>('default');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteScope, setInviteScope] = useState<'workspace' | 'page'>('workspace');
  const [copiedInvite, setCopiedInvite] = useState<'workspace' | 'page' | null>(null);
  const { customPages, user, loading } = useAppStore();

  const changeView = useCallback((view: ViewType) => {
    if (view === currentView) {
      setViewRefreshKey(key => key + 1);
    }
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_VIEW_STORAGE_KEY, view);
    }
  }, [currentView]);

  useEffect(() => {
    if (!user || loading) return;
    if (!currentView.startsWith('page-')) return;
    if (customPages.some(page => page.id === currentView)) return;
    changeView('inbox');
  }, [changeView, currentView, customPages, loading, user]);

  useEffect(() => {
    if (loading || !user) return;

    const handleCommandKey = (event: KeyboardEvent) => {
      if (event.key !== 'k' || (!event.metaKey && !event.ctrlKey)) return;
      event.preventDefault();
      setCommandPaletteInitialValue('');
      setCommandPaletteMode('default');
      setIsCommandPaletteOpen(isOpen => !isOpen);
    };

    document.addEventListener('keydown', handleCommandKey);
    return () => document.removeEventListener('keydown', handleCommandKey);
  }, [loading, user]);

  const openCommandPalette = (initialValue?: string | React.MouseEvent, mode: 'default' | 'create' = 'default') => {
    setCommandPaletteInitialValue(typeof initialValue === 'string' ? initialValue : '');
    setCommandPaletteMode(mode);
    setIsCommandPaletteOpen(true);
  };

  const renderedView = useMemo(() => {
    if (currentView.startsWith('page-item:')) {
      const parts = currentView.split(':');
      const pageId = parts[1];
      const itemId = parts[2];
      const page = customPages.find(p => p.id === pageId);
      if (page) {
        return <CustomPageView key={`page-item-${pageId}-${itemId}`} page={page} onViewChange={changeView} initialSelectedItemId={itemId} />;
      }
    }

    if (currentView.startsWith('page-')) {
      const page = customPages.find(p => p.id === currentView);
      if (page) {
        return <CustomPageView key={`${page.id}-${viewRefreshKey}`} page={page} onViewChange={changeView} />;
      }
    }

    if (currentView.startsWith('goal-details:')) {
      const id = currentView.split(':')[1];
      return <Goals key={`goal-details-${id}`} onViewChange={changeView} selectedGoalId={id} />;
    }

    if (currentView.startsWith('note-details:')) {
      const id = currentView.split(':')[1];
      return <Notes key={`note-details-${id}`} onViewChange={changeView} selectedNoteId={id} />;
    }

    if (currentView.startsWith('idea-details:')) {
      const id = currentView.split(':')[1];
      return <Ideas key={`idea-details-${id}`} onViewChange={changeView} selectedIdeaId={id} />;
    }

    if (currentView.startsWith('project-details:')) {
      const id = currentView.split(':')[1];
      return <Projects key={`project-details-${id}`} onViewChange={changeView} selectedProjectId={id} />;
    }

    if (currentView.startsWith('area-details:')) {
      const id = currentView.split(':')[1];
      return <Areas key={`area-details-${id}`} onViewChange={changeView} selectedAreaId={id} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <Tasks />;
      case 'projects': return <Projects key={`projects-${viewRefreshKey}`} onViewChange={changeView} />;
      case 'areas': return <Areas key={`areas-${viewRefreshKey}`} onViewChange={changeView} />;
      case 'habits': return <Habits />;
      case 'notes': return <Notes key={`notes-${viewRefreshKey}`} />;
      case 'goals': return <Goals onViewChange={changeView} />;
      case 'ideas': return <Ideas onViewChange={changeView} />;
      case 'journal': return <Journal />;
      case 'moods': return <Moods />;
      case 'trash': return <Trash />;
      case 'inbox': return <Inbox />;
      case 'today': return <Today />;
      case 'upcoming': return <Upcoming />;
      case 'someday': return <Someday />;
      case 'logbook':
        return <Tasks title="Logbook" description="Completed tasks." hideFilters customFilter={(t) => t.status === 'done'} />;
      default: 
        return (
          <div className="flex items-center justify-center h-full text-[var(--tokyo-text-faint)]">
            <p>View "{currentView}" is under construction.</p>
          </div>
        );
    }
  }, [changeView, currentView, customPages, viewRefreshKey]);

  const currentPageLabel = currentView.startsWith('page-item:')
    ? 'Item'
    : currentView.startsWith('page-')
      ? customPages.find(p => p.id === currentView)?.title || 'Page'
      : currentView.startsWith('goal-details:')
        ? 'Goal'
      : currentView.startsWith('note-details:')
        ? 'Note'
        : currentView.startsWith('idea-details:')
          ? 'Idea'
          : currentView.startsWith('project-details:')
            ? 'Project'
            : currentView.startsWith('area-details:')
              ? 'Area'
              : currentView.replace('-', ' ');

  const buildInviteLink = (scope: 'workspace' | 'page') => {
    if (typeof window === 'undefined') return '';
    const target = scope === 'workspace' ? 'workspace' : currentView;
    const token = window.btoa(`${user?.uid || 'dayline'}:${target}`).replace(/[=+/]/g, '').slice(0, 18);
    return `${window.location.origin}/invite?scope=${scope}&target=${encodeURIComponent(target)}&token=${token}`;
  };

  const copyInviteLink = async (scope: 'workspace' | 'page') => {
    const link = buildInviteLink(scope);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(scope);
      window.setTimeout(() => setCopiedInvite(null), 1600);
    } catch (error) {
      console.warn('Unable to copy invite link.', error);
    }
  };

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-[#07070a] font-sans text-[var(--tokyo-text)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(214,204,219,0.16)] border-t-[var(--tokyo-yellow)]" />
          <p className="text-sm font-bold text-[var(--tokyo-text-muted)]">Loading Your Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <LandingPage />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--tokyo-bg)] font-sans text-[var(--tokyo-text)] selection:bg-[var(--tokyo-yellow-soft)]">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          changeView(view);
          setIsMobileMenuOpen(false);
        }} 
        onOpenCommandPalette={openCommandPalette}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
      />
      
      <main className="dayline-main-surface relative flex flex-1 flex-col overflow-y-auto pb-8">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-[var(--tokyo-border)] bg-[var(--tokyo-sidebar)]/95 backdrop-blur sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text-strong)] transition-colors cursor-pointer">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold capitalize text-[var(--tokyo-text-strong)] truncate max-w-[150px] text-center">
            {currentView.startsWith('page-') ? customPages.find(p => p.id === currentView)?.title || 'Page' : currentView.replace('-', ' ')}
          </span>
          <button onClick={() => openCommandPalette()} className="text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text-strong)] transition-colors cursor-pointer">
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1">
          <Suspense fallback={<ViewLoadingFallback />}>
            {renderedView}
          </Suspense>
        </div>
      </main>

      <ContextPanel 
        isOpen={isContextOpen} 
        onClose={() => setIsContextOpen(false)}
        title="Details"
      >
        <div className="text-[var(--tokyo-text-muted)] text-sm">
          Select an item to view details.
        </div>
      </ContextPanel>

      {isCommandPaletteOpen && (
        <CommandPalette 
          open={isCommandPaletteOpen} 
          setOpen={setIsCommandPaletteOpen} 
          onViewChange={changeView} 
          initialValue={commandPaletteInitialValue}
          mode={commandPaletteMode}
        />
      )}

      {isInviteOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
          <button
            className="absolute inset-0 cursor-default"
            onClick={() => setIsInviteOpen(false)}
            aria-label="Close invite dialog"
          />
          <section className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--tokyo-border-strong)] bg-[var(--tokyo-panel)] shadow-[0_28px_120px_rgba(0,0,0,0.6)]">
            <div className="border-b border-[var(--tokyo-border)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex h-9 items-center gap-2 rounded-md bg-[var(--tokyo-panel-2)] px-3 text-sm font-bold text-[var(--tokyo-text-muted)]">
                    <Users className="h-4 w-4 text-[var(--tokyo-green)]" />
                    Live collaboration
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-normal text-[var(--tokyo-text-strong)]">Invite people</h2>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-[var(--tokyo-text-muted)]">
                    Share access to your workspace or invite someone directly into {currentPageLabel}.
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-md p-2 text-[var(--tokyo-text-faint)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--tokyo-bg-deep)] p-1">
                {(['workspace', 'page'] as const).map(scope => (
                  <button
                    key={scope}
                    onClick={() => setInviteScope(scope)}
                    className={[
                      "h-9 rounded-md text-sm font-bold capitalize transition-colors",
                      inviteScope === scope
                        ? "bg-[var(--tokyo-panel-3)] text-[var(--tokyo-text-strong)]"
                        : "text-[var(--tokyo-text-muted)] hover:text-[var(--tokyo-text-strong)]"
                    ].join(' ')}
                  >
                    {scope}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--tokyo-text-strong)]">
                      {inviteScope === 'workspace' ? 'Workspace invite' : 'Current page invite'}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--tokyo-text-faint)]">
                      {inviteScope === 'workspace' ? user?.email || 'Your account' : currentPageLabel}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgba(44,88,64,0.42)] px-2 py-1 text-[11px] font-bold text-[#9fddb4]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--tokyo-green)]" />
                    Can edit
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[var(--tokyo-bg-deep)] px-3 py-2 text-sm font-bold text-[var(--tokyo-text-muted)]">
                  <Link className="h-4 w-4 shrink-0 text-[var(--tokyo-yellow)]" />
                  <span className="min-w-0 flex-1 truncate">{buildInviteLink(inviteScope)}</span>
                </div>
                <button
                  onClick={() => copyInviteLink(inviteScope)}
                  className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[var(--tokyo-yellow-dim)] px-3 text-sm font-extrabold text-[var(--tokyo-text-strong)] transition-colors hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)]"
                >
                  {copiedInvite === inviteScope ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedInvite === inviteScope ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-[60] hidden h-8 items-center justify-between overflow-hidden border-t border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)]/95 px-2 text-[12px] font-bold leading-none text-[var(--tokyo-text-muted)] backdrop-blur md:flex">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘P</kbd> Commands</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘K</kbd> Jump To</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌃N</kbd> New page ...</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘⇧F</kbd> Search...</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-[var(--tokyo-text-muted)] transition-colors hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
          >
            <Users className="h-4 w-4" />
            Invite
          </button>
          <span className="hidden lg:inline">Arrow Keys Navigate</span>
          <span>Status</span>
          <span className="text-[var(--tokyo-green)]">●</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
