import React from 'react';
import { motion } from 'motion/react';
import { Flame, Trash2, Sparkles, ShieldCheck, Zap, Check, Plus, Minus, Trophy } from 'lucide-react';
import { Habit } from '../types';
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  TouchSensor, 
  MouseSensor, 
  closestCorners, 
  DragOverlay, 
  useDraggable, 
  useDroppable 
} from '@dnd-kit/core';

interface HabitSanctumViewProps {
  habits: Habit[];
  searchTerm: string;
  consistencyScore: number;
  toggleHabitToday: (habitId: string, dayIndex?: number) => Promise<void>;
  handleDeleteHabit: (habitId: string) => Promise<void>;
  handleReorderHabits: (updates: { id: string; order: number }[]) => Promise<void>;
}

const sortHabitsByOrder = (habitsList: Habit[]): Habit[] => {
  return [...habitsList].sort((a, b) => {
    const orderA = a.order !== undefined && a.order !== null ? a.order : Infinity;
    const orderB = b.order !== undefined && b.order !== null ? b.order : Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });
};

function HabitCard({
  habit,
  toggleHabitToday,
  handleDeleteHabit,
}: {
  key?: string | number;
  habit: Habit;
  toggleHabitToday: (id: string, dayIndex?: number) => Promise<void>;
  handleDeleteHabit: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({
    id: habit.id,
    data: { habit }
  });

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: habit.id,
    data: { habit }
  });

  const combinedRef = (node: HTMLElement | null) => {
    dragRef(node);
    dropRef(node);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.4 : 1,
  } : undefined;

  const isCompletedToday = habit.history[29];

  // Frequency-aware state and configurations
  const freq = habit.frequency || 'daily';
  const targetCount = habit.targetCount || 1;
  const history = habit.history || [];

  // Weekly range definitions:
  // Week 1 (Active): 23-29
  // Week 2 (Prev 1): 16-22
  // Week 3 (Prev 2): 9-15
  // Week 4 (Prev 3): 2-8
  const weekRanges = {
    active: [23, 24, 25, 26, 27, 28, 29],
    prev1: [16, 17, 18, 19, 20, 21, 22],
    prev2: [9, 10, 11, 12, 13, 14, 15],
    prev3: [2, 3, 4, 5, 6, 7, 8]
  };

  const activeReps = weekRanges.active.filter(idx => history[idx]).length;
  const prev1Reps = weekRanges.prev1.filter(idx => history[idx]).length;
  const prev2Reps = weekRanges.prev2.filter(idx => history[idx]).length;
  const prev3Reps = weekRanges.prev3.filter(idx => history[idx]).length;

  // Recalculate weekly streak dynamically for immediate frontend reinforcement!
  const getWeeklyStreak = () => {
    let weekStreak = 0;
    const hasMetCurrent = activeReps >= targetCount;
    const hasMetPrev1 = prev1Reps >= targetCount;
    const hasMetPrev2 = prev2Reps >= targetCount;
    const hasMetPrev3 = prev3Reps >= targetCount;

    if (hasMetCurrent) {
      weekStreak++;
      if (hasMetPrev1) {
        weekStreak++;
        if (hasMetPrev2) {
          weekStreak++;
          if (hasMetPrev3) {
            weekStreak++;
          }
        }
      }
    } else {
      if (hasMetPrev1) {
        weekStreak++;
        if (hasMetPrev2) {
          weekStreak++;
          if (hasMetPrev3) {
            weekStreak++;
          }
        }
      }
    }
    return weekStreak;
  };

  // Toggle helpers for Week/Month variables
  const handleWeeklyToggle = (weekRange: number[], currentCount: number, clickedIndex: number) => {
    // If the clicked index is less than the current completed count, we are unchecking/reducing.
    // So we toggle the last 'true' day in the week range.
    // If it is greater or equal, we are checking/adding.
    // So we toggle the first 'false' day in the week range.
    if (clickedIndex < currentCount) {
      const lastTrueIdx = [...weekRange].reverse().find(idx => history[idx]);
      if (lastTrueIdx !== undefined) {
        toggleHabitToday(habit.id, lastTrueIdx);
      }
    } else {
      const firstFalseIdx = weekRange.find(idx => !history[idx]);
      if (firstFalseIdx !== undefined) {
        toggleHabitToday(habit.id, firstFalseIdx);
      }
    }
  };

  // Monthly target details
  const monthlyReps = history.filter(Boolean).length;
  const isMonthlyGoalMet = monthlyReps >= targetCount;

  const handleMonthlyAdjustCount = (increment: boolean) => {
    if (increment) {
      // Find first false day in 30 days
      const firstFalseIdx = history.findIndex(val => !val);
      if (firstFalseIdx !== -1) {
        toggleHabitToday(habit.id, firstFalseIdx);
      }
    } else {
      // Find last true day in 30 days
      const lastTrueIdx = [...Array(30).keys()].reverse().find(idx => history[idx]);
      if (lastTrueIdx !== undefined) {
        toggleHabitToday(habit.id, lastTrueIdx);
      }
    }
  };

  return (
    <div 
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden group cursor-grab active:cursor-grabbing select-none hover:shadow-md ${
        isOver ? 'ring-2 ring-emerald-600 bg-emerald-50/20 border-emerald-600' : 'border-[#E8E6E1]'
      }`}
    >
      {/* Left category indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#795835]/70" />

      {/* Habit Info & Streak counter */}
      <div className="flex items-center gap-4 w-full md:w-64 shrink-0 pl-1 pointer-events-none select-none">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#163328] transition-colors truncate">
            {habit.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-1 text-gray-500">
            <Flame className="size-3.5 text-[#795835] stroke-[2.5]" />
            <span className="text-xs font-bold text-gray-700">
              {freq === 'weekly' ? `${getWeeklyStreak()} Week Streak` : freq === 'monthly' ? (isMonthlyGoalMet ? 'Target Met!' : 'Active Month') : `${habit.streak} Day Streak`}
            </span>
            {freq !== 'daily' && (
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider ml-1 shrink-0">
                {targetCount}x {freq}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Flex Right: Frequency Aware Interactive Heatmaps */}
      <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 w-full">
        
        {/* CASE 1: DAILY HABIT VIEW */}
        {freq === 'daily' && (
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-start md:justify-end flex-wrap">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1 pointer-events-none select-none">Weekly Backfill:</span>
            
            <div className="flex items-center gap-1.5">
              {[22, 23, 24, 25, 26, 27, 28].map((dayIndex) => {
                const wasCompleted = history[dayIndex];
                const daysAgo = 29 - dayIndex;
                const cellDate = new Date();
                cellDate.setDate(cellDate.getDate() - daysAgo);
                const wChar = cellDate.toLocaleDateString('en-US', { weekday: 'narrow' });
                const dateLabel = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={dayIndex} className="flex flex-col items-center gap-0.5">
                    <span className="text-[8px] font-bold text-gray-400 select-none pointer-events-none">{wChar}</span>
                    <button 
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitToday(habit.id, dayIndex);
                      }}
                      className={`size-4.5 rounded-md transition-all cursor-pointer border flex items-center justify-center hover:scale-115 active:scale-90 ${
                        wasCompleted 
                          ? 'bg-[#adcebe] border-[#adcebe] text-white' 
                          : 'bg-gray-50 border-gray-150 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                      title={`Click to fill ${dateLabel} (${wasCompleted ? 'Completed' : 'Missed'}) - heals your streak`}
                    >
                      {wasCompleted && <span className="text-[7.5px] font-black">✓</span>}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1.5 pointer-events-none select-none" />

            {/* Today Toggler Button (index 29) */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-[#163328] select-none pointer-events-none">Today</span>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHabitToday(habit.id, 29);
                }}
                className={`min-w-[64px] h-4.5 px-2 text-[8px] rounded-md border font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isCompletedToday 
                    ? 'bg-[#163328] text-white border-[#163328] shadow-sm' 
                    : 'bg-transparent text-[#163328] border-[#adcebe] hover:bg-[#163328]/5'
                }`}
              >
                {isCompletedToday ? 'Done' : 'Complete'}
              </button>
            </div>
          </div>
        )}

        {/* CASE 2: WEEKLY HABIT VIEW */}
        {freq === 'weekly' && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap gap-y-2">
            
            {/* Left/Past Week Backfills (W-1, W-2, W-3) */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mr-1 leading-none select-none pointer-events-none">Backfill weeks:</span>
              <div className="flex items-center gap-2.5">
                {[
                  { label: 'W-1', reps: prev1Reps, range: weekRanges.prev1, title: 'Last Week' },
                  { label: 'W-2', reps: prev2Reps, range: weekRanges.prev2, title: '2 Weeks Ago' },
                  { label: 'W-3', reps: prev3Reps, range: weekRanges.prev3, title: '3 Weeks Ago' }
                ].map((wk) => {
                  const met = wk.reps >= targetCount;
                  return (
                    <div key={wk.label} className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-gray-400 select-none pointer-events-none">{wk.label}</span>
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clicking past week increments completed repetitions easily (fast backlog healing!)
                          if (wk.reps < targetCount) {
                            const firstFalse = wk.range.find(idx => !history[idx]);
                            if (firstFalse !== undefined) toggleHabitToday(habit.id, firstFalse);
                          } else {
                            const lastTrue = [...wk.range].reverse().find(idx => history[idx]);
                            if (lastTrue !== undefined) toggleHabitToday(habit.id, lastTrue);
                          }
                        }}
                        className={`min-w-[42px] h-4.5 px-1.5 text-[8.5px] rounded-md transition-all cursor-pointer border flex items-center justify-center gap-0.5 hover:scale-108 active:scale-95 ${
                          met
                            ? 'bg-[#adcebe] border-[#adcebe] text-[#163328] font-bold'
                            : wk.reps > 0
                              ? 'bg-amber-50 border-amber-200 text-amber-850 font-bold'
                              : 'bg-gray-50 border-gray-200 text-gray-400'
                        }`}
                        title={`${wk.title}: completed ${wk.reps} of ${targetCount} reps. Click to toggle a rep.`}
                      >
                        {wk.reps}/{targetCount}
                        {met && <span className="text-[7.5px] font-black">✓</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block w-px h-5 bg-gray-200 mx-1.5 shrink-0 pointer-events-none select-none" />

            {/* This Week Target Checkboxes (Active Week) */}
            <div className="flex flex-col items-start md:items-center">
              <span className="text-[8px] font-black text-[#163328] uppercase tracking-wider select-none pointer-events-none">This Week Target</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {Array.from({ length: targetCount }).map((_, clickedIndex) => {
                  const isChecked = clickedIndex < activeReps;
                  return (
                    <button
                      key={clickedIndex}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWeeklyToggle(weekRanges.active, activeReps, clickedIndex);
                      }}
                      className={`size-4.5 rounded-full transition-all cursor-pointer border flex items-center justify-center hover:scale-115 active:scale-90 ${
                        isChecked 
                          ? 'bg-[#163328] border-[#163328] text-white shadow-xs' 
                          : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                      title={`Click to toggle target ${clickedIndex + 1} of ${targetCount} this week`}
                    >
                      {isChecked && <span className="text-[7.5px] font-black">✓</span>}
                    </button>
                  );
                })}
                <span className="text-[10px] text-gray-400 font-black ml-1 pointer-events-none">
                  ({activeReps}/{targetCount})
                </span>
              </div>
            </div>

          </div>
        )}

        {/* CASE 3: MONTHLY HABIT VIEW */}
        {freq === 'monthly' && (
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end flex-wrap gap-y-2">
            
            {/* Beautiful Progress Bar & Percent Indicator */}
            <div className="flex items-center gap-2.5 flex-1 md:flex-initial min-w-[120px] md:min-w-[180px]">
              <div className="flex-1">
                <div className="flex justify-between items-center text-[8.5px] text-gray-400 font-mono select-none pointer-events-none leading-none mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-gray-600">{monthlyReps} / {targetCount} reps</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-150/45">
                  <div 
                    className="h-full bg-[#163328] transition-all duration-305" 
                    style={{ width: `${Math.min(100, (monthlyReps / targetCount) * 100)}%` }}
                  />
                </div>
              </div>
              {isMonthlyGoalMet && (
                <div className="bg-amber-100 border border-amber-200 text-amber-800 p-1 rounded-md flex items-center justify-center shrink-0" title="Monthly target reached! Complete alignment.">
                  <Trophy className="size-3.5 fill-amber-305/40 text-amber-700" />
                </div>
              )}
            </div>

            <div className="hidden md:block w-px h-5 bg-gray-200 mx-1.5 shrink-0 pointer-events-none select-none" />

            {/* Quick adjust action counts */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMonthlyAdjustCount(false);
                }}
                disabled={monthlyReps <= 0}
                className="size-5 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-30 text-gray-600 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                title="Decrement 1 completion count"
              >
                <Minus className="size-3 text-gray-500" />
              </button>
              <span className="text-[10px] font-mono font-bold text-[#163328] text-center w-7 leading-none select-none pointer-events-none">
                {monthlyReps}
              </span>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMonthlyAdjustCount(true);
                }}
                disabled={monthlyReps >= 30}
                className="size-5 rounded bg-[#163328] border border-[#163328] hover:bg-[#204939] disabled:opacity-30 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-colors shadow-xs"
                title="Increment 1 completion count"
              >
                <Plus className="size-3 text-white" />
              </button>
            </div>

          </div>
        )}

        <p className="text-[9px] text-[#8B8B88] font-medium text-right w-full hidden md:block pointer-events-none select-none">
          {freq === 'weekly' 
            ? 'Click target checkboxes to fill this week, or use backfill buttons to capture previous weeks!'
            : freq === 'monthly'
              ? 'Click + to log new repetitions and fill your monthly target quota!'
              : 'Click any past day bubble to fill outstanding goals & safeguard your streak!'}
        </p>
      </div>

      {/* Quick remove trigger */}
      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteHabit(habit.id);
        }}
        className="absolute right-3 top-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 cursor-pointer"
        title="Cultivate other focus"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export default function HabitSanctumView({
  habits,
  searchTerm,
  consistencyScore,
  toggleHabitToday,
  handleDeleteHabit,
  handleReorderHabits,
}: HabitSanctumViewProps) {
  const filteredHabits = sortHabitsByOrder(
    habits.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250, // wait 250ms hold to activate drag gesture
      tolerance: 8, // slight movement allowed
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);
  const [activeHabit, setActiveHabit] = React.useState<Habit | null>(null);
  
  // High-speed safety system prevents race conditions on rapid clicking of repetitions
  const [loadingHabits, setLoadingHabits] = React.useState<Record<string, boolean>>({});

  const handleDragStartEvent = (event: any) => {
    setActiveHabit(event.active.data.current?.habit || null);
  };

  const handleDragEndEvent = async (event: any) => {
    const { active, over } = event;
    setActiveHabit(null);

    if (!over || !active.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // We swap orders based on targetIndex
    const sortedList = sortHabitsByOrder(filteredHabits);
    const draggedHabit = habits.find(h => h.id === activeId);
    if (!draggedHabit) return;

    const itemsWithoutDragged = sortedList.filter(h => h.id !== activeId);
    const targetIndex = sortedList.findIndex(h => h.id === overId);
    
    if (targetIndex !== -1) {
      const reorderedList = [...itemsWithoutDragged];
      reorderedList.splice(targetIndex, 0, draggedHabit);
      
      const updates = reorderedList.map((h, idx) => ({
        id: h.id,
        order: (idx + 1) * 10
      }));
      await handleReorderHabits(updates);
    }
  };

  // Group same habits backlogs together for a highly elegant layout
  const groupedBacklogs = React.useMemo(() => {
    const list: {
      habitId: string;
      habitName: string;
      streak: number;
      missedDays: { dayIndex: number; label: string; weekday: string; dateLabel: string }[];
    }[] = [];

    habits.forEach(habit => {
      const history = habit.history || [];
      const freq = habit.frequency || 'daily';
      const targetCount = habit.targetCount || 1;
      const missed: { dayIndex: number; label: string; weekday: string; dateLabel: string }[] = [];
      
      if (freq === 'daily') {
        for (let i = 22; i <= 28; i++) {
          if (!history[i]) {
            const daysAgo = 29 - i;
            let label = '';
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            if (daysAgo === 1) {
              label = "Yesterday";
            } else {
              label = `${daysAgo} days ago (${weekday})`;
            }
            
            missed.push({
              dayIndex: i,
              label,
              weekday,
              dateLabel,
            });
          }
        }
      } else if (freq === 'weekly') {
        // Evaluate past weeks (prev1 range & prev2 range)
        const prev1Range = [16, 17, 18, 19, 20, 21, 22];
        const prev2Range = [9, 10, 11, 12, 13, 14, 15];

        const prev1Reps = prev1Range.filter(idx => history[idx]).length;
        const prev2Reps = prev2Range.filter(idx => history[idx]).length;

        if (prev1Reps < targetCount) {
          const shortage = targetCount - prev1Reps;
          let found = 0;
          for (let i = 0; i < prev1Range.length; i++) {
            const dayIdx = prev1Range[i];
            if (!history[dayIdx] && found < shortage) {
              const date = new Date();
              const daysAgo = 29 - dayIdx;
              date.setDate(date.getDate() - daysAgo);
              const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              missed.push({
                dayIndex: dayIdx,
                label: `Last week rep deficit (${weekday})`,
                weekday: `L-W ${found + 1}`,
                dateLabel,
              });
              found++;
            }
          }
        }

        if (prev2Reps < targetCount) {
          const shortage = targetCount - prev2Reps;
          let found = 0;
          for (let i = 0; i < prev2Range.length; i++) {
            const dayIdx = prev2Range[i];
            if (!history[dayIdx] && found < shortage) {
              const date = new Date();
              const daysAgo = 29 - dayIdx;
              date.setDate(date.getDate() - daysAgo);
              const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              missed.push({
                dayIndex: dayIdx,
                label: `2 weeks ago rep deficit (${weekday})`,
                weekday: `2W-A ${found + 1}`,
                dateLabel,
              });
              found++;
            }
          }
        }
      } else if (freq === 'monthly') {
        // Deficit if total repetitions < targetCount
        const monthlyReps = history.filter(Boolean).length;
        if (monthlyReps < targetCount) {
          const shortage = targetCount - monthlyReps;
          let found = 0;
          for (let i = 0; i <= 22; i++) {
            if (!history[i] && found < shortage) {
              const date = new Date();
              const daysAgo = 29 - i;
              date.setDate(date.getDate() - daysAgo);
              const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              missed.push({
                dayIndex: i,
                label: `Monthly rep deficit`,
                weekday: `M-R ${found + 1}`,
                dateLabel,
              });
              found++;
            }
          }
        }
      }

      if (missed.length > 0) {
        // Sort missed so the oldest missed day is at index 0 (tick off oldest first)
        missed.sort((a, b) => a.dayIndex - b.dayIndex);
        list.push({
          habitId: habit.id,
          habitName: habit.name,
          streak: habit.streak,
          missedDays: missed,
        });
      }
    });

    return list;
  }, [habits]);

  const totalMissedCount = React.useMemo(() => {
    return groupedBacklogs.reduce((sum, item) => sum + item.missedDays.length, 0);
  }, [groupedBacklogs]);

  // Handle high-speed tapping/healing action on backlog group
  const handleHealGroupRep = async (habitId: string, dayIndex: number) => {
    if (loadingHabits[habitId]) return;
    setLoadingHabits(prev => ({ ...prev, [habitId]: true }));
    try {
      await toggleHabitToday(habitId, dayIndex);
    } catch (err) {
      console.error("Failed to heal backlog day:", err);
    } finally {
      setLoadingHabits(prev => ({ ...prev, [habitId]: false }));
    }
  };

  return (
    <motion.div 
      key="habits"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col gap-6 pb-24 md:pb-12 select-none"
    >
      {/* Header banner */}
      <div className="flex justify-between items-end border-b border-[#E8E6E1] pb-6 select-none">
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 pointer-events-none">
            Repetition & consistency
          </p>
          <h2 className="font-display-title text-3xl font-semibold text-gray-900 leading-none pointer-events-none">
            Habit Sanctum
          </h2>
          <p className="text-[11px] text-gray-500 font-medium mt-1 pointer-events-none">A quiet, focused space for daily repetition.</p>
        </div>

        {/* Dynamic Overall Consistency Ring */}
        <div className="flex items-center gap-3 select-none">
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
          <div className="flex flex-col leading-none font-sans pointer-events-none">
            <span className="text-xs font-bold text-gray-800">Overall</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Consistency</span>
          </div>
        </div>
      </div>

      {/* Streak Safeguard & Backlog Healing Center */}
      {totalMissedCount > 0 ? (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border border-[#e5dfd3] bg-[#fbfaf7] rounded-xl p-4.5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 p-1.5 rounded-lg text-[#795835]">
                <Zap className="size-4 animate-pulse fill-[#795835]/20 text-[#795835]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  Streak Safeguard Hub <span className="bg-amber-200/60 text-amber-850 px-2 py-0.5 rounded-full text-[9px] font-black">{totalMissedCount} reps left</span>
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Past due days grouped together. Click/tap again and again to rapidly catch up!</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {groupedBacklogs.map((item) => {
              const count = item.missedDays.length;
              const oldestMissed = item.missedDays[0];
              const isLoading = loadingHabits[item.habitId];
              
              return (
                <div 
                  key={item.habitId} 
                  className="bg-white border border-[#E8E6E1] rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-sm hover:border-[#163328]/30 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate text-[12.5px] leading-tight">{item.habitName}</p>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded px-1.5 py-0.5 text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200/60 mt-1.5 leading-none">
                        ⚡ {count} rep{count > 1 ? 's' : ''} left
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8.5px] font-bold text-[#795835] bg-[#795835]/5 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Flame className="size-2.5 text-[#795835] stroke-[2.5]" />
                        {item.streak}d
                      </span>
                    </div>
                  </div>

                  {/* Visual tracker of days list */}
                  <div className="flex flex-wrap gap-1 items-center bg-[#fcfbf9] border border-[#E8E6E1]/50 p-1.5 rounded-lg">
                    {item.missedDays.map((day) => (
                      <button
                        key={day.dayIndex}
                        type="button"
                        onClick={() => handleHealGroupRep(item.habitId, day.dayIndex)}
                        disabled={isLoading}
                        title={`Heal specifically: ${day.label}`}
                        className="bg-white border border-gray-150 rounded px-1.5 py-0.5 text-[8.5px] font-bold text-gray-500 hover:bg-emerald-50 hover:border-[#adcebe] hover:text-[#163328] transition-all flex items-center gap-0.5 disabled:opacity-50 cursor-pointer"
                      >
                        {day.weekday}
                      </button>
                    ))}
                  </div>

                  {/* Fast clicking trigger button */}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleHealGroupRep(item.habitId, oldestMissed.dayIndex)}
                    className={`w-full flex items-center justify-center gap-1.5 font-bold px-2 py-1.8 rounded-lg text-[10px] uppercase tracking-wider transition-all border cursor-pointer select-none ${
                      isLoading 
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-wait'
                        : 'bg-[#163328] hover:bg-[#204939] text-white border-[#163328] shadow-sm hover:shadow active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block size-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="size-3" />
                        Complete Repetition
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : habits.length > 0 && (
        <div className="border border-emerald-100 bg-[#f4fbf7] rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-100 p-1.5 rounded-md text-emerald-800 shrink-0">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-emerald-900 uppercase tracking-wider">Perfect Alignment</h3>
            <p className="text-[10px] text-emerald-700 mt-0.5">Zero backlog sessions! Outstanding streak protection is fully active.</p>
          </div>
        </div>
      )}

      {/* DndContext wrapping Habit Sanctum List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStartEvent}
        onDragEnd={handleDragEndEvent}
      >
        <div className="flex flex-col gap-4">
          {filteredHabits.map(habit => (
            <HabitCard 
              key={habit.id}
              habit={habit}
              toggleHabitToday={toggleHabitToday}
              handleDeleteHabit={handleDeleteHabit}
            />
          ))}

          {filteredHabits.length === 0 && (
            <div className="border border-dashed border-[#E8E6E1] rounded-xl py-12 text-center text-sm text-[#8B8B88] pointer-events-none">
              {habits.length === 0 
                ? 'No habits being tracked. Click "New Habit" to cultivate focus!'
                : 'No habits match your search terms.'}
            </div>
          )}
        </div>

        <DragOverlay zIndex={1000}>
          {activeHabit ? (
            <div 
              style={{ transform: 'rotate(-1.5deg)', boxShadow: '0 20px 40px -8px rgba(121,88,53,0.25)' }}
              className="bg-white border border-[#795835]/40 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden opacity-95 select-none w-full max-w-4xl shadow-lg"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#795835]/70" />
              <div className="flex items-center gap-4 pl-1 pointer-events-none">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {activeHabit.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                    <Flame className="size-3.5 text-[#795835] stroke-[2.5]" />
                    <span className="text-xs font-bold text-gray-700">{activeHabit.streak} Day Streak</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Quick Helper guideline */}
      <div className="p-4 bg-white border border-[#E8E6E1] rounded-xl text-xs text-gray-500 leading-relaxed max-w-xl mx-auto text-center font-medium shadow-sm select-none pointer-events-none">
        🔑 **Why Repetition?** Mindful repetition turns actions into automatic states. Balanced Flow helps you tracks streaks inline to safeguard your spiritual & digital focus limits.
      </div>
    </motion.div>
  );
}
