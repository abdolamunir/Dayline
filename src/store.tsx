import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Task, Project, Goal, Area, Habit, Event, JournalEntry, Mood, Idea, Note, CustomPage, SidebarItem, TrashItem } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

const initialSidebarItems: SidebarItem[] = [
  { id: 'favourites', label: 'Favourites', icon: 'Folder', type: 'folder', isExpanded: true },
  { id: 'shared', label: 'Shared', icon: 'Users', type: 'folder', isExpanded: true },
  { id: 'private', label: 'Private', icon: 'Lock', type: 'folder', isExpanded: true },
  { id: 'notes', label: 'Notes', icon: 'Pencil', type: 'system', parentId: 'private' },
  { id: 'projects', label: 'Projects', icon: 'Folder', type: 'system', parentId: 'private' },
  { id: 'goals', label: 'Goals', icon: 'Target', type: 'system', parentId: 'private' },
  { id: 'areas', label: 'Areas', icon: 'Layers', type: 'system', parentId: 'private' },
  { id: 'habits', label: 'Habits', icon: 'Dumbbell', type: 'system', parentId: 'private' },
  { id: 'ideas', label: 'Ideas', icon: 'Smile', type: 'system', parentId: 'private' },
  { id: 'journal', label: 'Journal', icon: 'Book', type: 'system', parentId: 'private' },
  { id: 'moods', label: 'Moods', icon: 'Activity', type: 'system', parentId: 'private' },
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
  viewSettings: Record<string, any>;
  user: any | null;
  loading: boolean;
  
  // Actions
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  updateHabit: (habit: Habit) => void;
  addHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => void;
  addMood: (mood: Mood) => void;
  updateMood: (mood: Mood) => void;
  deleteMood: (moodId: string) => void;
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (entryId: string) => void;
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
  replaceProjects: (projects: Project[]) => void;
  addArea: (area: Area) => void;
  updateArea: (id: string, updates: Partial<Area>) => void;
  deleteArea: (areaId: string) => void;
  duplicateArea: (areaId: string) => void;
  reorderAreas: (areas: Area[]) => void;
  replaceAreas: (areas: Area[]) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  addIdea: (idea: Idea) => void;
  updateIdea: (idea: Idea) => void;
  deleteIdea: (ideaId: string) => void;
  replaceIdeas: (ideas: Idea[]) => void;
  reorderIdeas: (ideas: Idea[]) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (noteId: string) => void;
  reorderNotes: (notes: Note[]) => void;
  replaceNotes: (notes: Note[]) => void;
  addCustomPage: (page: CustomPage, parentId?: string) => void;
  updateCustomPage: (page: CustomPage) => void;
  moveToTrash: (type: TrashItem['type'], id: string) => void;
  restoreFromTrash: (id: string) => void;
  emptyTrash: () => void;
  reorderSidebarItems: (items: SidebarItem[]) => void;
  deleteSidebarItem: (id: string) => void;
  updateSidebarItem: (id: string, label: string, icon?: string) => void;
  duplicateSidebarItem: (id: string) => void;
  updateViewSettings: (viewId: string, settings: Record<string, any>) => void;
  addFolder: (folder: SidebarItem) => void;
  toggleFolderExpansion: (id: string) => void;
  moveSidebarItem: (id: string, parentId: string | undefined) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);
const LEGACY_STORAGE_KEY = 'dayline:workspace:v1';
const USER_CACHE_PREFIX = 'dayline:user-workspace:v1:';

type PersistedWorkspace = Pick<AppState,
  'tasks' | 'projects' | 'goals' | 'areas' | 'habits' | 'events' | 'journal' |
  'moods' | 'ideas' | 'notes' | 'customPages' | 'sidebarItems' | 'trash' | 'viewSettings'
>;

