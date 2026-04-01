import { Task, Project, Goal, Area, Habit, Event, JournalEntry, Mood, Idea, Note } from '../types';
import { format, addDays, subDays } from 'date-fns';

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

export const mockAreas: Area[] = [
  { id: 'a1', name: 'Health & Fitness', goalIds: ['g1', 'g3'], projectIds: ['p3'] },
  { id: 'a2', name: 'Career & Business', goalIds: ['g2'], projectIds: ['p1', 'p4'] },
  { id: 'a3', name: 'Personal Growth', goalIds: ['g4'], projectIds: ['p2'] },
  { id: 'a4', name: 'Home & Family', goalIds: [], projectIds: ['p5'] },
  { id: 'a5', name: 'Finances', goalIds: ['g5'], projectIds: [] },
];

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Run a Marathon', description: 'Complete the city marathon in under 4 hours.', progress: 35, targetDate: '2026-10-15', areaId: 'a1', projectIds: [], taskIds: [], status: 'active', priority: 'high', assignee: 'Alice' },
  { id: 'g2', title: 'Launch Startup', description: 'Get the MVP out and acquire 100 users.', progress: 60, targetDate: '2026-06-01', areaId: 'a2', projectIds: ['p1'], taskIds: ['t1', 't2'], status: 'active', priority: 'high', assignee: 'Bob' },
  { id: 'g3', title: 'Lose 10 lbs', description: 'Reach target weight through diet and exercise.', progress: 40, targetDate: '2026-08-01', areaId: 'a1', projectIds: ['p3'], taskIds: [], status: 'negotiating', priority: 'medium', assignee: 'Charlie' },
  { id: 'g4', title: 'Read 24 Books', description: 'Read two books per month.', progress: 25, targetDate: '2026-12-31', areaId: 'a3', projectIds: [], taskIds: [], status: 'in-progress', priority: 'low', assignee: 'Alice' },
  { id: 'g5', title: 'Save $10,000', description: 'Emergency fund savings goal.', progress: 15, targetDate: '2026-12-31', areaId: 'a5', projectIds: [], taskIds: [], status: 'completed', priority: 'medium', assignee: 'Bob' },
  { id: 'g6', title: 'Master TypeScript', description: 'Deep dive into advanced types and patterns.', progress: 50, targetDate: '2026-09-01', areaId: 'a2', projectIds: [], taskIds: [], status: 'in-progress', priority: 'high', assignee: 'Alice' },
  { id: 'g7', title: 'Travel to Japan', description: 'Visit Tokyo, Kyoto and Osaka.', progress: 10, targetDate: '2027-04-01', areaId: 'a3', projectIds: [], taskIds: [], status: 'inbox', priority: 'medium', assignee: 'Bob' },
  { id: 'g8', title: 'Build a Portfolio', description: 'Showcase all my projects in one place.', progress: 80, targetDate: '2026-05-15', areaId: 'a2', projectIds: [], taskIds: [], status: 'in-progress', priority: 'medium', assignee: 'Charlie' },
];

