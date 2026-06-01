import React from 'react';
import { X, Sunset, Trash2 } from 'lucide-react';
import { Task, TaskStatus, TaskCategory, PrayerTimeslot } from '../types';

interface TaskDetailSheetProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export default function TaskDetailSheet({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailSheetProps) {
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/15 backdrop-blur-[1.5px] z-40 transition-opacity"
      />

      <aside className="fixed top-0 right-0 w-[380px] max-w-full h-full bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 font-sans">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Sunset className="size-3.5 text-[#163328]" /> Detailed view
          </span>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-all cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body elements inputs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Goal Title</label>
            <input 
              type="text" 
              value={task.title}
              onChange={(e) => onUpdate({ ...task, title: e.target.value })}
              className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-[#163328] focus:ring-1 focus:ring-[#163328] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status Column</label>
              <select 
                value={task.status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  onUpdate({ 
                    ...task, 
                    status: newStatus,
                    prayerTimeslot: newStatus === 'today' ? 'Pre-Fajr' : null
                  });
                }}
                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg p-2 bg-[#fcfbf9]"
              >
                <option value="inbox">Inbox</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="someday">Someday</option>
                <option value="today">Today's schedule</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Category tag</label>
              <select 
                value={task.category}
                onChange={(e) => onUpdate({ ...task, category: e.target.value as TaskCategory })}
                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg p-2 bg-[#fcfbf9]"
              >
                <option value="Work">Work</option>
                <option value="Spiritual">Spiritual</option>
                <option value="Admin">Admin</option>
                <option value="Personal">Personal</option>
                <option value="Milestone">Milestone</option>
                <option value="Growth">Growth</option>
                <option value="Wellness">Wellness</option>
                <option value="Rest">Rest</option>
              </select>
            </div>
          </div>

          {task.status === 'today' && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Scheduled Slot (Today)</label>
              <select 
                value={task.prayerTimeslot || 'Pre-Fajr'}
                onChange={(e) => onUpdate({ ...task, prayerTimeslot: e.target.value as PrayerTimeslot })}
                className="w-full text-xs text-gray-800 border border-gray-200 rounded-lg p-2 bg-[#fcfbf9]"
              >
                <option value="Pre-Fajr">Pre-Fajr</option>
                <option value="Fajr">Fajr</option>
                <option value="Dhuhr">Dhuhr</option>
                <option value="Asr">Asr</option>
                <option value="Maghrib">Maghrib</option>
                <option value="Isha">Isha</option>
                <option value="Night">Night</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Duration Estimated</label>
            <input 
              type="text" 
              value={task.timeEstimated || ''}
              onChange={(e) => onUpdate({ ...task, timeEstimated: e.target.value })}
              placeholder="e.g. 90 mins, 2h"
              className="w-full text-xs text-gray-850 border border-gray-200 rounded-lg p-2 outline-none focus:border-[#163328] focus:ring-1 focus:ring-[#163328]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Notes & Details</label>
            <textarea 
              value={task.description}
              onChange={(e) => onUpdate({ ...task, description: e.target.value })}
              placeholder="Add notes, context guidelines, checklists, references or thoughts..."
              className="w-full h-44 text-xs leading-relaxed text-gray-700 bg-gray-50 hover:bg-gray-50 focus:bg-white rounded-lg p-3 border border-gray-200 outline-none focus:border-[#163328] focus:ring-1 focus:ring-[#163328] resize-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            <button 
              onClick={() => {
                if (window.confirm("Delete this ambition permanently?")) {
                  onDelete(task.id);
                }
              }}
              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="size-4" /> Delete Permanently
            </button>
          </div>
        </div>

        {/* Actions footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3 font-sans">
          <button 
            onClick={() => {
              onUpdate({ ...task, completed: !task.completed });
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer ${
              task.completed 
                ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' 
                : 'bg-[#163328] text-white hover:bg-[#2d4a3e]'
            }`}
          >
            {task.completed ? 'Mark incomplete' : 'Cultivate Complete'}
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>

      </aside>
    </>
  );
}
