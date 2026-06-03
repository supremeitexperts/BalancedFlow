import { useEffect, useRef, useState } from 'react';
import { Task, Habit, PrayerTimeslot } from '../types';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

// Helper to construct native date for scheduling (today or tomorrow)
function getScheduleDate(timeStr: string, isTomorrow: boolean): Date | null {
  if (!timeStr) return null;
  const StringVal = timeStr.toString();
  const match = StringVal.trim().match(/^(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const targetDate = new Date();
  if (isTomorrow) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
}

// Ensure a safe notification channel is defined with maximal properties (screen heads-up & vibrations)
async function createNotificationChannel() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'balanced-flow-notifications',
      name: 'Balanced Flow Notifications',
      description: 'Notifications for prayer timeslots, scheduled goals, and habit reminders.',
      importance: 5, // IMPORTANCE_HIGH (banner + Sound + Vibration)
      visibility: 1, // VISIBILITY_PUBLIC (shows on lockscreen completely)
      sound: 'default',
      vibration: true,
    });
  } catch (err) {
    console.warn("Failed to create notification channel", err);
  }
}

// Harmonizes static checklists with OS Scheduled Alarms
async function syncNativeNotificationSchedule(
  tasks: Task[],
  habits: Habit[],
  computedPrayerTimes: Record<PrayerTimeslot, string>
) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await createNotificationChannel();

    // Prepare list of IDs of existing alarms to cancel/overwrite safely
    const idsToCancel = [];
    for (let index = 0; index < PRAYER_SLOTS.length; index++) {
      idsToCancel.push({ id: 100 + index }); // Today prayer slot index
      idsToCancel.push({ id: 200 + index }); // Tomorrow prayer slot index
    }
    idsToCancel.push({ id: 300 }); // Today habits
    idsToCancel.push({ id: 301 }); // Tomorrow habits

    try {
      await LocalNotifications.cancel({ notifications: idsToCancel });
    } catch (_) {
      // Ignored if none were previously registered
    }

    const notificationsToSchedule: any[] = [];

    // 1. Compile Prayer times slots notifications
    PRAYER_SLOTS.forEach((slot, index) => {
      const timeStr = computedPrayerTimes[slot];
      if (!timeStr) return;

      const relevantTasks = tasks.filter(t => {
        if (t.status !== 'today' || t.completed) return false;
        if (!t.prayerTimeslot) return false;
        const taskSlotIdx = PRAYER_SLOTS.indexOf(t.prayerTimeslot);
        return taskSlotIdx <= index;
      });

      if (relevantTasks.length === 0) return; // Skip scheduling if there are no tasks in this block

      const overdueTasks = relevantTasks.filter(t => t.prayerTimeslot && PRAYER_SLOTS.indexOf(t.prayerTimeslot as any) < index);
      const currentTasks = relevantTasks.filter(t => t.prayerTimeslot && PRAYER_SLOTS.indexOf(t.prayerTimeslot as any) === index);

      let bodyStr = `Time for ${slot} block!`;
      if (currentTasks.length > 0) {
        bodyStr += `\nTasks scheduled:\n` + currentTasks.map(t => `• ${t.title}`).join('\n');
      } else {
        bodyStr += `\nNo actions scheduled specifically for this block.`;
      }
      if (overdueTasks.length > 0) {
        bodyStr += `\n\n⚠️ Incomplete from previous blocks:\n` + overdueTasks.map(t => `• ${t.title} (${t.prayerTimeslot})`).join('\n');
      }

      // Schedule for Today if targeted hour-minute remains in the absolute future
      const todayDate = getScheduleDate(timeStr, false);
      if (todayDate && todayDate.getTime() > Date.now()) {
        notificationsToSchedule.push({
          id: 100 + index,
          title: `Focus block: ${slot}`,
          body: bodyStr,
          channelId: 'balanced-flow-notifications',
          schedule: { at: todayDate },
        });
      }

      // Schedule for Tomorrow
      const tomorrowDate = getScheduleDate(timeStr, true);
      if (tomorrowDate) {
        notificationsToSchedule.push({
          id: 200 + index,
          title: `Focus block: ${slot}`,
          body: bodyStr,
          channelId: 'balanced-flow-notifications',
          schedule: { at: tomorrowDate },
        });
      }
    });

    // 2. Compile Habits reminder status notifications
    const incompleteHabits = habits.filter(h => !h.history[29]);
    if (incompleteHabits.length > 0) {
      const listStr = incompleteHabits.map(h => `• ${h.name}`).join('\n');
      const bodyStr = `You still have ${incompleteHabits.length} outstanding daily habits to cultivate:\n${listStr}`;

      const todayHabitDate = new Date();
      todayHabitDate.setHours(17, 50, 0, 0); // 5:50 PM
      if (todayHabitDate.getTime() > Date.now()) {
        notificationsToSchedule.push({
          id: 300,
          title: 'Evening Habits Reminder',
          body: bodyStr,
          channelId: 'balanced-flow-notifications',
          schedule: { at: todayHabitDate },
        });
      }

      const tomorrowHabitDate = new Date();
      tomorrowHabitDate.setDate(tomorrowHabitDate.getDate() + 1);
      tomorrowHabitDate.setHours(17, 50, 0, 0);
      notificationsToSchedule.push({
        id: 301,
        title: 'Evening Habits Reminder',
        body: bodyStr,
        channelId: 'balanced-flow-notifications',
        schedule: { at: tomorrowHabitDate },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule,
      });
      console.log(`[Capacitor Native Sync] Standard OS scheduled alarms synced. Count: ${notificationsToSchedule.length}`);
    }
  } catch (err) {
    console.warn("Error synchronizing native notification schedule:", err);
  }
}

