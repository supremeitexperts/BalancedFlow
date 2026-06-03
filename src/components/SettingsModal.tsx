import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Compass, ShieldAlert, AlertCircle, Bell, BellRing, Settings } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Task, Habit } from '../types';
import { triggerScheduledNotificationTest } from '../hooks/useNotifications';

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

  // Diagnostic states for debugging Android Edge notifications
  const [swStatus, setSwStatus] = useState<string>('Checking...');
  const [controllerState, setControllerState] = useState<string>('Checking...');
  const [currentPermission, setCurrentPermission] = useState<string>('default');
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [activeTimerName, setActiveTimerName] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      setCurrentPermission(Notification.permission);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          if (regs.length > 0) {
            const active = regs.find(r => r.active);
            if (active) {
              setSwStatus(`Registered (Active: ${active.active.state})`);
            } else {
              setSwStatus(`Registered (${regs.length} registrations, none active)`);
            }
          } else {
            setSwStatus('None found (PWA requires service worker)');
          }
        }).catch(err => {
          setSwStatus(`Error checking SW: ${err.message}`);
        });
        setControllerState(navigator.serviceWorker.controller ? 'Active (Controlling)' : 'Ready (First-page session)');
      } else {
        setSwStatus('Not supported in this browser');
        setControllerState('Not supported');
      }
    }
  }, [isOpen]);

  const handleRequestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setCurrentPermission(result);
    }
  };

  const handleTriggerTimer = async (seconds: number, timerName: string) => {
    setActiveTimerName(timerName);
    setTestCountdown(seconds);
    
    const success = await triggerScheduledNotificationTest(
      seconds, 
      `⏰ ${timerName} Triggered!`, 
      `Your ${timerName} test successfully bypasses phone sleep/lock. This shows your service worker background delivery works!`
    );

    if (!success) {
      alert("Please grant notification permissions first.");
      setTestCountdown(null);
      return;
    }

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
          <div className="border border-gray-150 rounded-xl p-4 bg-[#fbfcfb] space-y-3.5">
            <h4 className="text-[10px] font-bold text-[#163328] uppercase tracking-wider flex items-center gap-1.5">
              <BellRing className="size-3.5 text-[#163328]" /> Notification & Mobile Sync
            </h4>
            
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Receive phone notifications at scheduled timeslots with incomplete tasks, and at 5:50 PM with incomplete habits.
            </p>

            {/* Live Web Diagnostics Panel */}
            <div className="border border-[#E8E6E1] bg-white rounded-lg p-2.5 space-y-1.5 text-[10px]">
              <span className="font-bold text-gray-700 block uppercase tracking-wider text-[9px] border-b border-[#E8E6E1]/50 pb-1 mb-1">
                Active OS & Browser Diagnostics
              </span>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Android Permission Status:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${currentPermission === 'granted' ? 'text-[#163328]' : 'text-amber-700'}`}>
                    {currentPermission.toUpperCase()}
                  </span>
                  {currentPermission !== 'granted' && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      className="bg-[#163328]/10 hover:bg-[#163328]/25 text-[#163328] font-bold px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                    >
                      Request
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Service Worker Registration:</span>
                <span className="font-semibold text-gray-700 max-w-[150px] truncate" title={swStatus}>
                  {swStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Controller Status:</span>
                <span className="font-semibold text-gray-700">
                  {controllerState}
                </span>
              </div>
              <div className="text-[9px] text-gray-400 leading-normal pt-1.5 border-t border-[#E8E6E1]/40">
                💡 <span className="font-semibold">Android Tip</span> (Edge/Chrome/PWA): If permission is "GRANTED" but notifications remain silent, verify Edge notifications are enabled in Android App Settings & battery mode is "Unrestricted".
              </div>
            </div>

            {/* Robust Timer Integration */}
            <div className="bg-[#fcfbf9] border border-[#E8E6E1] rounded-lg p-3 space-y-2.5">
              <span className="font-bold text-gray-700 block uppercase tracking-wider text-[9px]">
                🛠️ Immediate Background Timer Tests
              </span>
              <p className="text-[9px] text-gray-500 leading-relaxed">
                Click any timer, then immediately background/minimize Edge or lock your screen. The service worker will run the countdown in the background thread.
              </p>

              {testCountdown !== null ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium p-2.5 rounded-lg flex items-center gap-2 animate-pulse">
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold">Test Timer Active ({activeTimerName})</span>
                    <p className="text-[9px] text-amber-700 mt-0.5">
                      Fires in <span className="font-bold text-xs">{testCountdown}s</span>. Lock screen or exit browser now to verify offline/sleep stability!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerTimer(1, "Instant Test")}
                    className="bg-gray-150 hover:bg-gray-250 text-[#163328] font-bold py-2 rounded text-[9px] text-center cursor-pointer border border-[#E8E6E1]"
                  >
                    🚀 Instant Test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerTimer(5, "5s Test")}
                    className="bg-gray-150 hover:bg-gray-250 text-[#163328] font-bold py-2 rounded text-[9px] text-center cursor-pointer border border-[#E8E6E1]"
                  >
                    ⏳ 5s Delay
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerTimer(60, "1-Min Test")}
                    className="bg-[#163328] hover:bg-[#2d4a3e] text-white font-bold py-2 rounded text-[9px] text-center cursor-pointer border border-[#163328]"
                  >
                    ⏱️ 1-Min Delay
                  </button>
                </div>
              )}
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