export const mockProjects: Project[] = [
  { id: 'p1', name: 'MVP Development', description: 'Core features for the launch.', status: 'active', deadline: '2026-05-01', goalId: 'g2', taskIds: ['t1', 't2', 't5'] },
  { id: 'p2', name: 'Learn Spanish', description: 'Reach B2 level fluency.', status: 'active', goalId: 'g4', taskIds: ['t3', 't6'] },
  { id: 'p3', name: 'Half-Marathon Prep', description: 'Training schedule for the upcoming half-marathon.', status: 'active', goalId: 'g1', taskIds: ['t7', 't8'] },
  { id: 'p4', name: 'Q3 Marketing Campaign', description: 'Plan and execute the new ad strategy.', status: 'paused', goalId: 'g2', taskIds: ['t9'] },
  { id: 'p5', name: 'Kitchen Remodel', description: 'Update cabinets and countertops.', status: 'completed', goalId: undefined, taskIds: ['t10'] },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Design Landing Page', status: 'done', priority: 'high', dueDate: todayStr, startTime: '09:00', endTime: '10:30', projectId: 'p1', tags: ['design', 'web'] },
  { id: 't2', title: 'Implement Auth', status: 'doing', priority: 'high', dueDate: todayStr, startTime: '11:00', endTime: '13:00', projectId: 'p1', tags: ['dev', 'security'] },
  { id: 't3', title: 'Complete Duolingo Unit 5', status: 'todo', priority: 'medium', dueDate: todayStr, startTime: '14:00', endTime: '15:00', projectId: 'p2', tags: ['learning', 'language'] },
  { id: 't4', title: 'Buy groceries', status: 'todo', priority: 'low', dueDate: todayStr, startTime: '16:00', endTime: '17:00', tags: ['personal', 'errands'] },
  { id: 't5', title: 'Setup CI/CD Pipeline', status: 'todo', priority: 'high', dueDate: tomorrowStr, projectId: 'p1', tags: ['devops'] },
  { id: 't6', title: 'Schedule iTalki Lesson', status: 'todo', priority: 'medium', dueDate: tomorrowStr, projectId: 'p2', tags: ['learning'] },
  { id: 't7', title: '10k Long Run', status: 'todo', priority: 'high', dueDate: format(addDays(today, 2), 'yyyy-MM-dd'), projectId: 'p3', tags: ['health', 'exercise'] },
  { id: 't8', title: 'Buy new running shoes', status: 'done', priority: 'medium', dueDate: yesterdayStr, projectId: 'p3', tags: ['shopping'] },
  { id: 't9', title: 'Draft ad copy', status: 'todo', priority: 'medium', dueDate: format(addDays(today, 10), 'yyyy-MM-dd'), projectId: 'p4', tags: ['marketing'] },
  { id: 't10', title: 'Pay contractor invoice', status: 'done', priority: 'high', dueDate: format(subDays(today, 5), 'yyyy-MM-dd'), projectId: 'p5', tags: ['finance'] },
  { id: 't11', title: 'Call Mom', status: 'todo', priority: 'medium', dueDate: yesterdayStr, tags: ['family'] },
  { id: 't12', title: 'Read chapter 4 of Atomic Habits', status: 'doing', priority: 'low', dueDate: yesterdayStr, tags: ['reading'] },
];

export const mockHabits: Habit[] = [
  { id: 'h1', name: 'Meditate 10m', frequency: 'daily', streak: 5, logs: { '2026-03-09': true, '2026-03-08': true, '2026-03-07': true, '2026-03-06': true, '2026-03-05': true }, goalId: 'g1' },
  { id: 'h2', name: 'Read 20 pages', frequency: 'daily', streak: 12, logs: { '2026-03-09': true, '2026-03-08': true } },
  { id: 'h3', name: 'Drink 2L Water', frequency: 'daily', streak: 2, logs: { '2026-03-09': true, '2026-03-10': true } },
  { id: 'h4', name: 'Gym Workout', frequency: 'weekly', streak: 4, logs: { '2026-03-08': true, '2026-03-01': true } },
];

export const mockEvents: Event[] = [
  { id: 'e1', title: 'Team Sync', date: '2026-03-10', time: '10:00 AM', location: 'Google Meet', projectId: 'p1' },
  { id: 'e2', title: 'Dentist Appointment', date: '2026-03-11', time: '02:00 PM', location: 'Downtown Clinic' },
  { id: 'e3', title: 'Lunch with Sarah', date: '2026-03-12', time: '12:30 PM', location: 'Cafe Mocha' },
  { id: 'e4', title: 'Project Review', date: '2026-03-15', time: '03:00 PM', location: 'Conference Room A', projectId: 'p1' },
];

export const mockMoods: Mood[] = [
  { id: 'm1', type: 'good', intensity: 4, date: '2026-03-09' },
  { id: 'm2', type: 'rad', intensity: 5, date: '2026-03-08' },
  { id: 'm3', type: 'meh', intensity: 3, date: '2026-03-07' },
  { id: 'm4', type: 'bad', intensity: 2, date: '2026-03-06' },
];

