import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { HabitFrequency } from '../types';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (name: string, frequency: HabitFrequency, targetCount: number) => Promise<boolean>;
}

export default function AddHabitModal({
  isOpen,
  onClose,
  onCreateHabit,
}: AddHabitModalProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetCount, setTargetCount] = useState<number>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    const success = await onCreateHabit(newHabitName, frequency, targetCount);
    if (success) {
      setNewHabitName('');
      setFrequency('daily');
      setTargetCount(1);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 font-sans"
    >
      <motion.div 
        initial={{ scale: 0.95 }} 
        animate={{ scale: 1 }} 
        exit={{ scale: 0.95 }} 
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-display-title text-base font-bold text-[#163328]">Cultivate New Habit</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Habit Name</label>
            <input 
              type="text" 
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g. Read 15 mins before bed"
              required
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#163328]"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Frequency</label>
              <select 
                value={frequency}
                onChange={(e) => {
                  const val = e.target.value as HabitFrequency;
                  setFrequency(val);
                  if (val === 'daily') setTargetCount(1);
                }}
                className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#163328]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            {frequency !== 'daily' && (
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Times per {frequency === 'weekly' ? 'week' : 'month'}</label>
                <input 
                  type="number" 
                  min={1}
                  max={31}
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#163328]"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-[#163328] text-white hover:bg-[#2d4a3e] py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Start Tracking
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