// Global helper to fire desktop or service-worker notifications on mobile safely
export async function showNotificationHelper(title: string, options: NotificationOptions) {
  if (Capacitor.isNativePlatform()) {
    try {
      await createNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: options.body || '',
            id: Date.now() + Math.floor(Math.random() * 1000), // Random ID
            schedule: { at: new Date(Date.now() + 100) }, // Trigger almost immediately
            channelId: 'balanced-flow-notifications',
          }
        ]
      });
    } catch (err) {
      console.warn("Capacitor notification error", err);
    }
    return;
  }

  // Web Fallback (Android browsers like Chrome/Edge REQUIRE ServiceWorker registration to trigger notifications)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, options);
        console.log("[ServiceWorker showNotification] Success");
        return;
      }
    } catch (swErr) {
      console.warn("[ServiceWorker showNotification] ready registration failed", swErr);
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations && registrations.length > 0) {
        await registrations[0].showNotification(title, options);
        console.log("[ServiceWorker showNotification] Success via getRegistrations[0]");
        return;
      }
    } catch (regErr) {
      console.warn("[ServiceWorker showNotification] getRegistrations fallback failed", regErr);
    }
  }

  // Standard window Notification constructor fallback (typically works on Desktop)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new window.Notification(title, options);
      console.log("[Window Notification] Success");
    } catch (e) {
      console.warn("[Window Notification] Constructor failed (expected on modern mobile browsers)", e);
    }
  } else {
    console.warn("Notifications not fully supported/allowed in this context.");
  }
}

// Resilient Background / Time-delayed Test Trigger
export async function triggerScheduledNotificationTest(delaySeconds: number, title: string, body: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return false;
      await createNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title,
            body: body,
            id: 8888,
            schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
            channelId: 'balanced-flow-notifications',
          }
        ]
      });
      return true;
    } catch (err) {
      console.error("[Native Schedule] failed", err);
      return false;
    }
  }

  // Request permissions if not granted
  if ('Notification' in window && Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  // Web: If we delay, try posting to Service Worker (running as a persistent thread)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.active) {
        // Post message to the active service worker to use SW background timer
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION_TEST',
          delaySeconds,
          title,
          body
        });
        console.log("[ServiceWorker] Dispatched SCHEDULE_NOTIFICATION_TEST successfully with delay:", delaySeconds);
        return true;
      }
    } catch (swErr) {
      console.warn("[ServiceWorker] Failed to postMessage, fallback to setTimeout", swErr);
    }
  }

  // Client-side setTimeout fallback
  setTimeout(async () => {
    await showNotificationHelper(title, {
      body: body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-scheduled-notification'
    });
  }, delaySeconds * 1000);

  return true;
}

// Manual Test Notification Trigger
export async function triggerNotificationTest(tasks: Task[], habits: Habit[]) {
  if (Capacitor.isNativePlatform()) {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      alert("Notification permission denied. Please allow notifications in system settings.");
      return;
    }
  } else {
    if (!('Notification' in window)) {
      alert("Web Notifications are not supported in this browser.");
      return;
    }
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Notification permission denied. Please allow notifications in your site settings first.");
        return;
      }
    }
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

  runSimulatedNotifications();
}

export function useNotifications({ tasks, habits, computedPrayerTimes, currentUser }: NotificationEngineProps) {
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);

  useEffect(() => {
    const initPerms = async () => {
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === 'granted') {
          setIsNotifEnabled(true);
        } else if (perm.display === 'prompt') {
          const req = await LocalNotifications.requestPermissions();
          setIsNotifEnabled(req.display === 'granted');
        }
      } else {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            setIsNotifEnabled(true);
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              setIsNotifEnabled(permission === 'granted');
            });
          }
        }
      }
    };
    initPerms();
  }, []);

  // Sync Native Alarms when tasks, habits, or timeslot configs change
  useEffect(() => {
    if (!currentUser || !isNotifEnabled) return;
    if (Capacitor.isNativePlatform()) {
      syncNativeNotificationSchedule(tasks, habits, computedPrayerTimes);
    }
  }, [tasks, habits, computedPrayerTimes, currentUser, isNotifEnabled]);

  useEffect(() => {
    if (!currentUser) return;
    if (Capacitor.isNativePlatform()) {
      // Background notifications are pre-scheduled natively above. Bypass setInterval completely for native.
      return;
    }

    // Check intervals every 30s as a fallback strictly on Web
    const intervalId = setInterval(() => {
      if (!isNotifEnabled) return;

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
            const relevantTasks = tasks.filter(t => {
              if (t.status !== 'today' || t.completed) return false;
              if (!t.prayerTimeslot) return false;
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
  }, [tasks, habits, computedPrayerTimes, currentUser, isNotifEnabled]);
}
