import React from 'react';
import { motion } from 'motion/react';
import { Check, Clock, MoreHorizontal, Trash2, Sunset, Sparkles, Plus, FolderOpen } from 'lucide-react';
import { Task, ActiveScreen, PrayerTimeslot, TaskCategory, TaskStatus } from '../types';
import { CATEGORY_COLORS } from '../initialData';

interface PlannerViewProps {
  todayTasks: Task[];
  allTasks: Task[];
  plannerProgressPercent: number;
  completedTodayCount: number;
  totalTodayCount: number;
  toggleTaskCompleted: (taskId: string) => Promise<void>;
  setSelectedTask: (task: Task | null) => void;
  setActiveScreen: (screen: ActiveScreen) => void;
  handleDeleteTask: (taskId: string) => Promise<void>;
  setShowRollover: (show: boolean) => void;
  handleQuickPlannerAddInput: (e: React.FormEvent) => Promise<void>;
  moveTaskToTodaySlot: (taskId: string, slot: PrayerTimeslot) => Promise<void>;
  handleCreateGoal: (title: string, desc: string, category: TaskCategory, status: TaskStatus) => Promise<boolean>;
  computedPrayerTimes: Record<PrayerTimeslot, string>;
  loadingPrayerTimes: boolean;
  userLocation: string;
  onOpenSettings: () => void;
}

