import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, Project, Goal, Area, Habit, Event, JournalEntry, Mood, Idea, Note, CustomPage, SidebarItem, TrashItem } from './types';
import { mockTasks, mockProjects, mockGoals, mockAreas, mockHabits, mockEvents, mockJournal, mockMoods, mockIdeas, mockNotes } from './data/mockData';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const initialSidebarItems: SidebarItem[] = [
  { id: 'notes', label: 'Notes', icon: 'Pencil', type: 'system' },
  { id: 'projects', label: 'Projects', icon: 'Folder', type: 'system' },
  { id: 'goals', label: 'Goals', icon: 'Target', type: 'system' },
  { id: 'areas', label: 'Areas', icon: 'Layers', type: 'system' },
  { id: 'habits', label: 'Habits', icon: 'Dumbbell', type: 'system' },
  { id: 'ideas', label: 'Ideas', icon: 'Smile', type: 'system' },
  { id: 'journal', label: 'Journal', icon: 'Book', type: 'system' },
  { id: 'moods', label: 'Moods', icon: 'Activity', type: 'system' },
];

interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  areas: Area[];
  habits: Habit[];
  events: Event[];
  journal: JournalEntry[];
  moods: Mood[];
  ideas: Idea[];
  notes: Note[];
  customPages: CustomPage[];
  sidebarItems: SidebarItem[];
  trash: TrashItem[];
  user: any | null;
  loading: boolean;
  
  // Actions
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  updateHabit: (habit: Habit) => void;
  addHabit: (habit: Habit) => void;
  addMood: (mood: Mood) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  duplicateGoal: (goalId: string) => void;
  reorderGoals: (goals: Goal[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  duplicateProject: (projectId: string) => void;
  reorderProjects: (projects: Project[]) => void;
  addArea: (area: Area) => void;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (areaId: string) => void;
  duplicateArea: (areaId: string) => void;
  reorderAreas: (areas: Area[]) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  addIdea: (idea: Idea) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  reorderNotes: (notes: Note[]) => void;
  addCustomPage: (page: CustomPage) => void;
  updateCustomPage: (page: CustomPage) => void;
  moveToTrash: (type: TrashItem['type'], id: string) => void;
  restoreFromTrash: (id: string) => void;
  emptyTrash: () => void;
  reorderSidebarItems: (items: SidebarItem[]) => void;
  deleteSidebarItem: (id: string) => void;
  updateSidebarItem: (id: string, label: string, icon?: string) => void;
  duplicateSidebarItem: (id: string) => void;
  addFolder: (folder: SidebarItem) => void;
  toggleFolderExpansion: (id: string) => void;
  moveSidebarItem: (id: string, parentId: string | undefined) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEY = 'dayline:workspace:v1';

type PersistedWorkspace = Pick<AppState,
  'tasks' | 'projects' | 'goals' | 'areas' | 'habits' | 'events' | 'journal' |
  'moods' | 'ideas' | 'notes' | 'customPages' | 'sidebarItems' | 'trash'
>;

const defaultWorkspace: PersistedWorkspace = {
  tasks: mockTasks,
  projects: mockProjects,
  goals: mockGoals,
  areas: mockAreas,
  habits: mockHabits,
  events: mockEvents,
  journal: mockJournal,
  moods: mockMoods,
  ideas: mockIdeas,
  notes: mockNotes,
  customPages: [],
  sidebarItems: initialSidebarItems,
  trash: [],
};

function readWorkspace(): PersistedWorkspace {
  if (typeof window === 'undefined') return defaultWorkspace;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkspace;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed?.workspace) return defaultWorkspace;
    return { ...defaultWorkspace, ...parsed.workspace };
  } catch (error) {
    console.warn('Unable to read Dayline workspace from local storage.', error);
    return defaultWorkspace;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [workspace] = useState<PersistedWorkspace>(() => readWorkspace());
  const [tasks, setTasks] = useState<Task[]>(workspace.tasks);
  const [projects, setProjects] = useState<Project[]>(workspace.projects);
  const [goals, setGoals] = useState<Goal[]>(workspace.goals);
  const [areas, setAreas] = useState<Area[]>(workspace.areas);
  const [habits, setHabits] = useState<Habit[]>(workspace.habits);
  const [events, setEvents] = useState<Event[]>(workspace.events);
  const [journal, setJournal] = useState<JournalEntry[]>(workspace.journal);
  const [moods, setMoods] = useState<Mood[]>(workspace.moods);
  const [ideas, setIdeas] = useState<Idea[]>(workspace.ideas);
  const [notes, setNotes] = useState<Note[]>(workspace.notes);
  const [customPages, setCustomPages] = useState<CustomPage[]>(workspace.customPages);
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>(workspace.sidebarItems);
  const [trash, setTrash] = useState<TrashItem[]>(workspace.trash);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextWorkspace: PersistedWorkspace = {
      tasks, projects, goals, areas, habits, events, journal, moods, ideas,
      notes, customPages, sidebarItems, trash
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        workspace: nextWorkspace,
      }));
    } catch (error) {
      console.warn('Unable to save Dayline workspace to local storage.', error);
    }
  }, [tasks, projects, goals, areas, habits, events, journal, moods, ideas, notes, customPages, sidebarItems, trash]);

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const addHabit = (habit: Habit) => {
    setHabits([...habits, habit]);
  };

  const addMood = (mood: Mood) => {
    setMoods([...moods, mood]);
  };

  const addGoal = (goal: Goal) => {
    setGoals([...goals, goal]);
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  const duplicateGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newGoal = { ...goal, id: `goal-${Date.now()}`, title: `${goal.title} (Copy)` };
      setGoals([...goals, newGoal]);
    }
  };

  const reorderGoals = (reorderedSubset: Goal[]) => {
    const subsetIds = new Set(reorderedSubset.map(g => g.id));
    const newGoals = [...goals];
    
    const indices: number[] = [];
    goals.forEach((goal, index) => {
      if (subsetIds.has(goal.id)) {
        indices.push(index);
      }
    });
    
    reorderedSubset.forEach((goal, i) => {
      newGoals[indices[i]] = goal;
    });
    
    setGoals(newGoals);
  };

  const addProject = (project: Project) => {
    setProjects([...projects, project]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const duplicateProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newProject = { ...project, id: `project-${Date.now()}`, name: `${project.name} (Copy)` };
      setProjects([...projects, newProject]);
    }
  };

  const reorderProjects = (reorderedSubset: Project[]) => {
    const subsetIds = new Set(reorderedSubset.map(p => p.id));
    const newProjects = [...projects];
    const indices: number[] = [];
    projects.forEach((project, index) => {
      if (subsetIds.has(project.id)) {
        indices.push(index);
      }
    });
    reorderedSubset.forEach((project, i) => {
      newProjects[indices[i]] = project;
    });
    setProjects(newProjects);
  };

  const addArea = (area: Area) => {
    setAreas([...areas, area]);
  };

  const updateArea = (id: string, updates: Partial<Area>) => {
    setAreas(areas.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteArea = (areaId: string) => {
    setAreas(areas.filter(a => a.id !== areaId));
  };

  const duplicateArea = (areaId: string) => {
    const area = areas.find(a => a.id === areaId);
    if (area) {
      const newArea = { ...area, id: `area-${Date.now()}`, name: `${area.name} (Copy)` };
      setAreas([...areas, newArea]);
    }
  };

  const reorderAreas = (reorderedSubset: Area[]) => {
    const subsetIds = new Set(reorderedSubset.map(a => a.id));
    const newAreas = [...areas];
    const indices: number[] = [];
    areas.forEach((area, index) => {
      if (subsetIds.has(area.id)) {
        indices.push(index);
      }
    });
    reorderedSubset.forEach((area, i) => {
      newAreas[indices[i]] = area;
    });
    setAreas(newAreas);
  };

  const addJournalEntry = (entry: JournalEntry) => {
    setJournal([...journal, entry]);
  };

  const addIdea = (idea: Idea) => {
    setIdeas([...ideas, idea]);
  };

  const addNote = (note: Note) => {
    setNotes([...notes, note]);
  };

  const updateNote = (updatedNote: Note) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const reorderNotes = (reorderedSubset: Note[]) => {
    const subsetIds = new Set(reorderedSubset.map(n => n.id));
    const newNotes = [...notes];
    
    // Find the indices of the items that were in the subset
    const indices: number[] = [];
    notes.forEach((note, index) => {
      if (subsetIds.has(note.id)) {
        indices.push(index);
      }
    });
    
    // Replace items at those indices with the reordered items in their new order
    reorderedSubset.forEach((note, i) => {
      newNotes[indices[i]] = note;
    });
    
    setNotes(newNotes);
  };

  const addCustomPage = (page: CustomPage) => {
    setCustomPages([...customPages, page]);
    setSidebarItems([...sidebarItems, { id: page.id, label: page.title, icon: page.icon, type: 'custom' }]);
  };

  const updateCustomPage = (updatedPage: CustomPage) => {
    setCustomPages(customPages.map(p => p.id === updatedPage.id ? updatedPage : p));
    setSidebarItems(sidebarItems.map(item => item.id === updatedPage.id ? { ...item, label: updatedPage.title, icon: updatedPage.icon } : item));
  };

  const moveToTrash = (type: TrashItem['type'], id: string) => {
    let data: any;
    switch (type) {
      case 'page':
        data = customPages.find(p => p.id === id);
        setCustomPages(customPages.filter(p => p.id !== id));
        setSidebarItems(sidebarItems.filter(i => i.id !== id));
        break;
      case 'note':
        data = notes.find(n => n.id === id);
        setNotes(notes.filter(n => n.id !== id));
        break;
      case 'project':
        data = projects.find(p => p.id === id);
        setProjects(projects.filter(p => p.id !== id));
        break;
      case 'goal':
        data = goals.find(g => g.id === id);
        setGoals(goals.filter(g => g.id !== id));
        break;
      case 'area':
        data = areas.find(a => a.id === id);
        setAreas(areas.filter(a => a.id !== id));
        break;
    }

    if (data) {
      setTrash([...trash, { id, type, data, deletedAt: new Date().toISOString() }]);
    }
  };

  const restoreFromTrash = (id: string) => {
    const item = trash.find(t => t.id === id);
    if (!item) return;

    switch (item.type) {
      case 'page':
        setCustomPages([...customPages, item.data]);
        setSidebarItems([...sidebarItems, { id: item.data.id, label: item.data.title, icon: item.data.icon, type: 'custom' }]);
        break;
      case 'note':
        setNotes([...notes, item.data]);
        break;
      case 'project':
        setProjects([...projects, item.data]);
        break;
      case 'goal':
        setGoals([...goals, item.data]);
        break;
      case 'area':
        setAreas([...areas, item.data]);
        break;
    }

    setTrash(trash.filter(t => t.id !== id));
  };

  const emptyTrash = () => {
    setTrash([]);
  };

  const reorderSidebarItems = (items: SidebarItem[]) => {
    setSidebarItems(items);
  };

  const deleteSidebarItem = (id: string) => {
    const item = sidebarItems.find(i => i.id === id);
    if (item) {
      if (item.type === 'custom') {
        moveToTrash('page', id);
      } else {
        setSidebarItems(sidebarItems.filter(item => item.id !== id));
      }
    }
  };

  const updateSidebarItem = (id: string, label: string, icon?: string) => {
    setSidebarItems(sidebarItems.map(item => item.id === id ? { ...item, label, icon: icon || item.icon } : item));
    setCustomPages(customPages.map(page => page.id === id ? { ...page, title: label, icon: icon || page.icon } : page));
  };

  const duplicateSidebarItem = (id: string) => {
    const item = sidebarItems.find(i => i.id === id);
    const page = customPages.find(p => p.id === id);
    if (item && page) {
      const newId = `page-${Date.now()}`;
      const newPage = { ...page, id: newId, title: `${page.title} (Copy)` };
      const newItem = { ...item, id: newId, label: `${item.label} (Copy)` };
      setCustomPages([...customPages, newPage]);
      setSidebarItems([...sidebarItems, newItem]);
    }
  };

  const addFolder = (folder: SidebarItem) => {
    setSidebarItems([...sidebarItems, folder]);
  };

  const toggleFolderExpansion = (id: string) => {
    setSidebarItems(sidebarItems.map(item => 
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  const moveSidebarItem = (id: string, parentId: string | undefined) => {
    setSidebarItems(sidebarItems.map(item => 
      item.id === id ? { ...item, parentId } : item
    ));
  };

  return (
    <AppContext.Provider value={{
      tasks, projects, goals, areas, habits, events, journal, moods, ideas, notes, customPages, sidebarItems, trash, user, loading,
      updateTask, addTask, deleteTask, updateHabit, addHabit, addMood, addGoal, updateGoal, deleteGoal, duplicateGoal, reorderGoals,
      addProject, updateProject, deleteProject, duplicateProject, reorderProjects,
      addArea, updateArea, deleteArea, duplicateArea, reorderAreas,
      addJournalEntry, addIdea, addNote, updateNote, deleteNote, reorderNotes, addCustomPage, updateCustomPage, 
      moveToTrash, restoreFromTrash, emptyTrash,
      reorderSidebarItems, deleteSidebarItem, updateSidebarItem, duplicateSidebarItem,
      addFolder, toggleFolderExpansion, moveSidebarItem
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
