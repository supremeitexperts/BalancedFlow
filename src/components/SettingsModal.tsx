import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Compass, ShieldAlert } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Task, Habit } from '../types';
import { triggerNotificationTest } from '../hooks/useNotifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentLocation: string;
  currentMethod: number;
  currentSchool: number;
  tasks?: Task[];
  habits?: Habit[];
  onSignOut?: () => void;
}

const METHODS = [
  { value: 2, label: 'Islamic Society of North America (ISNA)' },
  { value: 3, label: 'Muslim World League (MWL)' },
  { value: 4, label: 'Umm Al-Qura University, Makkah' },
  { value: 1, label: 'University of Islamic Sciences, Karachi' },
  { value: 5, label: 'Egyptian General Authority of Survey' },
  { value: 15, label: 'Moonsighting Committee Worldwide (MCW)' },
];

const SCHOOLS = [
  { value: 1, label: 'Hanafi (Later Asr calculation)' },
  { value: 0, label: 'Standard / Shafi / Maliki / Hanbali' },
];

export default function SettingsModal({
  isOpen,
  onClose,
  userId,
  currentLocation,
  currentMethod,
  currentSchool,
  tasks,
  habits,
  onSignOut,
}: SettingsModalProps) {
  const [location, setLocation] = useState(currentLocation);
  const [method, setMethod] = useState(currentMethod);
  const [school, setSchool] = useState(currentSchool);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setSaving(true);

    try {
      const userRef = doc(db, `users/${userId}`);
      await updateDoc(userRef, {
        location: location.trim(),
        prayerMethod: Number(method),
        prayerSchool: Number(school),
      });
      onClose();
    } catch (err) {
      console.error("Failed to save location settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-black/40 backdrop-blur-[1.5px] z-50 flex items-center justify-center p-4 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95 }} 
        animate={{ scale: 1 }} 
        exit={{ scale: 0.95 }} 
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-hidden relative"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Compass className="size-5 text-[#163328]" />
            <h3 className="font-display-title text-base font-bold text-[#163328]">Flow Configuration</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Location field */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Your Current Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-450" />
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State, Zip Code or Country"
                required
                className="w-full text-xs border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#163328]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">
              Input ZIP code or city. Local times calculate safely on update.
            </p>
          </div>

          {/* Asr Juristic Method selection */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Asr Prayer Juristic School
            </label>
            <select 
              value={school}
              onChange={(e) => setSchool(Number(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:outline-none focus:border-[#163328]"
            >
              {SCHOOLS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Calculation Method Selection */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Calculation Method Angle
            </label>
            <select 
              value={method}
              onChange={(e) => setMethod(Number(e.target.value))}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 focus:outline-none focus:border-[#163328]"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#fcfbf9] border border-dashed border-[#E8E6E1]/80 rounded-xl p-3.5 flex items-start gap-2.5 text-[10px] text-gray-500 leading-relaxed">
            <ShieldAlert className="size-4 text-[#795835] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Accurate Planning:</span> Your daily timeslots adjust dynamically based on calculations. Newtown Square (19073) is seed default.
            </div>
          </div>

          {/* Notification & PWA Sync Center */}
          <div className="border border-gray-150 rounded-xl p-3.5 bg-[#fbfcfb] space-y-2.5">
            <h4 className="text-[10px] font-bold text-[#163328] uppercase tracking-wider">
              Notification & Mobile Sync
            </h4>
            
            <p className="text-[10px] text-gray-500 leading-normal">
              Receive phone notifications at scheduled timeslots with incomplete tasks, and at 5:50 PM with incomplete habits.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-gray-400 uppercase">OS Permission Status:</span>
                <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded ${
                  ('Notification' in window && Notification.permission === 'granted') 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {'Notification' in window ? Notification.permission : 'Not Supported'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission().then(() => {
                        window.location.reload();
                      });
                    } else {
                      alert("Web Notifications are not supported in this browser.");
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Enable Permissions
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerNotificationTest(tasks || [], habits || []);
                  }}
                  className="bg-[#163328] text-white hover:bg-[#2d4a3e] text-[10px] font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                >
                  ⚡ Test Notification
                </button>
              </div>
            </div>

            {/* Force cache update box */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="flex-1">
                <span className="block text-[9px] font-bold text-gray-400 uppercase">Instant Update Sync</span>
                <span className="block text-[9px] text-gray-400 leading-tight font-medium">Clear phone's PWA cache to pull any recent code changes.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(registrations => {
                      for (let registration of registrations) {
                        registration.unregister();
                      }
                      window.location.reload();
                    });
                  } else {
                    window.location.reload();
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold px-2 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Sync & Reload App
              </button>
            </div>
          </div>

          {/* Controls button footer */}
          <div className="pt-3 flex flex-col gap-2">
            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 bg-[#163328] text-white hover:bg-[#2d4a3e] py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Aligning Location...' : 'Save Configuration'}
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {tasks && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full mt-2 border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Sign Out / Disconnect
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
