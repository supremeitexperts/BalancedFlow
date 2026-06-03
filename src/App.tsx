import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Activity, 
  FolderOpen, 
  Search, 
  Plus, 
  PlusCircle, 
  Trash2,
  X 
} from 'lucide-react';
import { Task, Habit, ActiveScreen, TaskStatus, TaskCategory, PrayerTimeslot, HabitFrequency } from './types';
import { INITIAL_TASKS, INITIAL_HABITS, CATEGORY_COLORS } from './initialData';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  collection 
} from 'firebase/firestore';

// Refactored Components imports
import PlannerView from './components/PlannerView';
import HabitSanctumView from './components/HabitSanctumView';
import GoalBacklogView from './components/GoalBacklogView';
import AddGoalModal from './components/AddGoalModal';
import AddHabitModal from './components/AddHabitModal';
import EveningRolloverModal from './components/EveningRolloverModal';
import SettingsModal from './components/SettingsModal';
import { TrashModal } from './components/TrashModal';
import TaskDetailSheet from './components/TaskDetailSheet';
import { useNotifications } from './hooks/useNotifications';

export default function App() {
  // Authentication & Loading States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core Data States (synced with Firestore)
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => {
    const saved = localStorage.getItem('bf_active_screen');
    return (saved as ActiveScreen) || 'planner';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showRollover, setShowRollover] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Location / Prayer Settings States
  const [userLocation, setUserLocation] = useState<string>('Newtown Square, PA, 19073');
  const [prayerMethod, setPrayerMethod] = useState<number>(2); // ISNA
  const [prayerSchool, setPrayerSchool] = useState<number>(1); // Hanafi
  const [computedPrayerTimes, setComputedPrayerTimes] = useState<Record<PrayerTimeslot, string>>({
    'Pre-Fajr': '4:30 AM',
    'Fajr': '5:30 AM',
    'Dhuhr': '1:00 PM',
    'Asr': '4:45 PM',
    'Maghrib': '8:15 PM',
    'Isha': '9:45 PM',
    'Night': '11:00 PM'
  });
  const [loadingPrayerTimes, setLoadingPrayerTimes] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Dialog and alignment helper states
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [addGoalPresetStatus, setAddGoalPresetStatus] = useState<TaskStatus | undefined>(undefined);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [profileRolloverDate, setProfileRolloverDate] = useState<string | undefined>(undefined);
  const [isAligning, setIsAligning] = useState(false);

  // Mount notification engine
  useNotifications({ tasks, habits, computedPrayerTimes, currentUser });

  // Sync Active Screen to LocalStorage purely for navigational state preservation
  useEffect(() => {
    localStorage.setItem('bf_active_screen', activeScreen);
  }, [activeScreen]);

  // Auth State Listener and Database Seeder on First Signup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          
          // Ensure user profile document exists in Firestore
          const userPath = `users/${user.uid}`;
          const userRef = doc(db, userPath);
          
          try {
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              const todayStr = new Date().toLocaleDateString('en-CA');
              // Write User Profile Meta Record
              await setDoc(userRef, {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                createdAt: new Date().toISOString(),
                lastRolloverDate: todayStr,
                location: "Newtown Square, PA, 19073",
                prayerMethod: 2,
                prayerSchool: 1
              });

              // Seed user's subcollections with the starter kit
              const seedTasksPromises = INITIAL_TASKS.map(async (t) => {
                const taskRef = doc(db, `users/${user.uid}/tasks/${t.id}`);
                await setDoc(taskRef, {
                  ...t,
                  createdAt: new Date().toISOString()
                });
              });

              const seedHabitsPromises = INITIAL_HABITS.map(async (h) => {
                const habitRef = doc(db, `users/${user.uid}/habits/${h.id}`);
                await setDoc(habitRef, h);
              });

              await Promise.all([...seedTasksPromises, ...seedHabitsPromises]);
            }
          } catch (error) {
            console.error("Firestore initialization error during auth:", error);
            // Non-blocking log to allow the application to still load the UI
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Auth state processed with error:", err);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Multi-device Firestore Snapshots
  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setHabits([]);
      return;
    }

    const tasksPath = `users/${currentUser.uid}/tasks`;
    const unsubscribeTasks = onSnapshot(
      collection(db, tasksPath),
      (snapshot) => {
        const loadedTasks: Task[] = [];
        const now = Date.now();
        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        
        snapshot.forEach((snapshotDoc) => {
          const task = snapshotDoc.data() as Task;
          if (task.deletedAt && now - task.deletedAt > SEVEN_DAYS_MS) {
            // Auto-clean up document via silent delete (fire and forget)
            deleteDoc(snapshotDoc.ref).catch(() => {});
          } else {
            loadedTasks.push(task);
          }
        });
        loadedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTasks(loadedTasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );

    const habitsPath = `users/${currentUser.uid}/habits`;
    const unsubscribeHabits = onSnapshot(
      collection(db, habitsPath),
      (snapshot) => {
        const loadedHabits: Habit[] = [];
        snapshot.forEach((snapshotDoc) => {
          loadedHabits.push(snapshotDoc.data() as Habit);
        });
        setHabits(loadedHabits);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, habitsPath);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [currentUser]);

  // Real-time Profile Snapshot to monitor last rollover date
  useEffect(() => {
    if (!currentUser) {
      setProfileRolloverDate(undefined);
      return;
    }

    const userPath = `users/${currentUser.uid}`;
    const userRef = doc(db, userPath);
    const unsubscribeUser = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfileRolloverDate(data.lastRolloverDate || '');
        if (data.location) setUserLocation(data.location);
        if (data.prayerMethod !== undefined) setPrayerMethod(Number(data.prayerMethod));
        if (data.prayerSchool !== undefined) setPrayerSchool(Number(data.prayerSchool));
      } else {
        setProfileRolloverDate(new Date().toLocaleDateString('en-CA'));
      }
    }, (error) => {
      console.error("User profile subscription error:", error);
      setProfileRolloverDate(new Date().toLocaleDateString('en-CA'));
    });

    return () => unsubscribeUser();
  }, [currentUser]);

  // Dynamic public Aladhan API prayer times loader
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const fetchPrayerTimes = async () => {
      setLoadingPrayerTimes(true);
      try {
        const url = `https://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(userLocation)}&method=${prayerMethod}&school=${prayerSchool}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch prayer times from Aladhan API");
        const json = await res.json();
        
        if (json && json.data && json.data.timings) {
          const t = json.data.timings;
          
          const formatTime12h = (time24: string) => {
            try {
              const [h, m] = time24.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m, 0, 0);
              return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } catch (err) {
              return time24;
            }
          };

          const addMinutes = (time24: string, mins: number) => {
            try {
              const [h, m] = time24.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m + mins, 0, 0);
              return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } catch (err) {
              return time24;
            }
          };

          const subtractMinutes = (time24: string, mins: number) => {
            try {
              const [h, m] = time24.split(':').map(Number);
              const date = new Date();
              date.setHours(h, m - mins, 0, 0);
              return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            } catch (err) {
              return time24;
            }
          };

          if (isMounted) {
            setComputedPrayerTimes({
              'Pre-Fajr': subtractMinutes(t.Fajr, 60),
              'Fajr': formatTime12h(t.Fajr),
              'Dhuhr': formatTime12h(t.Dhuhr),
              'Asr': formatTime12h(t.Asr),
              'Maghrib': formatTime12h(t.Maghrib),
              'Isha': formatTime12h(t.Isha),
              'Night': addMinutes(t.Isha, 90)
            });
          }
        }
      } catch (err) {
        console.error("Error setting prayer times, using default fallbacks:", err);
      } finally {
        if (isMounted) {
          setLoadingPrayerTimes(false);
        }
      }
    };

    fetchPrayerTimes();

    return () => {
      isMounted = false;
    };
  }, [currentUser, userLocation, prayerMethod, prayerSchool]);

  // Automated "Cron Rollover Alignment" trigger
  useEffect(() => {
    if (!currentUser || profileRolloverDate === undefined || habits.length === 0 || isAligning) return;

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    
    // Seed rollover date if it's currently missing
    if (!profileRolloverDate) {
      const userRef = doc(db, `users/${currentUser.uid}`);
      updateDoc(userRef, { lastRolloverDate: todayStr }).catch(console.error);
      return;
    }

    if (profileRolloverDate !== todayStr) {
      // Calculate elapsed days
      const lastDate = new Date(profileRolloverDate);
      const currentDate = new Date(todayStr);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        setIsAligning(true);
        alignDailyRollover(currentUser.uid, profileRolloverDate, habits)
          .finally(() => setIsAligning(false));
      }
    }
  }, [currentUser, profileRolloverDate, habits.length]);

  // Logic to execute automated cron daily shift
  const alignDailyRollover = async (userId: string, lastRolloverDate: string, habitsList: Habit[]) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const userRef = doc(db, `users/${userId}`);

    try {
      const lastDate = new Date(lastRolloverDate);
      const currentDate = new Date(todayStr);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return;

      const promises = habitsList.map(async (habit) => {
        let history = [...habit.history];
        if (history.length !== 30) {
          while (history.length < 30) history.push(false);
          if (history.length > 30) history = history.slice(history.length - 30);
        }

        const shiftCount = Math.min(30, diffDays);
        for (let i = 0; i < shiftCount; i++) {
          history.shift();
          history.push(false);
        }

        let newStreak = 0;
        let checkIdx = 28;
        while (checkIdx >= 0) {
          if (history[checkIdx]) {
            newStreak++;
            checkIdx--;
          } else {
            break;
          }
        }
        if (history[29]) {
          newStreak++;
        }

        const habitRef = doc(db, `users/${userId}/habits/${habit.id}`);
        await updateDoc(habitRef, {
          history,
          streak: newStreak
        });
      });

      await Promise.all(promises);
      await updateDoc(userRef, { lastRolloverDate: todayStr });
      console.log(`[Cron Alignment] Shifted habits history successfully by ${diffDays} days.`);
    } catch (err) {
      console.error("[Cron Alignment] Error during auto rollover shift:", err);
    }
  };

  // Auth Actions
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'auth/popup');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'auth/signout');
    }
  };

  // Create Goal Handler
  const handleCreateGoal = async (
    title: string, 
    desc: string, 
    category: TaskCategory, 
    status: TaskStatus
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const taskId = 't_' + Date.now();
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);

    const newTask: Task = {
      id: taskId,
      title,
      description: desc,
      status,
      category,
      completed: false,
      prayerTimeslot: status === 'today' ? 'Pre-Fajr' : null,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(taskRef, newTask);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, taskPath);
      return false;
    }
  };

  // Create Habit Handler
  const handleCreateHabit = async (name: string, frequency: HabitFrequency = 'daily', targetCount: number = 1): Promise<boolean> => {
    if (!currentUser) return false;

    const habitId = 'h_' + Date.now();
    const habitPath = `users/${currentUser.uid}/habits/${habitId}`;
    const habitRef = doc(db, habitPath);

    const newHabit: Habit = {
      id: habitId,
      name,
      streak: 0,
      history: Array(30).fill(false),
      frequency,
      targetCount,
      order: (habits.length + 1) * 10
    };

    try {
      await setDoc(habitRef, newHabit);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, habitPath);
      return false;
    }
  };

  const handleReorderHabits = async (updates: { id: string; order: number }[]) => {
    if (!currentUser) return;
    try {
      const promises = updates.map(async ({ id, order }) => {
        const habitPath = `users/${currentUser.uid}/habits/${id}`;
        const habitRef = doc(db, habitPath);
        await updateDoc(habitRef, { order });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Error reordering habits in Firestore:", error);
    }
  };

  // Delete Habit Handler
  const handleDeleteHabit = async (habitId: string) => {
    if (!currentUser) return;
    const habitPath = `users/${currentUser.uid}/habits/${habitId}`;
    try {
      await deleteDoc(doc(db, habitPath));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, habitPath);
    }
  };

  // Toggle habit completes for current day
  const toggleHabitToday = async (habitId: string) => {
    if (!currentUser) return;
    const habitPath = `users/${currentUser.uid}/habits/${habitId}`;
    const habitRef = doc(db, habitPath);
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const nextHistory = [...habit.history];
    const isCurrentlyCompleted = nextHistory[29];
    nextHistory[29] = !isCurrentlyCompleted;
    
    let nextStreak = habit.streak;
    if (!isCurrentlyCompleted) {
      nextStreak += 1;
    } else {
      nextStreak = Math.max(0, nextStreak - 1);
    }

    try {
      await updateDoc(habitRef, {
        history: nextHistory,
        streak: nextStreak
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, habitPath);
    }
  };

  // Drag and drop setup for Kanban columns
  const handleDrop = async (e: React.DragEvent | null, status: TaskStatus, manualTaskId?: string) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    const taskId = manualTaskId || (e ? e.dataTransfer.getData('text/plain') : '');
    if (taskId) {
      const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
      const taskRef = doc(db, taskPath);
      const prayerTimeslot = status === 'today' ? 'Pre-Fajr' : null;
      try {
        await updateDoc(taskRef, { status, prayerTimeslot });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
      }
    }
  };

  const moveTaskToTodaySlot = async (taskId: string, slot: PrayerTimeslot) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    try {
      await updateDoc(taskRef, {
        status: 'today',
        prayerTimeslot: slot
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const handleReorderTasks = async (updates: { id: string; order: number; prayerTimeslot?: PrayerTimeslot | null; status?: TaskStatus }[]) => {
    if (!currentUser) return;
    try {
      const promises = updates.map(async ({ id, order, prayerTimeslot, status }) => {
        const taskPath = `users/${currentUser.uid}/tasks/${id}`;
        const taskRef = doc(db, taskPath);
        const updateData: any = { order };
        if (prayerTimeslot !== undefined) {
          updateData.prayerTimeslot = prayerTimeslot;
        }
        if (status !== undefined) {
          updateData.status = status;
          if (status !== 'today') {
            updateData.prayerTimeslot = null;
          }
        }
        await updateDoc(taskRef, updateData);
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Error in batch reordering tasks:", error);
    }
  };

  const handleMoveTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    try {
      await updateDoc(taskRef, {
        status,
        prayerTimeslot: status === 'today' ? 'Pre-Fajr' : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const toggleTaskCompleted = async (taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    try {
      await updateDoc(taskRef, { completed: !task.completed });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const handleUpdateTaskDetail = async (updated: Task) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${updated.id}`;
    const taskRef = doc(db, taskPath);
    try {
      await setDoc(taskRef, updated);
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    try {
      await updateDoc(taskRef, { deletedAt: Date.now() });
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    try {
      await updateDoc(taskRef, { deletedAt: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, taskPath);
    }
  };

  const handlePermanentDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, taskPath));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, taskPath);
    }
  };

  // Evaluate Daily Rollover Commit
  const handleCommitRollover = async () => {
    if (!currentUser) return;

    if (reflectionText.trim()) {
      const journalId = 'ref_' + Date.now();
      const reflectionPath = `users/${currentUser.uid}/reflections/${journalId}`;
      const reflectionRef = doc(db, reflectionPath);
      
      try {
        await setDoc(reflectionRef, {
          id: journalId,
          text: reflectionText,
          date: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, reflectionPath);
      }
    }

    const todayTasksToShift = tasks.filter(t => t.status === 'today');
    const updatePromises = todayTasksToShift.map(async (t) => {
      const taskPath = `users/${currentUser.uid}/tasks/${t.id}`;
      const taskRef = doc(db, taskPath);
      try {
        if (t.completed) {
          await updateDoc(taskRef, {
            status: 'inbox',
            completed: true,
            prayerTimeslot: null
          });
        } else {
          await updateDoc(taskRef, {
            status: 'today',
            prayerTimeslot: 'Pre-Fajr'
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, taskPath);
      }
    });

    await Promise.all(updatePromises);
    setReflectionText('');
    setShowRollover(false);
    setActiveScreen('planner');
  };

  // Quick Action Inline Planner Add Submit Handler
  const handleQuickPlannerAddInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem('plannerTaskTitle') as HTMLInputElement;
    const slotSelect = form.elements.namedItem('plannerSlot') as HTMLSelectElement;
    const catSelect = form.elements.namedItem('plannerCategory') as HTMLSelectElement;
    
    if (!input || !input.value.trim()) return;

    const taskId = 't_fast_' + Date.now();
    const taskPath = `users/${currentUser.uid}/tasks/${taskId}`;
    const taskRef = doc(db, taskPath);
    const newTask: Task = {
      id: taskId,
      title: input.value,
      description: 'Fast scheduled task',
      status: 'today',
      category: catSelect.value as TaskCategory,
      completed: false,
      prayerTimeslot: slotSelect.value as PrayerTimeslot,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(taskRef, newTask);
      input.value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, taskPath);
    }
  };

  const activeTasks = tasks.filter(t => !t.deletedAt);
  // Compute Performance Metrics
  const todayTasks = activeTasks.filter(t => t.status === 'today');
  const totalTodayCount = todayTasks.length;
  const completedTodayCount = todayTasks.filter(t => t.completed).length;
  const plannerProgressPercent = totalTodayCount > 0 ? Math.round((completedTodayCount / totalTodayCount) * 100) : 0;

  // Consistency Score formula: percentage of completed nodes in all habits histories past 30 days
  const totalNodesCount = habits.length * 30;
  const completedNodesCount = habits.reduce((acc, h) => acc + h.history.filter(Boolean).length, 0);
  const consistencyScore = totalNodesCount > 0 ? Math.round((completedNodesCount / totalNodesCount) * 100) : 0;

  // Filter list results (Search query helper bounds)
  const filteredTasks = activeTasks.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  // Render authenticating screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-xl bg-[#163328] text-white flex items-center justify-center font-serif font-bold text-2xl leading-none animate-bounce">
            BF
          </div>
          <span className="font-display-title text-sm font-semibold tracking-tight text-[#163328] animate-pulse">
            Aligning your flow...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated Hub Landing Area
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4 py-12 font-sans selection:bg-[#adcebe] select-none">
        <div className="max-w-md w-full bg-white border border-[#E8E6E1] rounded-3xl p-8 md:p-10 shadow-sm flex flex-col items-center text-center gap-6 relative overflow-hidden transition-all duration-300">
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#eabe94]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#163328]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="size-16 rounded-2xl bg-[#163328] text-white flex items-center justify-center font-serif font-bold text-3xl leading-none shadow-md">
            BF
          </div>

          <div className="space-y-2">
            <h1 className="font-display-title text-3xl font-semibold tracking-tight text-[#163328]">
              Balanced Flow
            </h1>
            <p className="text-xs text-gray-500 font-medium px-4 leading-relaxed">
              A serene, cloud-synchronized space designed for mindful task cultivation, daily habit tracking, and distraction-free planning.
            </p>
          </div>

          <div className="w-full border-t border-[#E8E6E1]/60 my-2" />

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleSignIn}
              className="w-full bg-[#163328] hover:bg-[#2d4a3e] active:scale-[0.98] cursor-pointer text-white font-bold uppercase tracking-wider py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 text-xs"
            >
              <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Sign In with Google</span>
            </button>
            <p className="text-[10px] text-gray-400 font-medium">
              Synchronize your ambitions instantly across all devices.
            </p>
          </div>

          <div className="w-full bg-[#fcfbf9] border border-dashed border-[#E8E6E1]/80 rounded-xl p-4 flex flex-col gap-2.5 items-start text-left">
            <span className="text-[10px] font-bold text-[#81817e] uppercase tracking-wider">Features Include:</span>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="size-1.5 rounded-full bg-[#163328]" />
              <span>Real-time Multi-device Sync</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="size-1.5 rounded-full bg-[#163328]" />
              <span>Evening Rollover reflections & carrying over</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="size-1.5 rounded-full bg-[#163328]" />
              <span>Daily focus heatmap & streak metrics</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1C1C1A] antialiased select-none font-sans flex flex-col md:flex-row relative">
      
      {/* DESKTOP SIDE BAR */}
      <aside className="hidden md:flex flex-col w-[320px] bg-white border-r border-[#E8E6E1] shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="p-6 flex flex-col justify-between h-full">
          
          <div className="flex flex-col gap-8">
            {/* Logo area */}
            <div className="flex items-center gap-3 px-2 pt-2">
              <div className="size-7 rounded bg-[#163328] text-white flex items-center justify-center font-serif font-bold text-base leading-none">
                BF
              </div>
              <span className="font-display-title text-xl font-semibold tracking-tight text-[#163328]">
                Balanced Flow
              </span>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5">
              <button 
                onClick={() => { setActiveScreen('planner'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeScreen === 'planner' 
                    ? 'bg-[#163328] text-white font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Clock className="size-4 shrink-0" />
                <span className="text-sm">Today's Planner</span>
              </button>

              <button 
                onClick={() => { setActiveScreen('habits'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeScreen === 'habits' 
                    ? 'bg-[#163328] text-white font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Activity className="size-4 shrink-0" />
                <span className="text-sm">Habit Sanctum</span>
              </button>

              <button 
                onClick={() => { setActiveScreen('backlog'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeScreen === 'backlog' 
                    ? 'bg-[#163328] text-white font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FolderOpen className="size-4 shrink-0" />
                <span className="text-sm">Goal Backlog</span>
              </button>
              <button 
                onClick={() => setShowTrashModal(true)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer text-gray-600 hover:bg-gray-50`}
              >
                <Trash2 className="size-4 shrink-0" />
                <span className="text-sm border-b border-transparent">Trash</span>
                {tasks.filter(t => t.deletedAt).length > 0 && (
                  <span className="ml-auto bg-gray-100 text-gray-600 font-bold text-[10px] px-1.5 py-0.5 rounded-md">
                    {tasks.filter(t => t.deletedAt).length}
                  </span>
                )}
              </button>
            </nav>

            {/* Goal Library Section on Sidebar */}
            <div className="flex flex-col mt-4 pt-4 border-t border-gray-100">
              <div className="px-3 mb-3 flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Goal Library</h4>
                <button 
                  onClick={() => { 
                    setAddGoalPresetStatus('someday');
                    setShowAddGoalModal(true); 
                  }}
                  className="text-gray-400 hover:text-[#163328] cursor-pointer"
                  title="Create new goal"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <p className="px-3 text-[10px] font-bold text-[#8B8B88] uppercase tracking-wider mb-2">Long-Term Goals</p>
              
              <div className="flex flex-col gap-1.5">
                {activeTasks.filter(t => t.status === 'someday').slice(0, 4).map(goal => (
                  <div 
                    key={goal.id}
                    onClick={() => { setSelectedTask(goal); }}
                    className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg border-l-2 ml-1 h-9 transition-colors"
                    style={{ borderLeftColor: CATEGORY_COLORS[goal.category] || '#163328' }}
                  >
                    <p className="text-xs text-gray-800 font-medium truncate pr-2 pl-1 select-none">
                      {goal.title}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskToTodaySlot(goal.id, 'Pre-Fajr');
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[#8B8B88] hover:text-[#163328] transition-all cursor-pointer"
                      title="Schedule for Today"
                    >
                      <PlusCircle className="size-3.5" />
                    </button>
                  </div>
                ))}
                {activeTasks.filter(t => t.status === 'this-week').length === 0 && (
                  <p className="text-xs text-gray-400 italic px-3 py-1">No pending targets</p>
                )}
              </div>
            </div>
          </div>

          {/* User Profile Cloud Sync Card */}
          <div className="flex flex-col gap-2.5 p-3 bg-[#faf9f7] rounded-xl border border-gray-200/60 mb-3.5 shrink-0 mt-auto">
            <div className="flex items-center gap-2.5">
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  referrerPolicy="no-referrer"
                  className="size-7 rounded-full border border-gray-150 object-cover" 
                  alt="User Avatar"
                />
              ) : (
                <div className="size-7 rounded-full bg-[#163328] text-white font-serif font-bold flex items-center justify-center text-xs">
                  {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate leading-tight flex items-center gap-1">
                  {currentUser.displayName || 'Cloud Pilot'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-[#795835] font-bold uppercase tracking-wider block">
                    Cloud Synced
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full bg-white hover:bg-red-50 text-[10px] font-bold text-gray-400 hover:text-red-500 border border-gray-200 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sign Out Hub
            </button>
          </div>

          {/* Daily Progress Progress Bar */}
          <div className="flex flex-col gap-3 p-3.5 bg-[#f4f3f1] rounded-xl border border-gray-200 shrink-0">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Daily Progress</p>
              <p className="text-[#163328] text-xs font-bold">{plannerProgressPercent}%</p>
            </div>
            <div className="rounded-full bg-gray-200 h-1.5 w-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-[#163328] transition-all duration-500" 
                style={{ width: `${plannerProgressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-[#8B8B88] text-center font-medium">
              {completedTodayCount} of {totalTodayCount} tasks accomplished
            </p>
          </div>

        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden w-full sticky top-0 bg-white border-b border-[#E8E6E1] flex justify-between items-center px-4 py-3.5 z-40">
        <div className="flex items-center gap-3">
          <div className="size-6 rounded bg-[#163328] text-white flex items-center justify-center font-serif font-bold text-xs">
            BF
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold bg-[#faf9f7] border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full capitalize">
            {activeScreen === 'planner' ? 'Planner' : activeScreen === 'habits' ? 'Habits' : 'Backlog'}
          </span>
          {currentUser.photoURL ? (
            <img 
              alt="Profile Avatar" 
              className="w-7 h-7 rounded-full object-cover border border-gray-200 cursor-pointer" 
              referrerPolicy="no-referrer"
              src={currentUser.photoURL}
              onClick={() => setShowSettingsModal(true)}
              title="Settings"
            />
          ) : (
            <div 
              className="size-7 rounded-full bg-[#163328] text-white font-serif font-bold flex items-center justify-center text-xs cursor-pointer"
              onClick={() => setShowSettingsModal(true)}
              title="Settings"
            >
              {currentUser.displayName?.[0] || 'U'}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col h-auto md:h-screen overflow-y-auto">
        
        {/* Search header bars */}
        {activeScreen !== 'planner' && (
          <div className="sticky top-0 bg-[#F9F8F6]/90 backdrop-blur-md z-30 px-4 md:px-10 py-3.5 border-b border-gray-100 flex items-center justify-between gap-4">
            {activeScreen === 'habits' ? (
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search habits..."
                  className="w-full bg-white border border-[#E8E6E1] rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-[#163328] transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-650 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {activeScreen === 'backlog' && (
              <button 
                onClick={() => { 
                  setAddGoalPresetStatus('inbox'); // Backlog view "New Goal" defaults to Inbox
                  setShowAddGoalModal(true); 
                }}
                className="bg-[#163328] text-white hover:bg-[#2d4a3e] active:scale-95 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>New Goal</span>
              </button>
            )}

            {activeScreen === 'habits' && (
              <button 
                onClick={() => { setShowAddHabitModal(true); }}
                className="bg-[#163328] text-white hover:bg-[#2d4a3e] active:scale-95 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>New Habit</span>
              </button>
            )}
          </div>
        )}

        {/* Dynamic Display Screens inside AnimatePresence */}
        <AnimatePresence mode="wait">
          {activeScreen === 'planner' && (
            <PlannerView 
              todayTasks={todayTasks}
              allTasks={activeTasks}
              plannerProgressPercent={plannerProgressPercent}
              completedTodayCount={completedTodayCount}
              totalTodayCount={totalTodayCount}
              toggleTaskCompleted={toggleTaskCompleted}
              setSelectedTask={setSelectedTask}
              setActiveScreen={setActiveScreen}
              handleDeleteTask={handleDeleteTask}
              setShowRollover={setShowRollover}
              handleQuickPlannerAddInput={handleQuickPlannerAddInput}
              moveTaskToTodaySlot={moveTaskToTodaySlot}
              handleCreateGoal={handleCreateGoal}
              computedPrayerTimes={computedPrayerTimes}
              loadingPrayerTimes={loadingPrayerTimes}
              userLocation={userLocation}
              onOpenSettings={() => setShowSettingsModal(true)}
              handleReorderTasks={handleReorderTasks}
            />
          )}

          {activeScreen === 'habits' && (
            <HabitSanctumView 
              habits={habits}
              searchTerm={searchTerm}
              consistencyScore={consistencyScore}
              toggleHabitToday={toggleHabitToday}
              handleDeleteHabit={handleDeleteHabit}
              handleReorderHabits={handleReorderHabits}
            />
          )}

          {activeScreen === 'backlog' && (
            <GoalBacklogView 
              filteredTasks={filteredTasks}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
              moveTaskToTodaySlot={moveTaskToTodaySlot}
              handleDrop={handleDrop}
              handleUpdateTaskDetail={handleUpdateTaskDetail}
              handleDeleteTask={handleDeleteTask}
              onCreateGoal={handleCreateGoal}
              handleReorderTasks={handleReorderTasks}
            />
          )}
        </AnimatePresence>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-45 bg-white border-t border-[#E8E6E1] py-2 px-3 flex justify-around items-center shadow-lg rounded-t-xl shrink-0">
        <button 
          onClick={() => { setActiveScreen('planner'); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg flex-1 ${
            activeScreen === 'planner' ? 'text-[#163328] font-bold' : 'text-gray-400'
          }`}
        >
          <Clock className="size-5" />
          <span className="text-[10px] mt-0.5">Daily</span>
        </button>

        <button 
          onClick={() => { setActiveScreen('habits'); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg flex-1 ${
            activeScreen === 'habits' ? 'text-[#163328] font-bold' : 'text-gray-400'
          }`}
        >
          <Activity className="size-5" />
          <span className="text-[10px] mt-0.5">Habits</span>
        </button>

        <button 
          onClick={() => { setActiveScreen('backlog'); }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg flex-1 ${
            activeScreen === 'backlog' ? 'text-[#163328] font-bold' : 'text-gray-400'
          }`}
        >
          <FolderOpen className="size-5" />
          <span className="text-[10px] mt-0.5">Goals</span>
        </button>
      </nav>

      {/* EVENING ROLLOVER FULL-SCREEN MODAL */}
      <AnimatePresence>
        {showRollover && (
          <EveningRolloverModal 
            isOpen={showRollover}
            onClose={() => setShowRollover(false)}
            todayTasks={todayTasks}
            reflectionText={reflectionText}
            setReflectionText={setReflectionText}
            moveTaskToTodaySlot={moveTaskToTodaySlot}
            handleMoveTaskStatus={handleMoveTaskStatus}
            handleDeleteTask={handleDeleteTask}
            handleCommitRollover={handleCommitRollover}
          />
        )}
      </AnimatePresence>

      {/* MODAL DIALOGS */}
      <AnimatePresence>
        {showAddGoalModal && (
          <AddGoalModal 
            isOpen={showAddGoalModal}
            onClose={() => {
              setShowAddGoalModal(false);
              setAddGoalPresetStatus(undefined);
            }}
            onCreateGoal={handleCreateGoal}
            fixedStatus={addGoalPresetStatus}
          />
        )}

        {showAddHabitModal && (
          <AddHabitModal 
            isOpen={showAddHabitModal}
            onClose={() => setShowAddHabitModal(false)}
            onCreateHabit={handleCreateHabit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrashModal && (
          <TrashModal 
            isOpen={showTrashModal}
            onClose={() => setShowTrashModal(false)}
            deletedTasks={tasks.filter(t => t.deletedAt)}
            onRestore={handleRestoreTask}
            onPermanentDelete={handlePermanentDeleteTask}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && currentUser && (
          <SettingsModal 
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            userId={currentUser.uid}
            currentLocation={userLocation}
            currentMethod={prayerMethod}
            currentSchool={prayerSchool}
            tasks={tasks}
            habits={habits}
            onSignOut={handleSignOut}
          />
        )}
      </AnimatePresence>

      {selectedTask && (
        <TaskDetailSheet 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTaskDetail}
          onDelete={handleDeleteTask}
        />
      )}

    </div>
  );
}
