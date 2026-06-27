import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, MoreHorizontal, Trash2, Sunset, Sparkles, Plus, FolderOpen, Target } from 'lucide-react';
import { Task, ActiveScreen, PrayerTimeslot, TaskCategory, TaskStatus } from '../types';
import { CATEGORY_COLORS } from '../initialData';
import { DndContext, useSensor, useSensors, TouchSensor, MouseSensor, closestCorners, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

// Draggable Task Card for Planner
function PlannerTaskCard({ task, isLibrary, toggleTaskCompleted, setSelectedTask, handleDeleteTask, moveTaskToTodaySlot }: { key?: string | number, task: Task, isLibrary: boolean, toggleTaskCompleted?: any, setSelectedTask?: any, handleDeleteTask?: any, moveTaskToTodaySlot?: any }) {
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: task.id,
    disabled: isLibrary,
    data: { task }
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

  const targetRef = isLibrary ? dragRef : combinedRef;

  if (isLibrary) {
    return (
      <div 
        ref={targetRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group bg-white flex flex-row items-center justify-between border border-[#E8E6E1] p-3.5 rounded-xl transition-all shadow-sm hover:shadow-md gap-3 cursor-grab touch-manipulation relative overflow-hidden ${
          task.completed ? 'opacity-70 bg-gray-50/50' : ''
        }`}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 w-[4px] pointer-events-none"
          style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#163328' }}
        />

        <div className="flex-1 min-w-0 pr-2 pl-1 pointer-events-none">
          <h4 className={`text-sm font-semibold truncate transition-colors ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-[#163328]'}`}>
            {task.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Target className="size-3 text-[#795835]" />
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">
              Target
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
              {task.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pointer-events-none">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleTaskCompleted(task.id); }}
            className={`min-w-[70px] h-7 px-3 text-[9px] rounded-lg border font-bold uppercase tracking-widest transition-all cursor-pointer pointer-events-auto shrink-0 ${
              task.completed 
                ? 'bg-[#163328] text-white border-[#163328] shadow-sm' 
                : 'bg-transparent text-[#163328] border-[#adcebe] hover:bg-[#163328]/5'
            }`}
          >
            {task.completed ? 'Done' : 'Complete'}
          </button>

          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
            className="md:opacity-0 md:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 cursor-pointer pointer-events-auto shrink-0"
            title="Delete target"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Regular Planner task
  return (
    <div 
      ref={targetRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-[#E8E6E1] rounded-xl flex items-start p-4 gap-3.5 shadow-sm transition-all duration-300 relative overflow-hidden group cursor-grab touch-manipulation ${
        task.completed ? 'opacity-60 bg-gray-50/50' : 'hover:shadow-md'
      } ${!isLibrary && isOver ? 'ring-2 ring-emerald-600 bg-emerald-50/20 shadow-inner' : ''}`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-full pointer-events-none"
        style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#163328' }}
      />

      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); toggleTaskCompleted(task.id); }}
        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all outline-none cursor-pointer pointer-events-auto ${
          task.completed 
            ? 'bg-[#163328] border-[#163328] text-white' 
            : 'border-[#c1c8c3] hover:border-[#163328] text-transparent'
        }`}
      >
        {task.completed && <Check className="size-3.5 stroke-[3] text-white" />}
      </button>

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

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
          className="text-gray-400 hover:text-gray-900 duration-150 p-1 hover:bg-gray-50 rounded cursor-pointer pointer-events-auto"
          title="Edit item notes"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
          className="text-gray-400 hover:text-red-600 duration-150 p-1 hover:bg-gray-50 rounded cursor-pointer pointer-events-auto"
          title="Remove item"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// Droppable Prayer Slot
function PrayerSlotDroppable({ 
  slot, 
  computedPrayerTimes, 
  tasksInSlot, 
  toggleTaskCompleted, 
  setSelectedTask, 
  handleDeleteTask,
  handleCreateGoal 
}: { 
  key?: string | number, 
  slot: PrayerTimeslot, 
  computedPrayerTimes: any, 
  tasksInSlot: Task[], 
  toggleTaskCompleted: any, 
  setSelectedTask: any, 
  handleDeleteTask: any,
  handleCreateGoal: (title: string, desc: string, category: TaskCategory, status: TaskStatus, prayerTimeslot?: PrayerTimeslot | null) => Promise<boolean>
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(
    slot === 'Dhuhr' || slot === 'Asr' ? 'Work' : slot === 'Maghrib' ? 'Wellness' : 'Spiritual'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await handleCreateGoal(
        title.trim(),
        `Cultivated inline directly in ${slot}`,
        category,
        'today',
        slot
      );
      if (success) {
        setTitle('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div key={slot} className="flex flex-col">
      {isAdding ? (
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-2 py-2.5 px-3.5 my-1.5 border border-[#163328] bg-white rounded-xl shadow-xs select-none animate-in fade-in duration-200"
        >
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAdding(false);
                setTitle('');
              }
            }}
            placeholder={`Add target to ${slot}...`}
            className="flex-1 text-xs text-[#1C1C1A] bg-transparent focus:outline-none placeholder:text-gray-400 font-medium font-sans min-w-0"
            disabled={isSubmitting}
          />
          
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="text-[10px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-600 focus:outline-none cursor-pointer hover:bg-gray-105 transition-colors shrink-0 font-mono"
            disabled={isSubmitting}
          >
            <option value="Spiritual">Spiritual</option>
            <option value="Work">Work</option>
            <option value="Wellness">Wellness</option>
            <option value="Personal">Personal</option>
            <option value="Admin">Admin</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#163328] hover:bg-[#204436] disabled:opacity-50 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer shrink-0 transition-colors font-sans"
          >
            {isSubmitting ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setTitle('');
            }}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 px-1.5 py-1 text-xs cursor-pointer rounded-lg hover:bg-gray-100/50 hover:text-gray-950 transition-colors font-sans"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div 
          onClick={() => setIsAdding(true)} 
          className="flex items-center gap-3 py-3 select-none cursor-pointer group hover:opacity-90 transition-all"
          title={`Click to quickly add an intention to ${slot}`}
        >
          <div className="flex-1 border-t border-dotted border-[#eabe94] opacity-80 group-hover:border-[#163328]/40" />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent group-hover:bg-[#FAF9F6] rounded-full transition-all border border-transparent group-hover:border-[#E8E6E1]">
            <span className="font-heading-section text-base text-[#795835] font-semibold group-hover:text-[#163328] transition-colors">{slot}</span>
            <span className="text-[10px] text-[#8B8B88] font-bold bg-[#E8E6E1]/50 px-2 py-0.5 rounded-full">
              {computedPrayerTimes[slot]}
            </span>
            <Plus className="size-3.5 text-[#163328] opacity-0 group-hover:opacity-100 transition-all ml-1 shrink-0 scale-95 group-hover:scale-100" />
          </div>
          <div className="flex-1 border-t border-dotted border-[#eabe94] opacity-80 group-hover:border-[#163328]/40" />
        </div>
      )}

      <div 
        ref={setNodeRef}
        className={`flex flex-col gap-3 min-h-[60px] rounded-xl transition-all p-1 -m-1 ${isOver ? 'bg-emerald-50/40 ring-1 ring-[#163328]' : ''}`}
      >
        {tasksInSlot.map(task => (
          <PlannerTaskCard 
            key={task.id} 
            task={task} 
            isLibrary={false} 
            toggleTaskCompleted={toggleTaskCompleted}
            setSelectedTask={setSelectedTask}
            handleDeleteTask={handleDeleteTask}
          />
        ))}

        {tasksInSlot.length === 0 && (
          <div className="border border-dashed border-[#E8E6E1]/80 rounded-xl p-3.5 text-center text-xs text-gray-400 font-medium bg-[#faf9f7]/30 select-none pointer-events-none">
            No intentions assigned to {slot}.
          </div>
        )}
      </div>
    </div>
  );
}

const sortPlannerTasks = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    const orderA = a.order !== undefined && a.order !== null ? a.order : Infinity;
    const orderB = b.order !== undefined && b.order !== null ? b.order : Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
};

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
  handleCreateGoal: (title: string, desc: string, category: TaskCategory, status: TaskStatus, prayerTimeslot?: PrayerTimeslot | null) => Promise<boolean>;
  computedPrayerTimes: Record<PrayerTimeslot, string>;
  loadingPrayerTimes: boolean;
  userLocation: string;
  onOpenSettings: () => void;
  handleReorderTasks: (updates: { id: string; order: number; prayerTimeslot?: PrayerTimeslot }[]) => Promise<void>;
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
  handleReorderTasks,
}: PlannerViewProps) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const [selectedSlot, setSelectedSlot] = useState<PrayerTimeslot>('Fajr');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('Spiritual');
  const [isSlotOpen, setIsSlotOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const handleDragStartEvent = (event: any) => {
    setActiveTask(event.active.data.current?.task || null);
  };

  const handleDragEndEvent = async (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const slotNames = ['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Night'];
    const isSlot = slotNames.includes(overId);

    if (isSlot) {
      const destinationSlot = overId as PrayerTimeslot;
      
      const siblingTasks = sortPlannerTasks(allTasks.filter(t => t.status === 'today' && t.prayerTimeslot === destinationSlot && t.id !== activeId));
      
      const maxOrder = siblingTasks.length > 0 
        ? Math.max(...siblingTasks.map(t => t.order ?? 0)) 
        : 0;
      
      const newOrder = maxOrder + 10;
      await handleReorderTasks([{ id: activeId, order: newOrder, prayerTimeslot: destinationSlot }]);
    } else {
      const targetTask = allTasks.find(t => t.id === overId);
      if (!targetTask || !targetTask.prayerTimeslot) return;

      const destinationSlot = targetTask.prayerTimeslot;
      
      const siblingTasks = sortPlannerTasks(allTasks.filter(t => t.status === 'today' && t.prayerTimeslot === destinationSlot && t.id !== activeId));
      
      const targetIndex = siblingTasks.findIndex(t => t.id === overId);
      if (targetIndex !== -1) {
        const reorderedList = [...siblingTasks];
        const draggedTask = allTasks.find(t => t.id === activeId) || { id: activeId } as Task;
        reorderedList.splice(targetIndex, 0, draggedTask);
        
        const updates = reorderedList.map((task, idx) => ({
          id: task.id,
          order: (idx + 1) * 10,
          ...(task.id === activeId ? { prayerTimeslot: destinationSlot } : {})
        }));
        
        await handleReorderTasks(updates);
      }
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStartEvent}
      onDragEnd={handleDragEndEvent}
    >
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
        </div>        {/* GOAL LIBRARY / WEEKLY TARGETS SECTION */}
        <div className="bg-white border border-[#E8E6E1] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-display-title text-base font-bold text-[#163328] flex items-center gap-1.5">
                <FolderOpen className="size-4 text-[#795835]" /> Goal Library (Weekly Targets)
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">Create unscheduled targets. Check them off as you complete them.</p>
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full">
              {allTasks.filter(t => t.status === 'this-week').length} goals
            </span>
          </div>

          {/* List of library goals */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {allTasks.filter(t => t.status === 'this-week').map((goal) => (
              <PlannerTaskCard 
                key={goal.id} 
                task={goal} 
                isLibrary={true} 
                moveTaskToTodaySlot={moveTaskToTodaySlot}
                handleDeleteTask={handleDeleteTask}
                toggleTaskCompleted={toggleTaskCompleted}
              />
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

        {/* Quick add a Task straight to Planner inline - Reimagined for Mindfulness & Premium UX */}
        <form 
          onSubmit={handleQuickPlannerAddInput} 
          className="bg-white border border-[#E8E6E1] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-5 relative group transition-all duration-300 hover:border-[#163328]/20 hover:shadow-md"
        >
          {/* Aesthetic Emblem / Header */}
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-[#FAF9F6] border border-[#E8E6E1]/50 flex items-center justify-center">
                <Sparkles className="size-3.5 text-[#795835]" />
              </div>
              <span className="text-[10px] font-extrabold text-[#795835] uppercase tracking-widest">
                Mindful Intention Cultivator
              </span>
            </div>
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest hidden sm:inline-block">
              Today's Ritual
            </span>
          </div>

          {/* Intention Title - Spacious & Clean */}
          <div className="w-full relative">
            <input 
              name="plannerTaskTitle"
              type="text" 
              required
              placeholder="What intention will you cultivate today?"
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0 border-b border-gray-100 focus:border-[#795835]/30 pb-2 transition-colors"
            />
          </div>

          {/* Tray of Controls & Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* HIDDEN INPUTS TO DIRECTLY INJECT DATA INTO THE INLINE FORM SUBMISSION */}
              <input type="hidden" name="plannerSlot" value={selectedSlot} />
              <input type="hidden" name="plannerCategory" value={selectedCategory} />

              {/* LIVE TIMESLOT TRIGGER BUTTON */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSlotOpen(!isSlotOpen);
                    setIsCategoryOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-[#FAF9F6] hover:bg-[#F2EFF7] text-gray-700 text-xs font-semibold cursor-pointer select-none transition-all shadow-2xs hover:border-gray-300"
                >
                  <span className="text-xs">🕒</span>
                  <span className="uppercase tracking-widest text-[9px] font-bold text-gray-600">{selectedSlot}</span>
                  <span className="text-[9px] text-gray-400">▼</span>
                </button>

                {/* Timeslot popover list */}
                {isSlotOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSlotOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-[#E8E6E1] rounded-xl shadow-xl py-2 min-w-[160px] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                      <div className="px-3.5 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                        Timeline Target
                      </div>
                      {(['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Night'] as PrayerTimeslot[]).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsSlotOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[#FAF9F6] transition-colors flex items-center justify-between ${selectedSlot === slot ? 'text-[#163328] bg-[#FAF9F6] font-bold' : 'text-gray-600'}`}
                        >
                          <span>{slot}</span>
                          {selectedSlot === slot && <span className="size-1.5 rounded-full bg-[#163328]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* LIVE CATEGORY TRIGGER BUTTON */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsSlotOpen(false);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50/50 text-gray-700 text-xs font-semibold cursor-pointer select-none transition-all shadow-2xs hover:border-gray-300"
                >
                  <span 
                    className="size-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: CATEGORY_COLORS[selectedCategory] || '#163328' }} 
                  />
                  <span className="uppercase tracking-widest text-[9px] font-bold text-gray-600">{selectedCategory}</span>
                  <span className="text-[9px] text-gray-400">▼</span>
                </button>

                {/* Category popover list */}
                {isCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-[#E8E6E1] rounded-xl shadow-xl py-2 min-w-[160px] animate-in fade-in slide-in-from-top-1">
                      <div className="px-3.5 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                        Select Category
                      </div>
                      {(['Spiritual', 'Work', 'Wellness', 'Personal', 'Admin'] as TaskCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-[#FAF9F6] transition-colors flex items-center gap-2 ${selectedCategory === cat ? 'text-[#163328] bg-[#FAF9F6] font-bold' : 'text-gray-600'}`}
                        >
                          <span 
                            className="size-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[cat] || '#163328' }} 
                          />
                          <span>{cat}</span>
                          {selectedCategory === cat && <span className="ml-auto size-1.5 rounded-full bg-[#163328]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* CULTIVATE INTENTION BUTTON */}
            <button 
              type="submit" 
              className="bg-[#163328] hover:bg-[#204436] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
            >
              <Plus className="size-3.5 stroke-[3]" />
              Cultivate Intention
            </button>
          </div>
        </form>

        {/* Prayer Block Timeline */}
        <div className="flex flex-col gap-4">
          {(['Pre-Fajr', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Night'] as PrayerTimeslot[]).map((slot) => {
            const tasksInSlot = sortPlannerTasks(todayTasks.filter(t => t.prayerTimeslot === slot));
            return (
              <PrayerSlotDroppable 
                key={slot}
                slot={slot}
                computedPrayerTimes={computedPrayerTimes}
                tasksInSlot={tasksInSlot}
                toggleTaskCompleted={toggleTaskCompleted}
                setSelectedTask={setSelectedTask}
                handleDeleteTask={handleDeleteTask}
                handleCreateGoal={handleCreateGoal}
              />
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

      <DragOverlay zIndex={1000}>
        {activeTask ? (
          <div className="bg-white border border-[#163328] p-3 w-[280px] rounded-xl flex flex-col gap-1 shadow-2xl opacity-95 rotate-[-2deg]">
            <div 
              className="w-1 absolute left-0 top-3 bottom-3 rounded-r" 
              style={{ backgroundColor: CATEGORY_COLORS[activeTask.category] || '#163328' }}
            />
            <h4 className="font-bold text-xs text-[#1C1C1A] leading-tight line-clamp-1 pl-1.5 pointer-events-none">
              {activeTask.title}
            </h4>
            <div className="flex items-center justify-between text-[8px] font-bold tracking-wider uppercase text-gray-500 pl-1.5 pt-0.5 pointer-events-none">
              <span>{activeTask.category}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
