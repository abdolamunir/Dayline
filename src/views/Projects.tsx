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
import { IconPicker, ALL_ICONS } from '../components/IconPicker';
import { DatePicker, DateConfig } from '../components/DatePicker';
import { format } from 'date-fns';

const iconMap: Record<string, any> = ALL_ICONS;

const toSentenceCase = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function Projects() {
  const { projects, updateProject, addProject, deleteProject, duplicateProject, reorderProjects, goals } = useAppStore();
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

  const tabs = [
    { id: 'all', label: 'All Projects' },
    { id: 'planning', label: 'Planning' },
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'paused', label: 'Paused' }
  ];

  const columns = [
    { id: 'name', label: 'Project Name', width: '40%' },
    { id: 'status', label: 'Status', width: '15%' },
    { id: 'deadline', label: 'Deadline', width: '15%' },
    { id: 'priority', label: 'Priority', width: '15%' },
    { id: 'goal', label: 'Goal', width: '15%' }
  ];

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

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#E8E6E1] tracking-tight leading-tight">Projects</h1>
            <p className="text-white/50 -mt-0.5 text-xs md:text-sm">Containers for your tasks.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <FilterIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNewProject}
            className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-px overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              "pl-[7px] pr-[9px] py-1.5 text-sm font-medium transition-all relative whitespace-nowrap",
              activeTabId === tab.id ? "text-[#E8E6E1]" : "text-white/40 hover:text-white/60"
            )}
          >
            {tab.label}
            {activeTabId === tab.id && (
              <motion.div 
                layoutId="activeTabProject"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto no-scrollbar -mx-4 md:mx-0">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    "px-4 py-2 text-left text-[11px] font-bold text-white/20 uppercase tracking-wider border-b border-white/5",
                    index === 0 && "pl-[5px]"
                  )}
                >
                  <div className="flex items-center gap-2 group cursor-pointer">
                    {col.label}
                    <Sort className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  className={cn(
                    "group transition-colors select-none cursor-default active:cursor-grabbing hover:bg-white/[0.02] whitespace-nowrap",
                    draggingId === project.id ? "cursor-grabbing bg-white/[0.04]" : ""
                  )}
                >
                  <td className="h-11 pl-[5px] pr-4 border-b border-white/5">
                    <div className="flex items-center gap-1">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setIconPickerId(project.id);
                          setIconPickerPos({ x: rect.left, y: rect.bottom + 8 });
                        }}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 shrink-0 cursor-pointer transition-colors"
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
                          className="bg-transparent border-none outline-none text-sm text-[#E8E6E1] w-full"
                        />
                      ) : (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalSelectedProjectId(project.id);
                          }}
                          className="text-[#E8E6E1]/60 font-medium text-[14px] tracking-tight cursor-pointer hover:text-[#E8E6E1] transition-colors"
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 h-11 border-b border-white/5">
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
                        project.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                        project.status === 'active' ? "bg-blue-500/20 text-blue-400" :
                        project.status === 'planning' ? "bg-stone-500/20 text-stone-400" :
                        "bg-orange-500/20 text-orange-400"
                      )}
                    >
                      {toSentenceCase(project.status)}
                    </span>
                  </td>
                  <td className="px-4 h-11 border-b border-white/5 text-sm text-white/40">
                    {project.deadline || 'No deadline'}
                  </td>
                  <td className="px-4 h-11 border-b border-white/5">
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
                        project.priority === 'high' ? "bg-red-500/20 text-red-400" :
                        project.priority === 'medium' ? "bg-orange-500/20 text-orange-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      )}
                    >
                      {toSentenceCase(project.priority || 'medium')}
                    </span>
                  </td>
                  <td className="px-4 h-11 border-b border-white/5 text-sm text-white/40">
                    {goal?.title || 'No goal'}
                  </td>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </table>
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
              className="fixed z-[160] w-40 bg-[#2A2A2A] border border-white/10 shadow-2xl rounded-xl py-1.5 overflow-hidden"
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
                    customDropdown.currentValue === val ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
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
              className="fixed z-[140] w-48 bg-[#2A2A2A] border border-white/10 shadow-2xl rounded-xl py-1.5 overflow-hidden"
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
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                <Pencil className="w-4 h-4 text-white/40" />
                Rename
              </button>
              <button 
                onClick={() => {
                  duplicateProject(projectContextMenu.id);
                  setProjectContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                <Copy className="w-4 h-4 text-white/40" />
                Duplicate
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button 
                onClick={() => {
                  deleteProject(projectContextMenu.id);
                  setProjectContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
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
    <div className="min-h-full bg-[#191919] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white/30 text-sm">
            <button onClick={onBack} className="hover:text-white transition-colors">Projects</button>
            <span>/</span>
            <span className="text-white/50 capitalize whitespace-nowrap">{project.status}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white/30 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button 
              onClick={onBack}
              className="text-white/30 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <input 
          type="text"
          value={project.name}
          onChange={(e) => handleUpdate({ name: e.target.value })}
          className="w-full bg-transparent text-3xl font-bold text-[#E8E6E1] mb-8 tracking-tight outline-none placeholder:text-white/10"
          placeholder="Untitled Project"
        />
        
        {/* Properties */}
        <div className="space-y-2 mb-12 max-w-2xl">
          {/* Assigned */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
              <Users className="w-4 h-4" />
              <span>Assigned</span>
            </div>
            <div className="flex -space-x-2">
              {[
                'https://i.pravatar.cc/150?u=5',
                'https://i.pravatar.cc/150?u=4',
                'https://i.pravatar.cc/150?u=6'
              ].map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-[#191919] ring-1 ring-white/5" alt="avatar" />
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
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
              className="text-white/90 text-[13px] font-medium cursor-pointer hover:text-white transition-colors"
            >
              {project.deadline || 'Set deadline...'}
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
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
                project.priority === 'high' ? "bg-red-500/20 text-red-400" : 
                project.priority === 'medium' ? "bg-orange-500/20 text-orange-400" : 
                "bg-green-500/20 text-green-400"
              )}
            >
              {toSentenceCase(project.priority || 'medium')}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center h-8 hover:bg-white/[0.03] transition-colors rounded-xl group">
            <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
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
                project.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" :
                project.status === 'active' ? "bg-blue-500/20 text-blue-400" :
                "bg-stone-500/20 text-stone-400"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                project.status === 'completed' ? "bg-emerald-400" :
                project.status === 'active' ? "bg-blue-400" :
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
                <div className="flex items-center gap-3 w-40 shrink-0 text-white/30 text-[13px] font-medium">
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
                    className="bg-transparent border-none p-0 text-white/90 text-[13px] font-medium focus:ring-0 flex-1 [color-scheme:dark] placeholder:text-white/5"
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
            className="text-orange-500/80 text-sm font-medium flex items-center gap-2 hover:text-orange-400 transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add property
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/5 pb-1">
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
                activeTab === tab.id ? "bg-white/10 text-[#E8E6E1]" : "text-white/50 hover:bg-white/10 hover:text-[#E8E6E1]"
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
              <div key={task.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:bg-white/[0.04] transition-all">
                <button 
                  onClick={() => updateTask({ ...task, status: task.status === 'done' ? 'todo' : 'done' })}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                    task.status === 'done' ? "bg-orange-500 border-orange-500" : "border-white/10 group-hover:border-white/20"
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
                    task.status === 'done' ? "text-white/30 line-through" : "text-white/80"
                  )}
                />
              </div>
            ))}
            <button 
              onClick={handleAddTask}
              className="flex items-center gap-3 p-4 text-orange-500 hover:text-orange-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add new task</span>
            </button>
          </div>
        )}

        {activeTab === 'Comments' && (
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
              <textarea 
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..." 
                className="w-full bg-transparent border-none focus:ring-0 text-[#E8E6E1] placeholder:text-white/20 text-base resize-none mb-4"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleAddComment}
                  className="bg-orange-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-500 transition-colors"
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
                      <span className="text-[#E8E6E1] font-bold">{comment.name}</span>
                      <span className="text-white/30 text-xs">{comment.time}</span>
                    </div>
                    <p className="text-white/80">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Activity' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-sm text-white/40">
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
              className="fixed z-[120] bg-[#1C1C1C] border border-white/10 rounded-xl shadow-2xl p-2 w-64"
              style={{ top: propertyPickerPos.y, left: propertyPickerPos.x }}
            >
              <div className="px-3 py-2 text-xs font-bold text-white/30 tracking-wider">Basic properties</div>
              <div className="space-y-0.5">
                {[
                  { id: 'text', label: 'Text', icon: Text, desc: 'Plain text' },
                  { id: 'number', label: 'Number', icon: Hash, desc: 'Numerical values' },
                  { id: 'select', label: 'Select', icon: Layers, desc: 'Choose from options' },
                  { id: 'date', label: 'Date', icon: CalendarIcon, desc: 'Calendar date' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => confirmAddProperty(type.id as any)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 group-hover:text-white">
                      <type.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90 group-hover:text-white">{type.label}</div>
                      <div className="text-xs text-white/30">{type.desc}</div>
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
