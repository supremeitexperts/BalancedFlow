# Balanced Flow - Mobile App Specification

## Overview
Balanced Flow is a spiritual and productivity daily planner designed to align task management and habit tracking with daily prayer times.

## Core Features

### 1. Authentication & Sync
- **Firebase Authentication**: Google Sign-In and Email authentication.
- **Cloud Sync**: Real-time syncing with Firebase Firestore database.
- **Offline Support**: The app should cache data and allow offline edits that sync upon reconnection.

### 2. Task Management & Goal Library (Kanban)
- **Goal Library Backlog**: A visual board to manage unscheduled ambitions.
- **Statuses**: Inbox, This Week, This Month, Someday, and "Today" (Active).
- **Interactions**: Drag-and-drop support to move tasks between statuses or into specific daily timeslots.

### 3. Daily Planner (Prayer-Based Timeslots)
- **Timeslots**: Organizes daily focus into blocks matching Islamic prayer times `['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']`.
- **Drag & Drop**: Users can drag items from the backlog directly into specific prayer slots.

### 4. Habit Tracking
- **Habits System**: Yes/No daily habits (e.g., "Read Quran", "Exercise").
- **Habit Streak & Progress**: Visual toggles that save completion status for the current day.

### 5. Evening Rollover & Journaling
- **End of Day Flow**: A modal wizard that triggers at the end of the day.
- **Journaling**: A text reflection area to capture thoughts on the day before closing it out.
- **Rollover**: Users can select which incomplete tasks from "Today" to carry over to Tomorrow (Pre-Fajr) or return them to the Inbox/Backlog.

### 6. Notifications & Alarms
- **Prayer Alerts**: Push notifications alerting the user when a new prayer timeslot begins.
- **Habit Reminders**: Configurable evening reminders to complete daily habits and rollover.

### 7. Settings & Location
- **Localisation**: Geolocation fetching to calculate accurate local prayer times.
- **Calculation Methods**: Ability to select juristic methods (e.g., Shafi/Hanafi) and calculation authorities (e.g., ISNA, MWL, Mecca).

---

## Data Schema (Firestore)

**Collection: `users/{userId}/tasks`**
```json
{
  "id": "string",
  "title": "string",
  "description": "string (optional)",
  "status": "inbox | this-week | this-month | someday | today",
  "category": "string (Business, Personal, Spiritual, etc.)",
  "completed": "boolean",
  "prayerTimeslot": "string (Pre-Fajr | Fajr, etc... - nullable)",
  "createdAt": "timestamp"
}
```

**Collection: `users/{userId}/habits`**
```json
{
  "id": "string",
  "title": "string",
  "frequency": "daily",
  "category": "string",
  "completedDates": "array of YYYY-MM-DD date strings",
  "createdAt": "timestamp"
}
```

**Collection: `users/{userId}/reflections`**
```json
{
  "id": "string",
  "text": "string (journal entry)",
  "date": "timestamp"
}
```