export default function PlannerView({
  todayTasks,
  allTasks,
  plannerProgressPercent,
  completedTodayCount,
  totalTodayCount,
  toggleTaskCompleted,
  setSelectedTask,
  setActiveScreen,
  handleDeleteTask,
  setShowRollover,
  handleQuickPlannerAddInput,
  moveTaskToTodaySlot,
  handleCreateGoal,
  computedPrayerTimes,
  loadingPrayerTimes,
  userLocation,
  onOpenSettings,
}: PlannerViewProps) {
  return (
    <motion.div 
      key="planner"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6 md:p-10 max-w-3xl mx-auto w-full flex flex-col gap-8 pb-24 md:pb-12"
    >
      {/* Header with Date and svg Progress Circle */}
      <div className="flex justify-between items-end border-b border-[#E8E6E1] pb-6">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center flex-wrap gap-2">
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
            <span className="size-1 rounded-full bg-gray-300 hidden sm:inline" />
            <button 
              onClick={onOpenSettings}
              className="text-[#795835] hover:text-[#163328] font-bold uppercase tracking-widest text-[9px] hover:underline flex items-center gap-1 cursor-pointer border border-[#795835]/30 hover:border-[#163328] px-2 py-0.5 rounded transition-all bg-white shadow-xs"
            >
              📍 {userLocation} {loadingPrayerTimes && '...'}
            </button>
          </p>
          <h2 className="font-display-title text-3xl font-semibold text-gray-900 leading-none">
            Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h2>
        </div>

        {/* Progress Circle Ring */}
        <div className="flex items-center gap-4">
          <div className="relative size-14 flex items-center justify-center shrink-0">
            <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle 
                className="text-gray-200" 
                cx="18" cy="18" r="16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
              />
              <circle 
                className="text-[#163328]" 
                cx="18" cy="18" r="16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5"
                strokeDasharray="100"
                strokeDashoffset={100 - plannerProgressPercent}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-bold text-[#163328]">{plannerProgressPercent}%</span>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none gap-1">
            <span className="text-xs font-bold text-[#163328]">{completedTodayCount} / {totalTodayCount}</span>
            <span className="text-[10px] text-gray-500 font-medium">Completed tasks</span>
          </div>
        </div>
      </div>

      {/* Quick add a Task straight to Planner inline */}
      <form onSubmit={handleQuickPlannerAddInput} className="p-4 bg-white border border-[#E8E6E1] rounded-xl flex flex-col md:flex-row gap-3 items-center">
        <div className="text-xs font-bold text-gray-600 shrink-0 md:border-r md:pr-3 border-gray-100 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-[#795835]" /> Instantly Schedule:
        </div>
        <input 
          name="plannerTaskTitle"
          type="text" 
          placeholder="What intention will you cultivate?"
          className="flex-1 bg-gray-50/50 hover:bg-gray-50 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:bg-white border border-gray-100 placeholder:text-gray-400 w-full"
        />
        <div className="flex gap-2 w-full md:w-auto font-sans">
          <select name="plannerSlot" className="text-xs border border-gray-100 bg-gray-50 px-2 py-1.5 rounded-lg max-w-[120px] flex-1">
            <option value="Pre-Fajr">Pre-Fajr</option>
            <option value="Fajr">Fajr</option>
            <option value="Dhuhr">Dhuhr</option>
            <option value="Asr">Asr</option>
            <option value="Maghrib">Maghrib</option>
            <option value="Isha">Isha</option>
            <option value="Night">Night</option>
          </select>
          <select name="plannerCategory" className="text-xs border border-gray-100 bg-gray-50 px-2 py-1.5 rounded-lg max-w-[120px] flex-1">
            <option value="Work">Work</option>
            <option value="Spiritual">Spiritual</option>
            <option value="Wellness">Wellness</option>
            <option value="Personal">Personal</option>
            <option value="Admin">Admin</option>
          </select>
          <button type="submit" className="bg-[#163328] text-white hover:bg-[#2d4a3e] p-2 rounded-lg cursor-pointer" title="Schedule">
            <Plus className="size-4" />
          </button>
        </div>
      </form>

      {/* GOAL LIBRARY / WEEKLY TARGETS SECTION */}
      <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-display-title text-base font-bold text-[#163328] flex items-center gap-1.5">
              <FolderOpen className="size-4 text-[#795835]" /> Goal Library (Weekly Targets)
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">Create unscheduled targets. Select a slot pill to place on today's timeline.</p>
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
            {allTasks.filter(t => t.status === 'this-week').length} goals
          </span>
        </div>

        {/* List of library goals */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {allTasks.filter(t => t.status === 'this-week').map((goal) => (
            <div 
              key={goal.id} 
              className="group/item flex flex-col sm:flex-row sm:items-center justify-between border border-gray-105 bg-gray-50/20 hover:bg-white hover:border-[#E8E6E1] p-3 rounded-xl transition-all gap-3.5"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span 
                  className="size-2 rounded-full shrink-0" 
                  style={{ backgroundColor: CATEGORY_COLORS[goal.category] || '#163328' }} 
                />
                <p className="text-xs font-semibold text-gray-800 truncate select-text">
                  {goal.title}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#f5f3f0] text-gray-500 rounded shrink-0 scale-90">
                  {goal.category}
                </span>
              </div>

              {/* Instant Schedule triggers (Pills) */}
              <div className="flex items-center gap-1 flex-wrap shrink-0">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mr-1.5 sm:hidden">Schedule:</span>
                {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as PrayerTimeslot[]).map((slotStr) => (
                  <button
                    key={slotStr}
                    onClick={() => moveTaskToTodaySlot(goal.id, slotStr)}
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-[#f4f3f1] hover:bg-[#163328] hover:text-white text-gray-700 rounded uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {slotStr}
                  </button>
                ))}
                
                {/* Trash option */}
                <button 
                  onClick={() => handleDeleteTask(goal.id)}
                  className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors ml-1 cursor-pointer"
                  title="Remove target"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}

          {allTasks.filter(t => t.status === 'this-week').length === 0 && (
            <div className="py-6 text-center text-xs text-gray-400 italic">
              Goal Library is currently empty. Add your weekly targets below!
            </div>
          )}
        </div>

        {/* Add goal directly to library */}
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.elements.namedItem('libraryGoalTitle') as HTMLInputElement;
            const selectCategory = form.elements.namedItem('libraryGoalCategory') as HTMLSelectElement;
            if (!input || !input.value.trim()) return;

            const success = await handleCreateGoal(input.value.trim(), 'Cultivated directly in goal library', selectCategory.value as TaskCategory, 'this-week');
            if (success) {
              input.value = '';
            }
          }}
          className="flex gap-2 border-t border-gray-100 pt-3"
        >
          <input 
            name="libraryGoalTitle"
            type="text" 
            placeholder="Add weekly target to library..."
            className="flex-1 bg-gray-50/50 hover:bg-gray-55 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:bg-white border border-gray-100 placeholder:text-gray-400 font-medium"
          />
          <select 
            name="libraryGoalCategory"
            className="text-[10px] font-bold uppercase tracking-wider border border-gray-100 bg-gray-50 px-2 rounded-lg text-gray-600 focus:outline-none"
          >
            <option value="Work">Work</option>
            <option value="Spiritual">Spiritual</option>
            <option value="Wellness">Wellness</option>
            <option value="Personal">Personal</option>
            <option value="Admin">Admin</option>
          </select>
          <button 
            type="submit" 
            className="bg-[#163328] hover:bg-[#2d4a3e] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </form>
      </div>

      {/* Prayer Block Timeline */}
      <div className="flex flex-col gap-4">
        {(['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Night'] as PrayerTimeslot[]).map((slot) => {
          const tasksInSlot = todayTasks.filter(t => t.prayerTimeslot === slot);
          
          return (
            <div key={slot} className="flex flex-col">
              {/* Header Milestone Divider */}
              <div className="flex items-center gap-3 py-3 select-none">
                <div className="flex-1 border-t border-dotted border-[#eabe94] opacity-80" />
                <span className="font-heading-section text-base text-[#795835] font-semibold">{slot}</span>
                <span className="text-[10px] text-[#8B8B88] font-bold bg-[#E8E6E1]/50 px-2 py-0.5 rounded-full">
                  {computedPrayerTimes[slot]}
                </span>
                <div className="flex-1 border-t border-dotted border-[#eabe94] opacity-80" />
              </div>

              {/* Timeline Slot Cards Stack */}
              <div className="flex flex-col gap-3">
                {tasksInSlot.map(task => (
                  <div 
                    key={task.id}
                    className={`bg-white border border-[#E8E6E1] rounded-xl flex items-start p-4 gap-3.5 shadow-sm transition-all duration-300 relative overflow-hidden group ${
                      task.completed ? 'opacity-60 bg-gray-50/50' : 'hover:shadow-md'
                    }`}
                  >
                    {/* Accent stripe on Left */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-full"
                      style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#163328' }}
                    />

                    {/* Checkbox trigger */}
                    <button 
                      onClick={() => toggleTaskCompleted(task.id)}
                      className={`w-5 h-5 rounded-md border text-white flex items-center justify-center shrink-0 mt-0.5 transition-all outline-none cursor-pointer ${
                        task.completed 
                          ? 'bg-[#163328] border-[#163328]' 
                          : 'border-[#c1c8c3] hover:border-[#163328]'
                      }`}
                    >
                      {task.completed && <Check className="size-3.5 stroke-[3]" />}
                    </button>

                    {/* Core textual detail */}
                    <div className="flex-1 min-w-0 pointer-events-none select-text">
                      <h4 className={`text-sm font-semibold text-[#1C1C1A] ${task.completed ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-[#81817e] font-medium mt-1 flex items-center gap-2">
                        <span className="font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#f4f3f1] rounded text-[#424844]">
                          {task.category}
                        </span>
                        {task.timeEstimated && (
                          <span className="flex items-center gap-1 bg-[#eeeeeb] text-[9px] font-bold text-gray-500 uppercase tracking-wider px-1.5 py-0.5 rounded">
                            <Clock className="size-2.5 text-gray-400" /> {task.timeEstimated}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Action dots / Quick carry-over triggers */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setSelectedTask(task); }}
                        className="text-gray-400 hover:text-gray-900 duration-150 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        title="Edit item notes"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                      <button 
                        onClick={() => { handleDeleteTask(task.id); }}
                        className="text-gray-400 hover:text-red-600 duration-150 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {tasksInSlot.length === 0 && (
                  <div className="border border-dashed border-[#E8E6E1]/80 rounded-xl p-3.5 text-center text-xs text-gray-400 font-medium bg-[#faf9f7]/30 select-none">
                    No intentions assigned to {slot}.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* End Day trigger action */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <button 
          onClick={() => { setShowRollover(true); }}
          className="w-full bg-[#163328] hover:bg-[#2d4a3e] text-white active:scale-[0.98] font-bold uppercase tracking-[0.06em] py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
        >
          <Sunset className="size-4 text-[#eabe94]" />
          <span>Begin Evening Rollover</span>
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Evaluate pending items, file reflections, and reset for a peaceful morning.
        </p>
      </div>
    </motion.div>
  );
}
