export type ID = string;
export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'status'
  | 'date'
  | 'person'
  | 'files'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'formula'
  | 'relation'
  | 'rollup'
  | 'created-time'
  | 'created-by'
  | 'last-edited-time'
  | 'last-edited-by'
  | 'button'
  | 'place'
  | 'id';

export interface Idea {
  id: ID;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  projectId?: ID;
}

export interface Note {
  id: ID;
  title: string;
  content: string;
  ideaIds: ID[];
  createdAt: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0-100
  assignee?: string;
  areaId?: ID;
  customProperties?: Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>;
  icon?: string;
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  projectId?: ID;
  goalId?: ID;
  areaId?: ID;
  tags: string[];
}

export interface Habit {
  id: ID;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  logs: Record<string, boolean>; // date string -> completed
  goalId?: ID;
}

export interface Goal {
  id: ID;
  title: string;
  description: string;
  progress: number; // 0-100
  targetDate?: string;
  targetTime?: string;
  reminder?: string;
  alert?: string;
  repeat?: string;
  areaId?: ID;
  projectIds: ID[];
  taskIds: ID[];
  status: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  customProperties?: Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>;
  icon?: string;
}

export interface Project {
  id: ID;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  deadline?: string;
  areaId?: ID;
  goalId?: ID;
  taskIds: ID[];
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  customProperties?: Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>;
  icon?: string;
  targetDate?: string;
  targetTime?: string;
  reminder?: string;
  alert?: string;
  repeat?: string;
}

export interface Area {
  id: ID;
  name: string;
  goalIds: ID[];
  projectIds: ID[];
  description?: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  customProperties?: Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>;
  icon?: string;
  targetDate?: string;
  targetTime?: string;
  reminder?: string;
  alert?: string;
  repeat?: string;
}

export interface Event {
  id: ID;
  title: string;
  date: string;
  time?: string;
  location?: string;
  areaId?: ID;
  projectId?: ID;
}

export interface JournalEntry {
  id: ID;
  title: string;
  content: string;
  date: string;
  moodId?: ID;
  tags: string[];
}

export interface Mood {
  id: ID;
  type: 'rad' | 'good' | 'meh' | 'bad' | 'awful';
  intensity: number; // 1-5
  date: string;
  journalEntryId?: ID;
}

export interface CustomPageItem {
  id: ID;
  title: string;
  icon: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  date?: string;
  progress: number;
  properties: Record<string, any>;
}

export interface CustomPage {
  id: ID;
  title: string;
  icon: string;
  description?: string;
  kind?: 'database' | 'document';
  templateVersion?: string;
  activeTab?: string;
  tabs: Array<{ id: string; label: string; icon: string }>;
  columns: Array<{ id: string; label: string; icon: string; width: string; hidden?: boolean }>;
  sortConfigs?: Array<{ columnId: string; direction: 'asc' | 'desc' }>;
  items: CustomPageItem[];
  properties: Array<{ id: string; name: string; type: PropertyType; value: any; icon?: string }>;
  content: string;
}

export interface TrashItem {
  id: ID;
  type: 'page' | 'note' | 'project' | 'goal' | 'area';
  data: any;
  deletedAt: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  type: 'system' | 'custom' | 'trash' | 'folder';
  parentId?: string;
  isExpanded?: boolean;
}
