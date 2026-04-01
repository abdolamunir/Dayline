/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { ContextPanel } from './components/ContextPanel';
import { CommandPalette } from './components/CommandPalette';
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
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandPaletteInitialValue, setCommandPaletteInitialValue] = useState('');
  const [commandPaletteMode, setCommandPaletteMode] = useState<'default' | 'create'>('default');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { customPages } = useAppStore();

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
          <div className="flex items-center justify-center h-full text-white/40">
            <p>View "{currentView}" is under construction.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#191919] overflow-hidden font-sans text-white/90 selection:bg-white/20">
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
      
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#191919] sticky top-0 z-30">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white/70 hover:text-white transition-colors cursor-pointer">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-medium capitalize text-white/90 truncate max-w-[150px] text-center">
            {currentView.startsWith('page-') ? customPages.find(p => p.id === currentView)?.title || 'Page' : currentView.replace('-', ' ')}
          </span>
          <button onClick={() => openCommandPalette()} className="text-white/70 hover:text-white transition-colors cursor-pointer">
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
        <div className="text-white/50 text-sm">
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
