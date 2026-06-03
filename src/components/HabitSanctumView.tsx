import React from 'react';
import { motion } from 'motion/react';
import { Flame, Trash2 } from 'lucide-react';
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
  toggleHabitToday: (habitId: string) => Promise<void>;
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
  toggleHabitToday: (id: string) => Promise<void>;
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

  return (
    <div 
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden group cursor-grab active:cursor-grabbing select-none hover:shadow-md ${
        isOver ? 'ring-2 ring-emerald-600 bg-emerald-50/20 border-emerald-600' : 'border-[#E8E6E1]'
      }`}
    >
      {/* Left category indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#795835]/70" />

      {/* Habit Info & Streak counter */}
      <div className="flex items-center gap-4 w-full lg:w-64 shrink-0 pl-1 pointer-events-none select-none">
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
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-2 pointer-events-none select-none">Last 7 Days:</span>
          
          {[23, 24, 25, 26, 27, 28].map((dayIndex) => {
            const wasCompleted = habit.history[dayIndex];
            return (
              <div 
                key={dayIndex}
                className={`size-4.5 rounded-md transition-colors pointer-events-none select-none ${
                  wasCompleted 
                    ? 'bg-[#adcebe] border border-[#adcebe]' 
                    : 'bg-gray-100 border border-gray-200'
                }`}
                title={wasCompleted ? 'Completed Day' : 'Missed Day'}
              />
            );
          })}

          <div className="w-px h-5 bg-gray-200 mx-1.5 pointer-events-none select-none" />

          {/* Today Toggler Button (index 29) */}
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              toggleHabitToday(habit.id);
            }}
            className={`min-w-[64px] h-7 px-3 text-[10px] rounded-lg border font-bold uppercase tracking-widest transition-all cursor-pointer ${
              isCompletedToday 
                ? 'bg-[#163328] text-white border-[#163328] shadow-sm' 
                : 'bg-transparent text-[#163328] border-[#adcebe] hover:bg-[#163328]/5'
            }`}
          >
            {isCompletedToday ? 'Done' : 'Complete'}
          </button>
        </div>
        <p className="text-[9px] text-[#8B8B88] font-semibold text-right w-full hidden lg:block pointer-events-none select-none">
          Tap "complete" to maintain your streak live.
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

  return (
    <motion.div 
      key="habits"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6 md:p-10 max-w-4xl mx-auto w-full flex flex-col gap-8 pb-24 md:pb-12 select-none"
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
              className="bg-white border border-[#795835]/40 p-5 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden opacity-95 select-none w-full max-w-4xl shadow-lg"
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
