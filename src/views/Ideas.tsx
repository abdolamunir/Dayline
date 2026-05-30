import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Idea } from '../types';
import {
  Calendar01Icon as CalendarIcon,
  CheckmarkCircle02Icon as CheckCircle,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  SmileIcon as Smile,
} from 'hugeicons-react';
import { TableView } from '../components/TableView';

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

export function Ideas({ onViewChange }: { onViewChange?: (view: string) => void }) {
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

  const filteredIdeas = ideas.filter(idea => {
    const status = idea.status || 'active';
    return status === activeTab;
  });

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
