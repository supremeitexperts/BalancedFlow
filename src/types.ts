export type TaskCategory = 'Work' | 'Spiritual' | 'Admin' | 'Personal' | 'Milestone' | 'Growth' | 'Wellness' | 'Rest';

export type TaskStatus = 'inbox' | 'this-week' | 'this-month' | 'someday' | 'today';

export type PrayerTimeslot = 'Pre-Fajr' | 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Night';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  timeEstimated?: string;
  completed: boolean;
  prayerTimeslot?: PrayerTimeslot | null;
  createdAt: string;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: boolean[]; // array of 30 booleans representing last 30 days. Index 29 is today.
  frequency?: HabitFrequency;
  targetCount?: number; // e.g. 2 times per week
}

export type ActiveScreen = 'planner' | 'habits' | 'backlog';
