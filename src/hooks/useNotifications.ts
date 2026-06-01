import { useEffect, useRef } from 'react';
import { Task, Habit, PrayerTimeslot } from '../types';

const PRAYER_SLOTS: PrayerTimeslot[] = ['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Night'];

interface NotificationEngineProps {
  tasks: Task[];
  habits: Habit[];
  computedPrayerTimes: Record<PrayerTimeslot, string>;
  currentUser: any;
}

// Helper to convert "1:00 PM" to minutes since midnight for easy comparison
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const StringVal = timeStr.toString();
  const match = StringVal.trim().match(/^(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Global helper to fire desktop or service-worker notifications on mobile safely
export function showNotificationHelper(title: string, options: NotificationOptions) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, options);
    }).catch((err) => {
      console.warn("Service worker registry fallback to window.Notification", err);
      if ('Notification' in window && Notification.permission === 'granted') {
        new window.Notification(title, options);
      }
    });
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new window.Notification(title, options);
  } else {
    console.warn("Notifications not fully supported/allowed in this context.");
  }
}

// Manual Test Notification Trigger
export function triggerNotificationTest(tasks: Task[], habits: Habit[]) {
  if (!('Notification' in window)) {
    alert("Web Notifications are not supported in this browser.");
    return;
  }

  const runSimulatedNotifications = () => {
    // 1. Simulating Fajr prayer block start with custom tasks
    const curHabits = habits.length > 0 ? habits : [
      { id: 'h1', name: 'Morning Tahajjud', streak: 5, history: Array(30).fill(false) },
      { id: 'h2', name: 'Reflective Journaling', streak: 12, history: Array(30).fill(false) }
    ];

    const currentBlock: PrayerTimeslot = 'Fajr';
    
    // Simulate some uncompleted tasks
    const dummyTaskCurrent = { id: 'dt1', title: 'Recite Morning Adhkar', completed: false, prayerTimeslot: 'Fajr', status: 'today' };
    const dummyTaskOverdue = { id: 'dt2', title: 'Pre-Fajr Quran Study', completed: false, prayerTimeslot: 'Pre-Fajr', status: 'today' };

    let bodyStr = `Time for ${currentBlock} block! You have 1 task scheduled:\n• ${dummyTaskCurrent.title}`;
    bodyStr += `\n\n⚠️ Plus 1 incomplete task from previous block:\n• ${dummyTaskOverdue.title}`;

    showNotificationHelper(`[TEST] Focus block: ${currentBlock}`, {
      body: bodyStr,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-prayer-notification'
    });

    // 2. Simulating Evening habits reminder block
    setTimeout(() => {
      const incompleteHabits = curHabits.filter(h => !h.history[29]);
      const habitCount = incompleteHabits.length;
      
      let bodyHabitsStr = "";
      if (habitCount > 0) {
        const listStr = incompleteHabits.map(h => `• ${h.name}`).slice(0, 5).join('\n');
        bodyHabitsStr = `You still have ${habitCount} outstanding habit(s) to cultivate:\n${listStr}`;
      } else {
        bodyHabitsStr = `Excellent work! All of your daily habits are cultivated for today.`;
      }

      showNotificationHelper("[TEST] Evening Habits Reminder", {
        body: bodyHabitsStr,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'test-habits-notification'
      });
    }, 1500);
  };

  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        runSimulatedNotifications();
      } else {
        alert("Notification permission denied. Please allow notifications in your site settings first.");
      }
    });
  } else {
    runSimulatedNotifications();
  }
}

export function useNotifications({ tasks, habits, computedPrayerTimes, currentUser }: NotificationEngineProps) {
  const isEnabled = useRef(false);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        isEnabled.current = true;
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          isEnabled.current = permission === 'granted';
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Check intervals every minute
    const intervalId = setInterval(() => {
      if (!isEnabled.current) return;

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const dateKey = now.toISOString().split('T')[0];

      // 1. Prayer Time Notifications
      PRAYER_SLOTS.forEach((slot, index) => {
        const timeStr = computedPrayerTimes[slot];
        if (!timeStr) return;
        
        const slotMinutes = parseTimeToMinutes(timeStr);
        
        // Match current time to prayer slot within 1 minute
        if (currentMinutes === slotMinutes || currentMinutes === slotMinutes + 1) {
          const notifiedKey = `notified_prayer_${dateKey}_${slot}`;
          if (!localStorage.getItem(notifiedKey)) {
            localStorage.setItem(notifiedKey, 'true');

            // Find tasks relevant to this notification
            // Relevant bounds = any active task for TODAY that is incomplete and its timeslot <= current slot
            const relevantTasks = tasks.filter(t => {
              if (t.status !== 'today' || t.completed) return false;
              if (!t.prayerTimeslot) return false; // Must belong to a prayer timeslot to be matched in the block
              const taskSlotIdx = PRAYER_SLOTS.indexOf(t.prayerTimeslot);
              return taskSlotIdx <= index;
            });

            if (relevantTasks.length > 0) {
              const overdueTasks = relevantTasks.filter(t => t.prayerTimeslot && PRAYER_SLOTS.indexOf(t.prayerTimeslot as any) < index);
              const currentTasks = relevantTasks.filter(t => t.prayerTimeslot && PRAYER_SLOTS.indexOf(t.prayerTimeslot as any) === index);
              
              let bodyStr = `Time for ${slot} block!`;
              if (currentTasks.length > 0) {
                const currentList = currentTasks.map(t => `• ${t.title}`).join('\n');
                bodyStr += `\nTasks scheduled for this block:\n${currentList}`;
              } else {
                bodyStr += `\nNo tasks scheduled specifically for this block.`;
              }

              if (overdueTasks.length > 0) {
                const overdueList = overdueTasks.map(t => `• ${t.title} (${t.prayerTimeslot})`).join('\n');
                bodyStr += `\n\n⚠️ Incomplete from previous blocks:\n${overdueList}`;
              }

              showNotificationHelper(`Focus block: ${slot}`, {
                body: bodyStr,
                icon: '/icon-192.png',
                badge: '/icon-192.png'
              });
            }
          }
        }
      });

      // 2. Evening Habits Notification at 5:50 PM (17:50)
      const HABIT_REMINDER_MINUTES = 17 * 60 + 50; // 17:50
      if (currentMinutes === HABIT_REMINDER_MINUTES || currentMinutes === HABIT_REMINDER_MINUTES + 1) {
        const notifiedKey = `notified_habits_${dateKey}`;
        if (!localStorage.getItem(notifiedKey)) {
          localStorage.setItem(notifiedKey, 'true');

          const incompleteHabits = habits.filter(h => !h.history[29]);
          if (incompleteHabits.length > 0) {
            const listStr = incompleteHabits.map(h => `• ${h.name}`).join('\n');
            const bodyStr = `You still have ${incompleteHabits.length} outstanding habit(s) to cultivate:\n${listStr}`;

            showNotificationHelper("Evening Habits Reminder", {
              body: bodyStr,
              icon: '/icon-192.png',
              badge: '/icon-192.png'
            });
          }
        }
      }

    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [tasks, habits, computedPrayerTimes, currentUser]);
}
