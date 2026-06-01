import React from 'react';
import { motion } from 'motion/react';
import { Flame, Trash2 } from 'lucide-react';
import { Habit } from '../types';

interface HabitSanctumViewProps {
  habits: Habit[];
  searchTerm: string;
  consistencyScore: number;
  toggleHabitToday: (habitId: string) => Promise<void>;
  handleDeleteHabit: (habitId: string) => Promise<void>;
}

export default function HabitSanctumView({
  habits,
  searchTerm,
  consistencyScore,
  toggleHabitToday,
  handleDeleteHabit,
}: HabitSanctumViewProps) {
  const filteredHabits = habits.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      key="habits"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-24 md:pb-12"
    >
      {/* Header banner */}
      <div className="flex justify-between items-end border-b border-[#E8E6E1] pb-6">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            Repetition & consistency
          </p>
          <h2 className="font-display-title text-3xl font-semibold text-gray-900 leading-none">
            Habit Sanctum
          </h2>
          <p className="text-[11px] text-gray-500 font-medium mt-1">A quiet, focused space for daily repetition.</p>
        </div>

        {/* Dynamic Overall Consistency Ring */}
        <div className="flex items-center gap-3">
          <div className="relative size-12 flex items-center justify-center shrink-0">
            <svg className="size-full -rotate-90 transform" viewBox="0 0 36 36">
              <circle className="text-gray-200" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
              <circle 
                className="text-[#163328]" 
                cx="18" cy="18" r="16" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - consistencyScore}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[#163328]">{consistencyScore}%</span>
          </div>
          <div className="flex flex-col leading-none font-sans">
            <span className="text-xs font-bold text-gray-800">Overall</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Consistency</span>
          </div>
        </div>
      </div>

      {/* List of Habits with heatmaps */}
      <div className="flex flex-col gap-4">
        {filteredHabits.map(habit => {
          const isCompletedToday = habit.history[29];

          return (
            <div 
              key={habit.id}
              className="bg-white border border-[#E8E6E1] rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden group"
            >
              {/* Left category indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#795835]/70" />

              {/* Habit Info & Streak counter */}
              <div className="flex items-center gap-4 w-full lg:w-64 shrink-0 pl-1">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#163328] transition-colors truncate">
                    {habit.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                    <Flame className="size-3.5 text-[#795835] stroke-[2.5]" />
                    <span className="text-xs font-bold text-gray-700">{habit.streak} Day Streak</span>
                    {habit.frequency && habit.frequency !== 'daily' && (
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ml-1">
                        {habit.targetCount}x {habit.frequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Heatmap Row representation for last 7 Days */}
              <div className="flex-1 flex flex-col items-start lg:items-end gap-1.5">
                <div className="flex items-center gap-1 w-full lg:w-auto justify-start lg:justify-end">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2">Last 7 Days:</span>
                  
                  {[23, 24, 25, 26, 27, 28].map((dayIndex) => {
                    const wasCompleted = habit.history[dayIndex];
                    return (
                      <div 
                        key={dayIndex}
                        className={`size-4.5 rounded-md transition-colors ${
                          wasCompleted 
                            ? 'bg-[#adcebe] border border-[#adcebe]' 
                            : 'bg-gray-100 border border-gray-200'
                        }`}
                        title={wasCompleted ? 'Completed Day' : 'Missed Day'}
                      />
                    );
                  })}

                  <div className="w-px h-5 bg-gray-200 mx-1.5" />

                  {/* Today Toggler Button (index 29) */}
                  <button 
                    onClick={() => toggleHabitToday(habit.id)}
                    className={`min-w-[64px] h-7 px-3 text-[10px] rounded-lg border font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isCompletedToday 
                        ? 'bg-[#163328] text-white border-[#163328] shadow-sm' 
                        : 'bg-transparent text-[#163328] border-[#adcebe] hover:bg-[#163328]/5'
                    }`}
                  >
                    {isCompletedToday ? 'Done' : 'Complete'}
                  </button>
                </div>
                <p className="text-[9px] text-[#8B8B88] font-semibold text-right w-full hidden lg:block">
                  Tap "complete" to maintain your streak live.
                </p>
              </div>

              {/* Quick remove trigger */}
              <button 
                onClick={() => handleDeleteHabit(habit.id)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 cursor-pointer"
                title="Cultivate other focus"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        {filteredHabits.length === 0 && (
          <div className="border border-dashed border-[#E8E6E1] rounded-xl py-12 text-center text-sm text-[#8B8B88]">
            {habits.length === 0 
              ? 'No habits being tracked. Click "New Habit" to cultivate focus!'
              : 'No habits match your search terms.'}
          </div>
        )}
      </div>

      {/* Quick Helper guideline */}
      <div className="p-4 bg-white border border-[#E8E6E1] rounded-xl text-xs text-gray-500 leading-relaxed max-w-xl mx-auto text-center font-medium shadow-sm">
        🔑 **Why Repetition?** Mindful repetition turns actions into automatic states. Balanced Flow helps you tracks streaks inline to safeguard your spiritual & digital focus limits.
      </div>
    </motion.div>
  );
}
