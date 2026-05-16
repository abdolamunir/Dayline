/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { Menu01Icon as Menu, Search01Icon as SearchIcon } from 'hugeicons-react';
import { format } from 'date-fns';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewType>('inbox');
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteInitialValue, setCommandPaletteInitialValue] = useState('');
  const [commandPaletteMode, setCommandPaletteMode] = useState<'default' | 'create'>('default');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { customPages, user, loading } = useAppStore();

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
        return <CustomPageView page={page} onViewChange={setCurrentView} />;
      }
    }

    if (currentView.startsWith('goal-details:')) {
      const id = currentView.split(':')[1];
      return <Goals key={`goal-details-${id}`} onViewChange={setCurrentView} selectedGoalId={id} />;
    }

    if (currentView.startsWith('note-details:')) {
      const id = currentView.split(':')[1];
      return <Notes key={`note-details-${id}`} onViewChange={setCurrentView} selectedNoteId={id} />;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <Tasks />;
      case 'projects': return <Projects />;
      case 'areas': return <Areas />;
      case 'habits': return <Habits />;
      case 'notes': return <Notes />;
      case 'goals': return <Goals key="goals-list" onViewChange={setCurrentView} />;
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
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }} 
        onOpenCommandPalette={openCommandPalette}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
      />
      
      <main className="relative flex flex-1 flex-col overflow-y-auto bg-[var(--tokyo-bg)] pb-8">
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
        onViewChange={setCurrentView} 
        initialValue={commandPaletteInitialValue}
        mode={commandPaletteMode}
      />

      <div className="fixed inset-x-0 bottom-0 z-[60] hidden h-8 items-center justify-between overflow-hidden border-t border-[var(--tokyo-border)] bg-[var(--tokyo-panel-2)]/95 px-2 text-[12px] font-bold leading-none text-[var(--tokyo-text-muted)] backdrop-blur md:flex">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘P</kbd> Commands</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘K</kbd> Jump To</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌃N</kbd> New page ...</span>
          <span className="shrink-0"><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">⌘⇧F</kbd> Search...</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden lg:inline">Arrow Keys Navigate</span>
          <span><kbd className="rounded bg-[rgba(214,204,219,0.12)] px-1 py-0.5 text-[var(--tokyo-text)]">↵</kbd> Focus</span>
          <span className="text-[var(--tokyo-yellow)]">●</span>
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