const createEmptyWorkspace = (): PersistedWorkspace => ({
  tasks: [],
  projects: [],
  goals: [],
  areas: [],
  habits: [],
  events: [],
  journal: [],
  moods: [],
  ideas: [],
  notes: [],
  customPages: [],
  sidebarItems: initialSidebarItems,
  trash: [],
  viewSettings: {},
});

const uniqueById = <T extends { id: string }>(items: T[] = []): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const smartSidebarIds = new Set(['favourites', 'shared']);
const fixedSidebarIds = new Set([...smartSidebarIds, 'private']);

const normalizeWorkspace = (workspace: Partial<PersistedWorkspace>): PersistedWorkspace => {
  const rawWorkspace = { ...createEmptyWorkspace(), ...workspace };
  const nextWorkspace = {
    ...rawWorkspace,
    tasks: uniqueById(rawWorkspace.tasks),
    projects: uniqueById(rawWorkspace.projects),
    goals: uniqueById(rawWorkspace.goals),
    areas: uniqueById(rawWorkspace.areas),
    habits: uniqueById(rawWorkspace.habits),
    events: uniqueById(rawWorkspace.events),
    journal: uniqueById(rawWorkspace.journal),
    moods: uniqueById(rawWorkspace.moods),
    ideas: uniqueById(rawWorkspace.ideas),
    notes: uniqueById(rawWorkspace.notes),
    customPages: uniqueById(rawWorkspace.customPages),
    sidebarItems: uniqueById(rawWorkspace.sidebarItems),
    trash: uniqueById(rawWorkspace.trash),
  };
  const customPageById = new Map(nextWorkspace.customPages.map(page => [page.id, page]));
  const existingSidebarIds = new Set(nextWorkspace.sidebarItems.map(item => item.id));
  const favoriteSidebarChildIds = new Set(
    nextWorkspace.sidebarItems
      .filter(item => item.parentId === 'favourites')
      .map(item => item.id)
  );
  const sharedSidebarChildIds = new Set(
    nextWorkspace.sidebarItems
      .filter(item => item.parentId === 'shared')
      .map(item => item.id)
  );

  if (favoriteSidebarChildIds.size > 0 || sharedSidebarChildIds.size > 0) {
    nextWorkspace.customPages = nextWorkspace.customPages.map(page => (
      favoriteSidebarChildIds.has(page.id) || sharedSidebarChildIds.has(page.id)
        ? {
            ...page,
            isFavorite: favoriteSidebarChildIds.has(page.id) ? true : page.isFavorite,
            isShared: sharedSidebarChildIds.has(page.id) ? true : page.isShared,
          }
        : page
    ));
  }
  
  let syncedSidebarItems = nextWorkspace.sidebarItems.map(item => {
    let nextItem = { ...item };
    if (nextItem.parentId === 'favourites') {
      nextItem.isFavorite = true;
      nextItem.parentId = undefined;
    }
    if (nextItem.parentId === 'shared') {
      nextItem.isShared = true;
      nextItem.parentId = undefined;
    }
    if (!nextItem.parentId && !fixedSidebarIds.has(nextItem.id) && nextItem.type !== 'trash' && nextItem.type !== 'folder') {
      nextItem.parentId = 'private';
    }
    if (nextItem.type !== 'custom') return nextItem;
    const page = customPageById.get(nextItem.id);
    return page ? { ...nextItem, label: page.title, icon: page.icon } : nextItem;
  });

  if (!existingSidebarIds.has('favourites')) {
    syncedSidebarItems = [
      { id: 'favourites', label: 'Favourites', icon: 'Folder', type: 'folder', isExpanded: true },
      ...syncedSidebarItems
    ];
  }

  if (!existingSidebarIds.has('shared')) {
    const favouritesIndex = syncedSidebarItems.findIndex(item => item.id === 'favourites');
    const sharedItem = { id: 'shared', label: 'Shared', icon: 'Users', type: 'folder' as const, isExpanded: true };
    if (favouritesIndex >= 0) {
      syncedSidebarItems = [
        ...syncedSidebarItems.slice(0, favouritesIndex + 1),
        sharedItem,
        ...syncedSidebarItems.slice(favouritesIndex + 1),
      ];
    } else {
      syncedSidebarItems = [sharedItem, ...syncedSidebarItems];
    }
  }

  if (!existingSidebarIds.has('private')) {
    const sharedIndex = syncedSidebarItems.findIndex(item => item.id === 'shared');
    const privateItem = { id: 'private', label: 'Private', icon: 'Lock', type: 'folder' as const, isExpanded: true };
    if (sharedIndex >= 0) {
      syncedSidebarItems = [
        ...syncedSidebarItems.slice(0, sharedIndex + 1),
        privateItem,
        ...syncedSidebarItems.slice(sharedIndex + 1),
      ];
    } else {
      syncedSidebarItems = [privateItem, ...syncedSidebarItems];
    }
  }

  const missingCustomItems = nextWorkspace.customPages
    .filter(page => !existingSidebarIds.has(page.id))
    .map(page => ({ id: page.id, label: page.title, icon: page.icon, type: 'custom' as const, parentId: 'private' }));

  return {
    ...nextWorkspace,
    sidebarItems: uniqueById([...syncedSidebarItems, ...missingCustomItems]),
  };
};

