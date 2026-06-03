import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { TaskCategory, TaskStatus } from '../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoal: (title: string, desc: string, category: TaskCategory, status: TaskStatus) => Promise<boolean>;
  fixedStatus?: TaskStatus;
}

export default function AddGoalModal({
  isOpen,
  onClose,
  onCreateGoal,
  fixedStatus,
}: AddGoalModalProps) {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<TaskCategory>('Work');
  const [newGoalStatus, setNewGoalStatus] = useState<TaskStatus>('inbox');

  React.useEffect(() => {
    if (isOpen) {
      setNewGoalStatus(fixedStatus || 'inbox');
    }
  }, [isOpen, fixedStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const finalStatus = fixedStatus || newGoalStatus;
    const success = await onCreateGoal(newGoalTitle, newGoalDesc, newGoalCategory, finalStatus);
    if (success) {
      setNewGoalTitle('');
      setNewGoalDesc('');
      setNewGoalCategory('Work');
      setNewGoalStatus('inbox');
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
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <h3 className="font-display-title text-base font-bold text-[#163328]">Cultivate New Ambition</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Title</label>
            <input 
              type="text" 
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="e.g. Redesign portfolio home page"
              required
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#163328]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Notes / Context</label>
            <textarea 
              value={newGoalDesc}
              onChange={(e) => setNewGoalDesc(e.target.value)}
              placeholder="What is the key target output?"
              className="w-full text-xs h-20 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-[#163328] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={fixedStatus ? "col-span-2" : ""}>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Category</label>
              <select 
                value={newGoalCategory}
                onChange={(e) => setNewGoalCategory(e.target.value as TaskCategory)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50/50"
              >
                <option value="Work">Work</option>
                <option value="Spiritual">Spiritual</option>
                <option value="Admin">Admin</option>
                <option value="Personal">Personal</option>
                <option value="Milestone">Milestone</option>
                <option value="Wellness">Wellness</option>
                <option value="Rest">Rest</option>
              </select>
            </div>

            {!fixedStatus && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Backlog status</label>
                <select 
                  value={newGoalStatus}
                  onChange={(e) => setNewGoalStatus(e.target.value as TaskStatus)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50/50"
                >
                  <option value="inbox">Inbox</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="someday">Someday</option>
                  <option value="today">Today's Schedule</option>
                </select>
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-[#163328] text-white hover:bg-[#2d4a3e] py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Create Goal
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
