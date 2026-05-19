import React, { useState, useRef } from 'react';
import { GripVertical, Minus } from 'lucide-react';
import { useAppStore } from '../store';
import { Project, Task } from '../types';
import { 
  Folder01Icon as FolderKanban, 
  Add01Icon as Plus, 
  MoreHorizontalIcon as MoreHorizontal, 
  Calendar01Icon as CalendarIcon, 
  DashboardSquare01Icon as LayoutGrid,
  ArrowLeft01Icon as ChevronLeft,
  UserGroupIcon as Users,
  ZapIcon as Zap,
  CheckmarkCircle02Icon as CheckCircle,
  UserIcon as User,
  SmileIcon as Smile,
  AtIcon as AtSign,
  Link01Icon as Link,
  HashtagIcon as Hash,
  AttachmentIcon as Attachment,
  Cancel01Icon as X,
  Message02Icon as MessageSquare,
  Activity01Icon as Activity,
  ListViewIcon as List,
  FilterIcon,
  Sorting01Icon as Sort,
  FlashIcon as Lightning,
  Search01Icon as Search,
  Settings01Icon as Settings,
  ArrowDown01Icon as ChevronDown,
  Layers01Icon as Layers,
  TextIcon as Text,
  Clock01Icon as Clock,
  CircleIcon as Circle,
  FavouriteIcon as Heart,
  Dumbbell01Icon as Dumbbell,
  Sun01Icon as Sun,
  Settings02Icon as SettingsGear,
  PencilEdit01Icon as Pencil,
  Delete02Icon as Trash2,
  Copy01Icon as Copy,
  Target01Icon as Target
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reorder } from 'motion/react';
import { BlockEditor } from '../components/BlockEditor';
import { cn } from '../utils/cn';
import { getPriorityBadgeClasses } from '../utils/badges';
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';
import { TableView } from '../components/TableView';

const iconMap: Record<string, any> = ALL_ICONS;

const toSentenceCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const GOALS_TEMPLATE_VERSION = 'goals-database-v1';