function readLegacyWorkspace(): Partial<PersistedWorkspace> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed?.workspace) return null;
    return parsed.workspace;
  } catch (error) {
    console.warn('Unable to read legacy Dayline workspace from local storage.', error);
    return null;
  }
}

function clearLegacyWorkspace() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function readCachedWorkspace(uid: string): Partial<PersistedWorkspace> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(`${USER_CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed?.workspace) return null;
    return parsed.workspace;
  } catch (error) {
    console.warn('Unable to read cached Dayline workspace.', error);
    return null;
  }
}

function writeCachedWorkspace(uid: string, workspace: PersistedWorkspace) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(`${USER_CACHE_PREFIX}${uid}`, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      workspace,
    }));
  } catch (error) {
    console.warn('Unable to cache Dayline workspace.', error);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [workspace] = useState<PersistedWorkspace>(() => createEmptyWorkspace());
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
  const [viewSettings, setViewSettings] = useState<Record<string, any>>(workspace.viewSettings);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const workspaceReadyRef = useRef(false);
  const hasLocalChangesBeforeRemoteRef = useRef(false);
  const isHydratingWorkspaceRef = useRef(false);

  const applyWorkspace = (nextWorkspace: Partial<PersistedWorkspace>) => {
    isHydratingWorkspaceRef.current = true;
    const normalizedWorkspace = normalizeWorkspace(nextWorkspace);
    setTasks(normalizedWorkspace.tasks);
    setProjects(normalizedWorkspace.projects);
    setGoals(normalizedWorkspace.goals);
    setAreas(normalizedWorkspace.areas);
    setHabits(normalizedWorkspace.habits);
    setEvents(normalizedWorkspace.events);
    setJournal(normalizedWorkspace.journal);
    setMoods(normalizedWorkspace.moods);
    setIdeas(normalizedWorkspace.ideas);
    setNotes(normalizedWorkspace.notes);
    setCustomPages(normalizedWorkspace.customPages);
    setSidebarItems(normalizedWorkspace.sidebarItems);
    setTrash(normalizedWorkspace.trash);
    setViewSettings(normalizedWorkspace.viewSettings);
    window.setTimeout(() => {
      isHydratingWorkspaceRef.current = false;
    }, 250);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setWorkspaceReady(false);
      workspaceReadyRef.current = false;
      hasLocalChangesBeforeRemoteRef.current = false;
      setUser(nextUser);

      if (!nextUser) {
        applyWorkspace(createEmptyWorkspace());
        setLoading(false);
        return;
      }

      const cachedWorkspace = readCachedWorkspace(nextUser.uid);
      const legacyWorkspace = readLegacyWorkspace();
      const immediateWorkspace = { ...createEmptyWorkspace(), ...legacyWorkspace, ...cachedWorkspace };

      applyWorkspace(immediateWorkspace);
      setLoading(false);

      try {
        const workspaceRef = doc(db, 'workspaces', nextUser.uid);
        const snapshot = await getDoc(workspaceRef);
        const loadedWorkspace = snapshot.exists()
          ? snapshot.data().workspace as Partial<PersistedWorkspace> | undefined
          : undefined;
        const migratedWorkspace = snapshot.exists() ? undefined : legacyWorkspace;
        const nextWorkspace = { ...createEmptyWorkspace(), ...migratedWorkspace, ...cachedWorkspace, ...loadedWorkspace };

        if (!hasLocalChangesBeforeRemoteRef.current) {
          applyWorkspace(nextWorkspace);
          writeCachedWorkspace(nextUser.uid, nextWorkspace);
        }

        if (!snapshot.exists()) {
          await setDoc(workspaceRef, {
            ownerId: nextUser.uid,
            ownerEmail: nextUser.email || null,
            workspace: hasLocalChangesBeforeRemoteRef.current ? immediateWorkspace : nextWorkspace,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
          clearLegacyWorkspace();
        }

        setWorkspaceReady(true);
        workspaceReadyRef.current = true;
      } catch (error) {
        console.error('Unable to load Dayline workspace from Firebase.', error);
        setWorkspaceReady(true);
        workspaceReadyRef.current = true;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const nextWorkspace = normalizeWorkspace({
      tasks, projects, goals, areas, habits, events, journal, moods, ideas,
      notes, customPages, sidebarItems, trash, viewSettings
    });

    writeCachedWorkspace(user.uid, nextWorkspace);

    if (!workspaceReady) {
      if (!isHydratingWorkspaceRef.current) {
        hasLocalChangesBeforeRemoteRef.current = true;
      }
      return;
    }

    const saveTimeout = window.setTimeout(async () => {
      try {
        await setDoc(doc(db, 'workspaces', user.uid), {
          ownerId: user.uid,
          ownerEmail: user.email || null,
          workspace: nextWorkspace,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error('Unable to save Dayline workspace to Firebase.', error);
      }
    }, 450);

    return () => window.clearTimeout(saveTimeout);
  }, [tasks, projects, goals, areas, habits, events, journal, moods, ideas, notes, customPages, sidebarItems, trash, viewSettings, user, workspaceReady]);

  const updateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const addTask = (task: Task) => {
    setTasks(currentTasks => uniqueById([...currentTasks, task]));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const updateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const addHabit = (habit: Habit) => {
    setHabits(currentHabits => uniqueById([...currentHabits, habit]));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(habits.filter(h => h.id !== habitId));
  };

  const addMood = (mood: Mood) => {
    setMoods(currentMoods => uniqueById([...currentMoods, mood]));
  };

  const updateMood = (updatedMood: Mood) => {
    setMoods(moods.map(m => m.id === updatedMood.id ? updatedMood : m));
  };

  const deleteMood = (moodId: string) => {
    setMoods(moods.filter(m => m.id !== moodId));
  };

  const addGoal = (goal: Goal) => {
    setGoals(currentGoals => uniqueById([...currentGoals, goal]));
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
      setGoals(currentGoals => [...currentGoals, newGoal]);
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
    setProjects(currentProjects => uniqueById([...currentProjects, project]));
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
      setProjects(currentProjects => [...currentProjects, newProject]);
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

  const replaceProjects = (nextProjects: Project[]) => {
    setProjects(nextProjects);
  };

  const addArea = (area: Area) => {
    setAreas(currentAreas => uniqueById([...currentAreas, area]));
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
      setAreas(currentAreas => [...currentAreas, newArea]);
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

  const replaceAreas = (nextAreas: Area[]) => {
    setAreas(nextAreas);
  };

  const addJournalEntry = (entry: JournalEntry) => {
    setJournal(currentJournal => uniqueById([...currentJournal, entry]));
  };

  const updateJournalEntry = (updatedEntry: JournalEntry) => {
    setJournal(journal.map(j => j.id === updatedEntry.id ? updatedEntry : j));
  };

  const deleteJournalEntry = (entryId: string) => {
    setJournal(journal.filter(j => j.id !== entryId));
  };

  const addIdea = (idea: Idea) => {
    setIdeas(currentIdeas => uniqueById([...currentIdeas, idea]));
  };

  const updateIdea = (updatedIdea: Idea) => {
    setIdeas(ideas.map(i => i.id === updatedIdea.id ? updatedIdea : i));
  };

  const deleteIdea = (ideaId: string) => {
    setIdeas(ideas.filter(i => i.id !== ideaId));
  };

  const replaceIdeas = (nextIdeas: Idea[]) => {
    setIdeas(nextIdeas);
  };

  const reorderIdeas = (reorderedSubset: Idea[]) => {
    const subsetIds = new Set(reorderedSubset.map(i => i.id));
    const newIdeas = [...ideas];
    const indices: number[] = [];
    ideas.forEach((idea, index) => {
      if (subsetIds.has(idea.id)) indices.push(index);
    });
    reorderedSubset.forEach((idea, i) => {
      newIdeas[indices[i]] = idea;
    });
    setIdeas(newIdeas);
  };

  const addNote = (note: Note) => {
    setNotes(currentNotes => uniqueById([...currentNotes, note]));
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

  const replaceNotes = (nextNotes: Note[]) => {
    setNotes(nextNotes);
  };

  const addCustomPage = (page: CustomPage, parentId?: string) => {
    const nextParentId = parentId || 'private';
    setCustomPages(currentPages => uniqueById([...currentPages, page]));
    setSidebarItems(currentItems => uniqueById([
      ...currentItems,
      {
        id: page.id,
        label: page.title,
        icon: page.icon,
        type: 'custom',
        parentId: nextParentId,
        isFavorite: page.isFavorite,
        isShared: page.isShared,
        sharedWith: page.sharedWith,
      },
    ]));
  };

  const updateCustomPage = (updatedPage: CustomPage) => {
    setCustomPages(currentPages => currentPages.map(page => page.id === updatedPage.id ? updatedPage : page));
    setSidebarItems(currentItems => currentItems.map(item => item.id === updatedPage.id ? {
      ...item,
      label: updatedPage.title,
      icon: updatedPage.icon,
      isFavorite: updatedPage.isFavorite,
      isShared: updatedPage.isShared,
      sharedWith: updatedPage.sharedWith,
    } : item));
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
        setCustomPages(currentPages => uniqueById([...currentPages, item.data]));
        setSidebarItems(currentItems => uniqueById([...currentItems, { id: item.data.id, label: item.data.title, icon: item.data.icon, type: 'custom', parentId: 'private' }]));
        break;
      case 'note':
        setNotes(currentNotes => uniqueById([...currentNotes, item.data]));
        break;
      case 'project':
        setProjects(currentProjects => uniqueById([...currentProjects, item.data]));
        break;
      case 'goal':
        setGoals(currentGoals => uniqueById([...currentGoals, item.data]));
        break;
      case 'area':
        setAreas(currentAreas => uniqueById([...currentAreas, item.data]));
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
    if (fixedSidebarIds.has(id)) return;
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
    if (fixedSidebarIds.has(id)) return;
    const item = sidebarItems.find(i => i.id === id);
    if (!item) return;

    const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

    const insertAfter = <T extends { id: string },>(items: T[], afterId: string, ...newItems: T[]): T[] => {
      const copy = [...items];
      const idx = copy.findIndex(i => i.id === afterId);
      copy.splice(idx + 1, 0, ...newItems);
      return copy;
    };

    const buildSystemPage = (sysId: string): { page: CustomPage; sidebarItem: SidebarItem } | null => {
      const settings = viewSettings[sysId] || {};
      const defaults: Record<string, { tabs: any[]; columns: any[] }> = {
        notes: {
          tabs: [{ id: 'planning', label: 'Planning', icon: 'Clock' }, { id: 'active', label: 'Active', icon: 'Target' }, { id: 'completed', label: 'Completed', icon: 'CheckCircle2' }, { id: 'paused', label: 'Paused', icon: 'Circle' }],
          columns: [{ id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' }, { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' }, { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' }, { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' }, { id: 'date', label: 'Created Date', icon: 'CalendarIcon', width: '180px' }, { id: 'progress', label: 'Progress', icon: 'Circle', width: '180px' }, { id: 'creator', label: 'Creator', icon: 'User', width: '180px' }],
        },
        projects: {
          tabs: [{ id: 'planning', label: 'Planning', icon: 'Clock' }, { id: 'active', label: 'Active', icon: 'Target' }, { id: 'completed', label: 'Completed', icon: 'CheckCircle2' }, { id: 'paused', label: 'Paused', icon: 'Circle' }],
          columns: [{ id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' }, { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' }, { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' }, { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' }, { id: 'date', label: 'Deadline', icon: 'CalendarIcon', width: '180px' }, { id: 'creator', label: 'Creator', icon: 'User', width: '180px' }],
        },
        areas: {
          tabs: [{ id: 'planning', label: 'Planning', icon: 'Clock' }, { id: 'active', label: 'Active', icon: 'Target' }, { id: 'completed', label: 'Completed', icon: 'CheckCircle2' }, { id: 'paused', label: 'Paused', icon: 'Circle' }],
          columns: [{ id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' }, { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' }, { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' }, { id: 'assigned', label: 'Assigned', icon: 'Users', width: '180px' }, { id: 'creator', label: 'Creator', icon: 'User', width: '180px' }],
        },
        ideas: {
          tabs: [{ id: 'active', label: 'Active', icon: 'Smile' }, { id: 'completed', label: 'Completed', icon: 'CheckCircle2' }, { id: 'archived', label: 'Archived', icon: 'Circle' }],
          columns: [{ id: 'title', label: 'Name', icon: 'SettingsGear', width: '320px' }, { id: 'status', label: 'Status', icon: 'CheckCircle', width: '170px' }, { id: 'priority', label: 'Priority', icon: 'Clock', width: '170px' }, { id: 'date', label: 'Created', icon: 'CalendarIcon', width: '180px' }],
        },
      };

      const sysDefaults = defaults[sysId] || { tabs: [], columns: [] };
      const tabs = settings.tabs || sysDefaults.tabs;
      const columns = settings.columns || sysDefaults.columns;

      const collectSystemProperties = (items: any[]): any[] => {
        const result: any[] = [];
        if (sysId === 'notes' || sysId === 'projects') {
          result.push({ id: 'assigned', name: 'Assigned', type: 'text' as const, value: '', icon: 'Users' });
          result.push({ id: 'creator', name: 'Creator', type: 'text' as const, value: '', icon: 'User' });
        }
        if (sysId === 'areas') {
          result.push({ id: 'assigned', name: 'Assigned', type: 'text' as const, value: '', icon: 'Users' });
        }
        for (const item of items) {
          for (const cp of (item.customProperties || [])) {
            if (!result.some(r => r.id === cp.id)) {
              result.push(cp);
            }
          }
        }
        return result;
      };

      const newId = `page-${Date.now()}`;
      let systemItems: CustomPage['items'] = [];

      if (sysId === 'notes') {
        systemItems = notes.map(note => ({
          id: note.id,
          title: note.title,
          icon: 'Pencil',
          status: note.status === 'in-progress' ? 'active' : note.status === 'inbox' ? 'planning' : note.status,
          priority: note.priority,
          date: note.createdAt,
          progress: note.progress,
          isFavorite: note.isFavorite,
          properties: {
            assigned: note.assignee || 'Unassigned',
            creator: 'Abdola Munir',
            content: note.content,
            description: note.content,
            ...Object.fromEntries((note.customProperties || []).map(p => [p.id, p.value])),
          },
        }));
      } else if (sysId === 'projects') {
        systemItems = projects.map(project => ({
          id: project.id,
          title: project.name,
          icon: project.icon || 'FolderKanban',
          status: project.status,
          priority: project.priority || 'medium',
          date: project.deadline || project.targetDate,
          progress: 0,
          isFavorite: project.isFavorite,
          properties: {
            assigned: project.assignee || 'Unassigned',
            creator: 'Abdola Munir',
            ...Object.fromEntries((project.customProperties || []).map(p => [p.id, p.value])),
          },
        }));
      } else if (sysId === 'areas') {
        systemItems = areas.map(area => ({
          id: area.id,
          title: area.name,
          icon: area.icon || 'Layers',
          status: area.status,
          priority: area.priority || 'medium',
          progress: 0,
          isFavorite: area.isFavorite,
          properties: {
            assigned: area.assignee || 'Unassigned',
            ...Object.fromEntries((area.customProperties || []).map(p => [p.id, p.value])),
          },
        }));
      } else if (sysId === 'ideas') {
        systemItems = ideas.map(idea => ({
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
            assigned: idea.assignee || 'Unassigned',
            creator: 'Abdola Munir',
          },
        }));
      }

      const properties = collectSystemProperties(
        sysId === 'notes' ? notes : sysId === 'projects' ? projects : sysId === 'areas' ? areas : ideas
      );

      const page: CustomPage = {
        id: newId,
        title: `${item.label} (Copy)`,
        icon: item.icon,
        kind: 'database',
        activeTab: settings.activeTab,
        tabs: deepClone(tabs),
        columns: deepClone(columns),
        properties: deepClone(properties),
        sortConfigs: settings.sortConfigs ? deepClone(settings.sortConfigs) : [],
        items: deepClone(systemItems),
        content: '',
      };
      const sidebarItem: SidebarItem = { ...item, id: newId, label: `${item.label} (Copy)`, type: 'custom' };
      return { page, sidebarItem };
    };

    if (item.type === 'folder') {
      const idMap = new Map<string, string>([[id, `folder-${Date.now()}`]]);
      const collectDescendants = (parentId: string): SidebarItem[] => {
        const children = sidebarItems.filter(sidebarItem => sidebarItem.parentId === parentId);
        return children.flatMap(child => [child, ...collectDescendants(child.id)]);
      };
      const sourceItems = [item, ...collectDescendants(id)];
      const duplicatedItems = sourceItems.map((sourceItem, index) => {
        const newId = idMap.get(sourceItem.id) || `${sourceItem.type === 'folder' ? 'folder' : 'page'}-${Date.now()}-${index}`;
        idMap.set(sourceItem.id, newId);
        const newParentId = sourceItem.parentId ? idMap.get(sourceItem.parentId) : sourceItem.parentId;

        return {
          ...sourceItem,
          id: newId,
          parentId: sourceItem.id === id ? sourceItem.parentId : newParentId,
          label: sourceItem.id === id ? `${sourceItem.label} (Copy)` : sourceItem.label,
          isExpanded: sourceItem.type === 'folder' ? true : sourceItem.isExpanded,
        };
      });

      const pageById = new Map(customPages.map(p => [p.id, p]));
      const duplicatedPages = sourceItems
        .filter(sourceItem => sourceItem.type === 'custom' && pageById.has(sourceItem.id))
        .map(sourceItem => {
          const sourcePage = pageById.get(sourceItem.id)!;
          const newId = idMap.get(sourceItem.id)!;
          return {
            ...sourcePage,
            id: newId,
            title: `${sourcePage.title} (Copy)`,
            items: deepClone(sourcePage.items),
            columns: deepClone(sourcePage.columns),
            tabs: deepClone(sourcePage.tabs),
            properties: deepClone(sourcePage.properties),
            sortConfigs: sourcePage.sortConfigs ? deepClone(sourcePage.sortConfigs) : undefined,
            sharedWith: sourcePage.sharedWith ? deepClone(sourcePage.sharedWith) : undefined,
          };
        });

      setCustomPages(currentPages => [...currentPages, ...duplicatedPages]);
      setSidebarItems(currentItems => insertAfter(
        currentItems,
        id,
        ...duplicatedItems.map(duplicatedItem => (
          duplicatedItem.type === 'folder' ? duplicatedItem : { ...duplicatedItem, type: 'custom' as const }
        ))
      ));
      return;
    }

    const page = customPages.find(p => p.id === id);
    if (item.type === 'custom' && page) {
      const newId = `page-${Date.now()}`;
      const newPage: CustomPage = {
        ...page,
        id: newId,
        title: `${page.title} (Copy)`,
        items: deepClone(page.items),
        columns: deepClone(page.columns),
        tabs: deepClone(page.tabs),
        properties: deepClone(page.properties),
        sortConfigs: page.sortConfigs ? deepClone(page.sortConfigs) : undefined,
        sharedWith: page.sharedWith ? deepClone(page.sharedWith) : undefined,
      };
      const newItem = { ...item, id: newId, label: `${item.label} (Copy)` };
      setCustomPages(currentPages => [...currentPages, newPage]);
      setSidebarItems(currentItems => insertAfter(currentItems, id, newItem));
      return;
    }

    if (item.type === 'system') {
      const built = buildSystemPage(id);
      if (built) {
        setCustomPages(currentPages => [...currentPages, built.page]);
        setSidebarItems(currentItems => insertAfter(currentItems, id, built.sidebarItem));
        return;
      }
    }

    const newId = `page-${Date.now()}`;
    const newLabel = `${item.label} (Copy)`;
    const blankPage: CustomPage = {
      id: newId,
      title: newLabel,
      icon: item.icon,
      kind: 'document',
      tabs: [],
      columns: [],
      items: [],
      properties: [],
      content: '',
    };
    setCustomPages(currentPages => [...currentPages, blankPage]);
    setSidebarItems(currentItems => insertAfter(currentItems, id, { ...item, id: newId, label: newLabel, type: 'custom' }));
  };

  const updateViewSettings = (viewId: string, settings: Record<string, any>) => {
    setViewSettings(currentSettings => ({
      ...currentSettings,
      [viewId]: {
        ...(currentSettings[viewId] || {}),
        ...settings,
      },
    }));
  };

  const addFolder = (folder: SidebarItem) => {
    setSidebarItems(currentItems => uniqueById([...currentItems, folder]));
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
      tasks, projects, goals, areas, habits, events, journal, moods, ideas, notes, customPages, sidebarItems, trash, viewSettings, user, loading,
      updateTask, addTask, deleteTask, updateHabit, addHabit, deleteHabit, addMood, updateMood, deleteMood, addGoal, updateGoal, deleteGoal, duplicateGoal, reorderGoals,
      addProject, updateProject, deleteProject, duplicateProject, reorderProjects, replaceProjects,
      addArea, updateArea, deleteArea, duplicateArea, reorderAreas, replaceAreas,
      addJournalEntry, updateJournalEntry, deleteJournalEntry, addIdea, updateIdea, deleteIdea, replaceIdeas, reorderIdeas, addNote, updateNote, deleteNote, reorderNotes, replaceNotes, addCustomPage, updateCustomPage, 
      moveToTrash, restoreFromTrash, emptyTrash,
      reorderSidebarItems, deleteSidebarItem, updateSidebarItem, duplicateSidebarItem,
      updateViewSettings, addFolder, toggleFolderExpansion, moveSidebarItem
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
