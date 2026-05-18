/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { ContextPanel } from './components/ContextPanel';
import { CommandPalette } from './components/CommandPalette';
import { LandingPage } from './components/LandingPage';
import { AppProvider, useAppStore } from './store';
import { Dashboard } from './views/Dashboard';
import { Tasks } from './views/Tasks';
import { Projects } from './views/Projects';
import { Areas } from './views/Areas';
import { Habits } from './views/Habits';
import { Ideas } from './views/Ideas';
import { Notes } from './views/Notes';
import { Goals } from './views/Goals';
import { Journal } from './views/Journal';
import { Moods } from './views/Moods';
import { CustomPageView } from './views/CustomPageView';
import { Upcoming } from './views/Upcoming';
import { Trash } from './views/Trash';
import { Inbox } from './views/Inbox';
import { Today } from './views/Today';
import { Someday } from './views/Someday';
import {
  Cancel01Icon as X,
  CheckmarkCircle02Icon as CheckCircle,
  Copy01Icon as Copy,
  Link01Icon as Link,
  Menu01Icon as Menu,
  Search01Icon as SearchIcon,
  UserGroupIcon as Users,
} from 'hugeicons-react';
import { format } from 'date-fns';

const LAST_VIEW_STORAGE_KEY = 'dayline:last-view';

const readLastView = (): ViewType => {
  if (typeof window === 'undefined') return 'inbox';
  return window.localStorage.getItem(LAST_VIEW_STORAGE_KEY) || 'inbox';
};

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>(() => readLastView());
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
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_VIEW_STORAGE_KEY, view);
    }
  }, []);

  useEffect(() => {
    if (!user || loading) return;
    if (!currentView.startsWith('page-')) return;
    if (customPages.some(page => page.id === currentView)) return;
    changeView('inbox');
  }, [changeView, currentView, customPages, loading, user]);

  const openCommandPalette = (initialValue?: string | React.MouseEvent, mode: 'default' | 'create' = 'default') => {
    setCommandPaletteInitialValue(typeof initialValue === 'string' ? initialValue : '');
    setCommandPaletteMode(mode);
    setIsCommandPaletteOpen(true);
  };

  const renderView = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    if (currentView.startsWith('page-')) {
      const page = customPages.find(p => p.id === currentView);
      if (page) {
        return <CustomPageView page={page} onViewChange={changeView} />;
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

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <Tasks />;
      case 'projects': return <Projects />;
      case 'areas': return <Areas />;
      case 'habits': return <Habits />;
      case 'notes': return <Notes />;
      case 'goals': return <Goals key="goals-list" onViewChange={changeView} />;
      case 'ideas': return <Ideas />;
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
  };

  const currentPageLabel = currentView.startsWith('page-')
    ? customPages.find(p => p.id === currentView)?.title || 'Page'
    : currentView.startsWith('goal-details:')
      ? 'Goal'
      : currentView.startsWith('note-details:')
        ? 'Note'
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
          <p className="text-sm font-bold text-[var(--tokyo-text-muted)]">Opening your Dayline workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
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
          {renderView()}
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

      <CommandPalette 
        open={isCommandPaletteOpen} 
        setOpen={setIsCommandPaletteOpen} 
        onViewChange={changeView} 
        initialValue={commandPaletteInitialValue}
        mode={commandPaletteMode}
      />

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
