import { Task, Habit } from './types';

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Morning Routine & Stretching',
    description: 'A light session of dynamic stretches and mindful movement to wake up the body.',
    status: 'today',
    category: 'Wellness',
    timeEstimated: '15 mins',
    completed: true,
    prayerTimeslot: 'Pre-Fajr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    title: "Review yesterday's notes",
    description: 'Quick check of yesterday\'s highlights and any carry-over action items.',
    status: 'today',
    category: 'Admin',
    completed: true,
    prayerTimeslot: 'Pre-Fajr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't3',
    title: 'Morning Supplications',
    description: 'Essential morning dhikr and intentions set with mindfulness.',
    status: 'today',
    category: 'Spiritual',
    timeEstimated: '15 mins',
    completed: true,
    prayerTimeslot: 'Fajr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't4',
    title: 'Journaling & Intentions',
    description: 'Brain dump, standard journaling, and focus goal setting.',
    status: 'today',
    category: 'Personal',
    completed: false,
    prayerTimeslot: 'Fajr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't5',
    title: 'Deep Work: Q3 Strategy Document',
    description: 'Draft the key strategies focusing on product expansion and team dynamics.',
    status: 'today',
    category: 'Work',
    timeEstimated: '90 mins',
    completed: false,
    prayerTimeslot: 'Fajr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't6',
    title: 'Deep Work Session: Project Alpha',
    description: 'Focussed milestone updates and code changes for the preview launch.',
    status: 'today',
    category: 'Work',
    timeEstimated: '90 mins',
    completed: false,
    prayerTimeslot: 'Dhuhr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't7',
    title: 'Team Sync & Blockers check',
    description: 'Short meeting with core developers and engineering leads.',
    status: 'today',
    category: 'Personal',
    completed: false,
    prayerTimeslot: 'Dhuhr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't8',
    title: 'Family Walk',
    description: 'Time outside offline to enjoy a casual stroll and screen break.',
    status: 'today',
    category: 'Wellness',
    timeEstimated: '30 mins',
    completed: false,
    prayerTimeslot: 'Asr',
    createdAt: new Date().toISOString()
  },
  {
    id: 't9',
    title: 'Dinner & Unwind',
    description: 'Simple healthy meal and relaxation transition offline.',
    status: 'today',
    category: 'Wellness',
    completed: false,
    prayerTimeslot: 'Maghrib',
    createdAt: new Date().toISOString()
  },
  {
    id: 't10',
    title: 'Reading',
    description: 'Chapter 4 of current read on system designs or philosophy.',
    status: 'today',
    category: 'Rest',
    timeEstimated: 'Chapter 4',
    completed: false,
    prayerTimeslot: 'Isha',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b1',
    title: 'Read "Atomic Habits"',
    description: 'Need to extract key frameworks for building better daily routines and apply them to the sanctum workflow.',
    status: 'inbox',
    category: 'Personal',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    title: 'Complete Project Proposal',
    description: 'Draft the initial outline for the Q3 initiative focusing on user retention and core onboarding flow improvements.',
    status: 'inbox',
    category: 'Work',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b3',
    title: 'Memorize Surah Al-Mulk',
    description: 'Break down into 3-ayah segments per day after Fajr prayer.',
    status: 'inbox',
    category: 'Spiritual',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'b4',
    title: 'Launch Beta V1',
    description: 'Finalize the core loop testing with the initial 50 users and gather feedback via Typeform.',
    status: 'this-month',
    category: 'Milestone',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'l1',
    title: 'Finalize Q3 Marketing Brief',
    description: 'Align targets with marketing partners for the Q3 release.',
    status: 'inbox',
    category: 'Work',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'l2',
    title: 'Review Team Performance',
    description: 'Compile feedback from peer evaluations for review cycle.',
    status: 'inbox',
    category: 'Work',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'l3',
    title: 'Client Sync: Alpha Project',
    description: 'Regular check-in about current milestones and roadmap updates.',
    status: 'inbox',
    category: 'Admin',
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'l4',
    title: 'Draft Newsletter Copy',
    description: 'Write the copy for the upcoming monthly brand wrap-up email.',
    status: 'inbox',
    category: 'Personal',
    completed: false,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_HABITS: Habit[] = [
  {
    id: 'h1',
    name: 'Morning Stillness',
    streak: 14,
    // length of 30, last element true/false toggles for today
    history: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
  },
  {
    id: 'h2',
    name: 'Deep Reading',
    streak: 3,
    history: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, true, true, false, false, false, true, true, false, true, true, false]
  },
  {
    id: 'h3',
    name: 'Evening Reflection',
    streak: 0,
    history: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false]
  }
];

export const CATEGORY_COLORS: Record<string, string> = {
  Work: '#2d4a3e', // Deep Sage
  Spiritual: '#795835', // Warm Gold/Secondary
  Admin: '#8B8B88', // Grey/Neutral
  Personal: '#D1A77E', // Accent Gold
  Milestone: '#476558', // Light Sage
  Growth: '#19b373', // Emerald/Growth
  Wellness: '#163328', // Dark Forest
  Rest: '#a5bda3', // Soft green rest
};