const DEFAULT_PROJECT_TABS = [
  { id: 'planning', label: 'Planning', icon: 'Clock' },
  { id: 'active', label: 'Active', icon: 'Target' },
  { id: 'completed', label: 'Completed', icon: 'CheckCircle2' },
  { id: 'paused', label: 'Paused', icon: 'Circle' },
];

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' },
  { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' },
  { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' },
  { id: 'areas', label: 'Areas', icon: 'Layers', width: '180px' },
  { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' },
  { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' },
];

export function Projects() {
  const { projects, updateProject, addProject, deleteProject, duplicateProject, reorderProjects, replaceProjects, goals, viewSettings, updateViewSettings, updateSidebarItem } = useAppStore();
  const savedProjectSettings = viewSettings.projects || {};
  const [activeTabId, setActiveTabId] = useState('all');
  const [localSelectedProjectId, setLocalSelectedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [projectContextMenu, setProjectContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const [iconPickerId, setIconPickerId] = useState<string | null>(null);
  const [iconPickerPos, setIconPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [customDropdown, setCustomDropdown] = useState<{ id: string, type: 'status' | 'priority', pos: { x: number, y: number }, currentValue: string } | null>(null);
  const [datePickerConfig, setDatePickerConfig] = useState<{ id: string, pos: { x: number, y: number }, currentDate?: Date, config?: DateConfig } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

  const shouldUseSavedTemplate = savedProjectSettings.templateVersion === GOALS_TEMPLATE_VERSION;
  const [tabs, setTabs] = useState(shouldUseSavedTemplate && savedProjectSettings.tabs ? savedProjectSettings.tabs : DEFAULT_PROJECT_TABS);

  const [columns, setColumns] = useState(shouldUseSavedTemplate && savedProjectSettings.columns ? savedProjectSettings.columns : DEFAULT_PROJECT_COLUMNS);

  const filteredProjects = projects.filter(p => {
    if (activeTabId === 'all') return true;
    return p.status === activeTabId;
  });

  const handleNewProject = () => {
    const id = `project-${Date.now()}`;
    addProject({
      id,
      name: 'Untitled Project',
      description: '',
      status: 'planning',
      taskIds: [],
      priority: 'medium',
      icon: 'FolderKanban'
    });
    setEditingProjectId(id);
    setEditingProjectName('Untitled Project');
  };

  const handleRenameProject = () => {
    if (editingProjectId && editingProjectName.trim()) {
      const project = projects.find(p => p.id === editingProjectId);
      if (project) {
        updateProject(editingProjectId, { name: editingProjectName.trim() });
      }
    }
    setEditingProjectId(null);
  };

  const handleProjectContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setProjectContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const selectedProject = projects.find(p => p.id === localSelectedProjectId);

  if (selectedProject) {
    return (
      <ProjectDetailsPage 
        project={selectedProject} 
        onBack={() => setLocalSelectedProjectId(null)}
        setCustomDropdown={setCustomDropdown}
        setDatePickerConfig={setDatePickerConfig}
      />
    );
  }

  const projectDatabasePage = {
    id: 'projects',
    title: savedProjectSettings.title || 'Projects',
    description: savedProjectSettings.description || 'Containers for your tasks.',
    icon: savedProjectSettings.icon || 'FolderKanban',
    kind: 'database' as const,
    activeTab: shouldUseSavedTemplate ? savedProjectSettings.activeTab : 'planning',
    tabs,
    columns,
    sortConfigs: shouldUseSavedTemplate ? (savedProjectSettings.sortConfigs || []) : [],
    items: projects.map(project => ({
      id: project.id,
      title: project.name,
      icon: project.icon || 'FolderKanban',
      status: project.status,
      priority: project.priority || 'medium',
      date: project.deadline || project.targetDate,
      progress: 0,
      properties: {
        areas: goals.find(goal => goal.id === project.goalId)?.title || 'No Area',
      },
    })),
    properties: [],
    content: '',
  };

  return (
    <TableView
      page={projectDatabasePage}
      onItemClick={(itemId) => setLocalSelectedProjectId(itemId)}
      onUpdatePage={(updatedPage) => {
        setTabs(updatedPage.tabs);
        setColumns(updatedPage.columns);
        updateViewSettings('projects', {
          ...savedProjectSettings,
          title: updatedPage.title,
          description: updatedPage.description,
          icon: updatedPage.icon,
          tabs: updatedPage.tabs,
          columns: updatedPage.columns,
          activeTab: updatedPage.activeTab,
          sortConfigs: updatedPage.sortConfigs || [],
          templateVersion: GOALS_TEMPLATE_VERSION,
        });
        updateSidebarItem('projects', updatedPage.title, updatedPage.icon);
        replaceProjects(updatedPage.items.map(item => {
          const existingProject = projects.find(project => project.id === item.id);
          return existingProject
            ? { ...existingProject, name: item.title, icon: item.icon, status: item.status as Project['status'], priority: item.priority, deadline: item.date }
            : {
              id: item.id,
              name: item.title,
              description: '',
              status: item.status as Project['status'],
              taskIds: [],
              priority: item.priority,
              icon: item.icon || 'FolderKanban',
              deadline: item.date,
            };
        }));
      }}
    />
  );

  return (
    <div className="max-w-6xl mx-auto p-4 pt-7 md:px-8 md:pb-8 md:pt-10 flex flex-col gap-6 min-h-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-faint)]">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2.5">
              <h1 className="min-w-0 text-2xl md:text-[28px] font-semibold text-[var(--tokyo-text-strong)] tracking-tight leading-tight">Projects</h1>
              <span className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--tokyo-border)] bg-[var(--tokyo-hover)] px-2 text-[13px] font-semibold text-[var(--tokyo-text-faint)]">
                {projects.length}
              </span>
            </div>
            <p className="text-[var(--tokyo-text-muted)] mt-1 text-sm md:text-[15px] leading-normal">Containers for your tasks.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[var(--tokyo-text-faint)]">
          <button className="p-2 hover:text-white transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:text-white transition-colors">
            <FilterIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={handleNewProject}
            className="ml-2 bg-[var(--tokyo-yellow-dim)] text-white px-3 py-1.5 rounded-lg font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-[var(--tokyo-yellow)] hover:text-[var(--tokyo-bg-deep)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 [stroke-width:2.4]" />
            New Project
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--tokyo-border)] pb-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 pl-[5px] pr-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeTabId === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded"><TabIcon className="w-4 h-4" /></span>
                {tab.label}
              </button>
            );
          })}
        </div>

      <div className="flex-1 overflow-visible">
      <div className={cn("-ml-6 h-full w-[calc(100%+1.5rem)] pl-6", draggingId ? "overflow-visible" : "overflow-auto no-scrollbar")}>
        <table className="text-left border-separate border-spacing-0 table-fixed min-w-[800px] w-full">
          <thead>
            <tr className="text-[var(--tokyo-text-faint)] text-[12px] font-medium">
              {columns.map((col, index) => (
                <th 
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    "relative px-4 py-1 h-12 text-left border-b border-[var(--tokyo-border)] group/header whitespace-nowrap overflow-visible",
                    index === 0 && "pl-[5px]"
                  )}
                >
                  <div className="flex items-center gap-0.5 w-full min-w-0 overflow-hidden pr-2">
                    <span className="w-6 h-6 rounded-md text-[var(--tokyo-text-muted)]/80 flex items-center justify-center shrink-0">
                      <col.icon className="w-4 h-4" />
                    </span>
                    <span className="capitalize text-[var(--tokyo-text-muted)]/80 px-1 h-7 rounded-md text-sm font-medium inline-flex min-w-0 max-w-full items-center whitespace-nowrap overflow-hidden text-ellipsis">
                      {col.label.toLowerCase()}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <Reorder.Group 
            as="tbody" 
            values={filteredProjects} 
            onReorder={(newProjects) => {
              reorderProjects(newProjects);
            }}
            className="relative"
          >
            {filteredProjects.map(project => {
              const goal = goals.find(g => g.id === project.goalId);
              return (
                <Reorder.Item 
                  key={project.id} 
                  value={project}
                  as="tr"
                  layout="position"
                  dragElastic={0.2}
                  initial={false}
                  animate={{
                    scale: 1,
                    zIndex: 1,
                    boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
                  }}
                  whileDrag={{
                    scale: 1.01,
                    zIndex: 100,
                    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
                  }}
                  transition={{ 
                    layout: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
                    scale: { duration: 0.2 },
                    boxShadow: { duration: 0.2 },
                    zIndex: { delay: 0.2 }
                  }}
                  onDragStart={() => {
                    setDraggingId(project.id);
                    isDraggingRef.current = true;
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setTimeout(() => {
                      isDraggingRef.current = false;
                    }, 100);
                  }}
                  onContextMenu={(e) => handleProjectContextMenu(e, project.id)}
                  className={cn("group transition-colors select-none cursor-grab active:cursor-grabbing hover:bg-white/[0.02] whitespace-nowrap", draggingId === project.id ? "cursor-grabbing bg-white/[0.04]" : "")}
                >
                  <td className="h-12 pl-[5px] pr-4 border-b border-[var(--tokyo-border)]">
                    <div className="flex items-center gap-1">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setIconPickerId(project.id);
                          setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--tokyo-text-faint)] shrink-0 cursor-pointer transition-colors"
                      >
                        {React.createElement(iconMap[project.icon || 'FolderKanban'] || FolderKanban, { className: "w-4 h-4" })}
                      </div>
                      {editingProjectId === project.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          onBlur={handleRenameProject}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameProject();
                            if (e.key === 'Escape') setEditingProjectId(null);
                          }}
                          className="bg-transparent border-none outline-none text-sm text-[var(--tokyo-text-strong)] w-full"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalSelectedProjectId(project.id);
                          }}
                          className="text-[var(--tokyo-text-strong)]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[var(--tokyo-text-strong)] transition-colors"
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)]">
                    <span 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCustomDropdown({
                          id: project.id,
                          type: 'status',
                          pos: { x: rect.left, y: rect.bottom + 8 },
                          currentValue: project.status
                        });
                      }}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                        project.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                        project.status === 'active' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                        project.status === 'planning' ? "bg-stone-500/20 text-stone-400" :
                        "bg-[var(--tokyo-yellow-soft)] text-[var(--tokyo-yellow)]"
                      )}
                    >
                      {toSentenceCase(project.status)}
                    </span>
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)] text-[13px] text-[var(--tokyo-text-faint)]">
                    {project.deadline || 'No deadline'}
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)]">
                    <span 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setCustomDropdown({
                          id: project.id,
                          type: 'priority',
                          pos: { x: rect.left, y: rect.bottom + 8 },
                          currentValue: project.priority || 'medium'
                        });
                      }}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                        getPriorityBadgeClasses(project.priority || 'medium')
                      )}
                    >
                      {toSentenceCase(project.priority || 'medium')}
                    </span>
                  </td>
                  <td className="px-4 h-12 border-b border-[var(--tokyo-border)] text-[13px] text-[var(--tokyo-text-faint)]">
                    {goal?.title || 'No goal'}
                  </td>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </table>
      </div>
      </div>
      </div>

      {/* Popovers & Context Menus */}
      <AnimatePresence>
        {iconPickerId && iconPickerPos && (
          <div 
            className="fixed z-[160]"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              top: Math.min(iconPickerPos.y, window.innerHeight - 350), 
              left: Math.min(iconPickerPos.x, window.innerWidth - 280) 
            }}
          >
            <IconPicker 
              currentIcon={projects.find(p => p.id === iconPickerId)?.icon || 'FolderKanban'}
              onSelect={(icon) => {
                updateProject(iconPickerId, { icon });
                setIconPickerId(null);
                setIconPickerPos(null);
              }}
              onClose={() => {
                setIconPickerId(null);
                setIconPickerPos(null);
              }}
            />
          </div>
        )}

        {customDropdown && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setCustomDropdown(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[160] w-40 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden"
              style={{ top: customDropdown.pos.y, left: customDropdown.pos.x }}
            >
              {(customDropdown.type === 'status' ? ['planning', 'active', 'completed', 'paused'] : ['low', 'medium', 'high']).map(val => (
                <button
                  key={val}
                  onClick={() => {
                    updateProject(customDropdown.id, { [customDropdown.type]: val });
                    setCustomDropdown(null);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-sm text-left transition-colors",
                    customDropdown.currentValue === val ? "bg-[var(--tokyo-yellow-dim)] text-white" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-white"
                  )}
                >
                  {toSentenceCase(val)}
                </button>
              ))}
            </motion.div>
          </>
        )}

        {projectContextMenu && (
          <>
            <div className="fixed inset-0 z-[130]" onClick={() => setProjectContextMenu(null)} />
            <div 
              className="fixed z-[140] w-48 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-strong)] shadow-2xl rounded-xl py-1.5 overflow-hidden"
              style={{ top: projectContextMenu.y, left: projectContextMenu.x }}
            >
              <button 
                onClick={() => {
                  const project = projects.find(p => p.id === projectContextMenu.id);
                  if (project) {
                    setEditingProjectId(project.id);
                    setEditingProjectName(project.name);
                  }
                  setProjectContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] transition-colors"
              >
                <Pencil className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                Rename
              </button>
              <button 
                onClick={() => {
                  duplicateProject(projectContextMenu.id);
                  setProjectContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-text)] hover:bg-[var(--tokyo-hover)] transition-colors"
              >
                <Copy className="w-4 h-4 text-[var(--tokyo-text-faint)]" />
                Duplicate
              </button>
              <div className="h-px bg-[var(--tokyo-border)] my-1" />
              <button 
                onClick={() => {
                  deleteProject(projectContextMenu.id);
                  setProjectContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--tokyo-pink)] hover:bg-[rgba(255,77,125,0.12)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectDetailsPage({ project, onBack, setCustomDropdown, setDatePickerConfig }: { 
  project: Project, 
  onBack: () => void,
  setCustomDropdown: (val: any) => void,
  setDatePickerConfig: (val: any) => void
}) {
  const { updateProject, deleteProject, tasks, addTask, updateTask } = useAppStore();
  const [activeTab, setActiveTab] = useState('Todo list');
  const [commentText, setCommentText] = useState('');
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [propertyPickerPos, setPropertyPickerPos] = useState<{ x: number, y: number } | null>(null);
  const [comments, setComments] = useState([
    { id: '1', name: 'Raheem Sterling', time: '25m ago', text: '@stephenrobert I will do it ASAP.', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: '2', name: 'Stephen Robert', time: '50m ago', text: 'Project looks good, let\'s focus on the UI components.', avatar: 'https://i.pravatar.cc/150?u=4', reactions: [{ emoji: '👍', count: 1 }] }
  ]);

  const handleUpdate = (updates: Partial<Project>) => {
    updateProject(project.id, updates);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    onBack();
  };

  const handleAddProperty = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPropertyPickerPos({ x: rect.left, y: rect.bottom + 8 });
    setIsPropertyPickerOpen(true);
  };

  const confirmAddProperty = (type: 'text' | 'number' | 'select' | 'date') => {
    const newProp = {
      id: `p${Date.now()}`,
      name: `New ${toSentenceCase(type)}`,
      type,
      value: ''
    };
    handleUpdate({
      customProperties: [...(project.customProperties || []), newProp]
    });
    setIsPropertyPickerOpen(false);
  };

  const handleUpdateProperty = (propId: string, value: any) => {
    handleUpdate({
      customProperties: project.customProperties?.map(p => p.id === propId ? { ...p, value } : p)
    });
  };

  const handleDeleteProperty = (propId: string) => {
    handleUpdate({
      customProperties: project.customProperties?.filter(p => p.id !== propId)
    });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      setComments([
        {
          id: `c${Date.now()}`,
          name: 'Stephen Robert',
          time: 'Just now',
          text: commentText,
          avatar: 'https://i.pravatar.cc/150?u=4'
        },
        ...comments
      ]);
      setCommentText('');
    }
  };

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  const handleAddTask = () => {
    const id = `t${Date.now()}`;
    addTask({
      id,
      title: '',
      status: 'todo',
      priority: 'medium',
      projectId: project.id,
      tags: []
    });
  };

  return (
    <div className="min-h-full bg-[var(--tokyo-bg)] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[var(--tokyo-text-faint)] text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">Projects</button>
            <span>/</span>
            <span className="text-[var(--tokyo-text-muted)] capitalize whitespace-nowrap">{project.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={onBack}
              className="text-[var(--tokyo-text-faint)] hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <input 
          type="text"
          value={project.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="w-full bg-transparent text-3xl font-bold text-[var(--tokyo-text-strong)] mb-8 tracking-tight outline-none placeholder:text-white/10"
          placeholder="Untitled Project"
        />
        
        {/* Properties */}
        <div className="space-y-2 mb-12 max-w-2xl">
          {/* Assigned */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Users className="w-4 h-4" />
              <span>Assigned</span>
            </div>
            <div className="flex -space-x-2">
              {[
                'https://i.pravatar.cc/150?u=5',
                'https://i.pravatar.cc/150?u=4',
                'https://i.pravatar.cc/150?u=6'
              ].map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-[var(--tokyo-bg)] ring-white/5" alt="avatar" />
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <CalendarIcon className="w-4 h-4" />
              <span>Deadline</span>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDatePickerConfig({
                  id: project.id,
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentDate: project.deadline ? new Date(project.deadline) : undefined
                });
              }}
              className="text-[var(--tokyo-text-strong)] text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
            >
              {project.deadline || 'Set deadline...'}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <Zap className="w-4 h-4" />
              <span>Priority</span>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCustomDropdown({
                  id: project.id,
                  type: 'priority',
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentValue: project.priority || 'medium'
                });
              }}
              className={cn(
                "px-2 py-0.5 rounded-md text-[13px] font-medium cursor-pointer hover:opacity-80 transition-opacity",
                getPriorityBadgeClasses(project.priority || 'medium')
              )}
            >
              {toSentenceCase(project.priority || 'medium')}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCustomDropdown({
                  id: project.id,
                  type: 'status',
                  pos: { x: rect.left, y: rect.bottom + 8 },
                  currentValue: project.status
                });
              }}
              className={cn(
                "flex items-center gap-2 px-2 py-0.5 rounded-md text-[13px] font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity",
                project.status === 'completed' ? "bg-[rgba(166,227,125,0.14)] text-[var(--tokyo-green)]" :
                project.status === 'active' ? "bg-[rgba(198,140,255,0.14)] text-[var(--tokyo-purple)]" :
                "bg-stone-500/20 text-stone-400"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                project.status === 'completed' ? "bg-[var(--tokyo-green)]" :
                project.status === 'active' ? "bg-[var(--tokyo-purple)]" :
                "bg-stone-400"
              )} />
              <span>{toSentenceCase(project.status)}</span>
            </div>
          </div>

          {/* Custom Properties */}
          {project.customProperties?.map(prop => {
            const PropIcon = {
              text: Text,
              number: Hash,
              select: Layers,
              date: CalendarIcon
            }[prop.type] || Text;

            return (
              <div key={prop.id} className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
                <div className="flex items-center gap-3 w-40 shrink-0 text-[var(--tokyo-text-faint)] text-[13px] font-medium">
                  <PropIcon className="w-4 h-4" />
                  <input 
                    type="text"
                    value={prop.name}
                    onChange={(e) => {
                      handleUpdate({
                        customProperties: project.customProperties?.map(p => p.id === prop.id ? { ...p, name: e.target.value } : p)
                      });
                    }}
                    className="bg-transparent border-none p-0 focus:ring-0 w-full text-[13px] font-medium placeholder:text-white/10"
                  />
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <input 
                    type={prop.type === 'number' ? 'number' : 'text'}
                    value={prop.value}
                    onChange={(e) => handleUpdateProperty(prop.id, e.target.value)}
                    placeholder="Empty"
                    className="bg-transparent border-none p-0 text-[var(--tokyo-text-strong)] text-[13px] font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/5"
                  />
                  <button 
                    onClick={() => handleDeleteProperty(prop.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <button 
            onClick={handleAddProperty}
            className="text-[var(--tokyo-yellow)] text-sm font-medium flex items-center gap-2 hover:text-[var(--tokyo-yellow)] transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add property
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-[var(--tokyo-border)] pb-1">
          {[
            { id: 'Todo list', icon: List },
            { id: 'Comments', icon: MessageSquare },
            { id: 'Activity', icon: Activity }
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 pl-[11px] pr-[13px] py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer",
                activeTab === tab.id ? "bg-[var(--tokyo-yellow-dim)] text-[var(--tokyo-text-strong)]" : "text-[var(--tokyo-text-muted)] hover:bg-[var(--tokyo-hover)] hover:text-[var(--tokyo-text-strong)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 pt-6 space-y-8 max-w-6xl mx-auto w-full">
        {activeTab === 'Todo list' && (
          <div className="space-y-4">
            {projectTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-[var(--tokyo-border)] rounded-xl group hover:bg-white/[0.04] transition-all">
                <button 
                  onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                    task.status === 'done' ? "bg-[var(--tokyo-yellow)] border-[var(--tokyo-yellow)]" : "border-[var(--tokyo-border-strong)] group-hover:border-white/20"
                  )}
                >
                  {task.status === 'done' && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
                <input 
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTask({ ...task, title: e.target.value })}
                  placeholder="Task description..."
                  className={cn(
                    "bg-transparent border-none outline-none flex-1 text-base transition-all placeholder:text-white/10",
                    task.status === 'done' ? "text-[var(--tokyo-text-faint)] line-through" : "text-[var(--tokyo-text)]"
                  )}
                />
              </div>
            ))}
            <button 
              onClick={handleAddTask}
              className="flex items-center gap-3 p-4 text-[var(--tokyo-yellow)] hover:text-[var(--tokyo-yellow)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add new task</span>
            </button>
          </div>
        )}

        {activeTab === 'Comments' && (
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-[var(--tokyo-border)] rounded-2xl p-6">
              <textarea 
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..." 
                className="w-full bg-transparent border-none focus:ring-0 text-[var(--tokyo-text-strong)] placeholder:text-white/20 text-base resize-none mb-4"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleAddComment}
                  className="bg-[var(--tokyo-yellow-dim)] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[var(--tokyo-yellow)] transition-colors"
                >
                  Comment
                </button>
              </div>
            </div>

            <div className="space-y-8">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <img src={comment.avatar} className="w-10 h-10 rounded-full" alt="avatar" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[var(--tokyo-text-strong)] font-bold">{comment.name}</span>
                      <span className="text-[var(--tokyo-text-faint)] text-xs">{comment.time}</span>
                    </div>
                    <p className="text-[var(--tokyo-text)]">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-sm text-[var(--tokyo-text-faint)]">
              <Activity className="w-4 h-4" />
              <span>No recent activity</span>
            </div>
          </div>
        )}
      </div>

      {/* Property Picker Popover */}
      <AnimatePresence>
        {isPropertyPickerOpen && propertyPickerPos && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setIsPropertyPickerOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[120] bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-strong)] rounded-xl shadow-2xl p-2 w-64"
              style={{ top: propertyPickerPos.y, left: propertyPickerPos.x }}
            >
              <div className="px-3 py-2 text-xs font-bold text-[var(--tokyo-text-faint)] tracking-wider">Basic properties</div>
              <div className="space-y-0.5">
                {[
                  { id: 'text', label: 'Text', icon: Text, desc: 'Plain text' },
                  { id: 'number', label: 'Number', icon: Hash, desc: 'Numerical values' },
                  { id: 'select', label: 'Select', icon: Layers, desc: 'Choose from options' },
                  { id: 'date', label: 'Deadline', icon: CalendarIcon, desc: 'Calendar date' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => confirmAddProperty(type.id as any)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--tokyo-hover)] transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--tokyo-hover)] flex items-center justify-center text-[var(--tokyo-text-muted)] group-hover:text-white">
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--tokyo-text-strong)] group-hover:text-white">{type.label}</div>
                      <div className="text-xs text-[var(--tokyo-text-faint)]">{type.desc}</div>
                    </div>
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