export const mockJournal: JournalEntry[] = [
  { id: 'j1', title: 'Productive Monday', content: 'Got a lot done today. Feeling good about the upcoming launch. The team is really coming together.', date: '2026-03-09', moodId: 'm1', tags: ['work', 'reflection'] },
  { id: 'j2', title: 'Weekend Hike', content: 'Went to the mountains this weekend. The weather was perfect and it was great to disconnect from technology for a bit.', date: '2026-03-08', moodId: 'm2', tags: ['personal', 'nature'] },
  { id: 'j3', title: 'Feeling Stuck', content: 'Struggled with a bug for 4 hours today. Need to take a step back and look at it with fresh eyes tomorrow.', date: '2026-03-06', moodId: 'm4', tags: ['work', 'frustration'] },
];

export const mockIdeas: Idea[] = [
  { id: 'i1', title: 'App Idea: Habit Tracker for Pets', description: 'Track feeding, walking, and vet visits. Gamify it for kids.', tags: ['app', 'pets', 'startup'], createdAt: '2026-03-08' },
  { id: 'i2', title: 'Blog Post: The Future of AI in Productivity', description: 'Discuss how LLMs will change the way we manage tasks and knowledge.', tags: ['writing', 'ai'], createdAt: '2026-03-09' },
  { id: 'i3', title: 'Gift for Mom', description: 'Maybe a custom photo album or a spa day voucher.', tags: ['personal', 'gifts'], createdAt: '2026-03-10' },
];

export const mockNotes: Note[] = [
  { id: 'n1', title: 'Meeting Notes: Q2 Planning', content: 'Focus on user acquisition and retention. Key metrics: CAC, LTV, Churn rate. Action items: Hire new marketing lead, increase ad spend by 20%.', ideaIds: [], createdAt: '2026-03-09', status: 'in-progress', priority: 'high', progress: 50, assignee: 'Alice' },
  { id: 'n2', title: 'Book Summary: Atomic Habits', content: '1. Make it obvious. 2. Make it attractive. 3. Make it easy. 4. Make it satisfying. The aggregation of marginal gains is powerful.', ideaIds: [], createdAt: '2026-03-05', status: 'completed', priority: 'medium', progress: 100, assignee: 'Bob' },
  { id: 'n3', title: 'React Performance Tips', content: 'Use useMemo for expensive calculations. React.memo for component pureness. Avoid inline functions in render if passing to pure components.', ideaIds: [], createdAt: '2026-03-07', status: 'inbox', priority: 'low', progress: 0, assignee: 'Charlie' },
  { id: 'n4', title: 'Travel Itinerary: Japan', content: 'Days 1-4: Tokyo (Shibuya, Shinjuku, Asakusa). Days 5-7: Kyoto (Temples, Bamboo Forest). Days 8-10: Osaka (Food, Universal Studios).', ideaIds: [], createdAt: '2026-03-10', status: 'inbox', priority: 'medium', progress: 20, assignee: 'Alice' },
  { id: 'n5', title: 'Project Alpha: Roadmap', content: 'Phase 1: Research. Phase 2: Design. Phase 3: Development. Phase 4: Testing.', ideaIds: [], createdAt: '2026-03-11', status: 'in-progress', priority: 'high', progress: 75, assignee: 'Bob' },
  { id: 'n6', title: 'Grocery List', content: 'Milk, Eggs, Bread, Coffee, Apples, Bananas.', ideaIds: [], createdAt: '2026-03-12', status: 'inbox', priority: 'low', progress: 0, assignee: 'Charlie' },
  { id: 'n7', title: 'Workout Routine', content: 'Warm-up: 10 mins. Cardio: 30 mins. Strength: 45 mins. Cool-down: 10 mins.', ideaIds: [], createdAt: '2026-03-08', status: 'completed', priority: 'medium', progress: 100, assignee: 'Alice' },
];
