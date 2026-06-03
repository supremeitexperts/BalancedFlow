import React from 'react';
import { motion } from 'motion/react';
import { Clock, Sunset, Check, Trash2, ListTodo, X, FolderCheck } from 'lucide-react';
import { Task, TaskStatus, PrayerTimeslot } from '../types';
import { CATEGORY_COLORS } from '../initialData';
import { DndContext, useSensor, useSensors, TouchSensor, MouseSensor, closestCorners, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';

interface GoalBacklogViewProps {
  filteredTasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  moveTaskToTodaySlot: (taskId: string, slot: PrayerTimeslot) => Promise<void>;
  handleDrop: (e: React.DragEvent | null, status: TaskStatus, manualTaskId?: string) => Promise<void>;
  handleUpdateTaskDetail: (updated: Task) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  onCreateGoal: (title: string, desc: string, category: any, status: TaskStatus) => Promise<boolean>;
  handleReorderTasks: (updates: { id: string; order: number; prayerTimeslot?: PrayerTimeslot | null; status?: TaskStatus }[]) => Promise<void>;
}

const sortBacklogTasks = (tasks: Task[]): Task[] => {
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

// Draggable & Droppable Card Component
function TaskCard({ 
  task, 
  setSelectedTask, 
  handleToggleComplete, 
  handleDeleteTask,
  handleUpdateTaskDetail 
}: { 
  key?: string | number,
  task: Task, 
  setSelectedTask: any, 
  handleToggleComplete: any, 
  handleDeleteTask: any,
  handleUpdateTaskDetail: any 
}) {
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: task.id,
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

  const [isSubtasksExpanded, setIsSubtasksExpanded] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');

  const toggleSubtask = async (subId: string) => {
    if (!task.subtasks) return;
    const list = task.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    await handleUpdateTaskDetail({ ...task, subtasks: list });
  };

  const deleteSubtask = async (subId: string) => {
    if (!task.subtasks) return;
    const list = task.subtasks.filter(s => s.id !== subId);
    await handleUpdateTaskDetail({ ...task, subtasks: list });
  };

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: 'sub_' + Date.now(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    const list = task.subtasks ? [...task.subtasks, newSub] : [newSub];
    await handleUpdateTaskDetail({ ...task, subtasks: list });
    setNewSubtaskTitle('');
  };

  const totalSubs = task.subtasks?.length || 0;
  const completedSubs = task.subtasks?.filter(s => s.completed).length || 0;
  const percent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

  return (
    <div 
      ref={combinedRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTask(task)}
      className={`bg-white p-4 rounded-xl border border-gray-150 hover:border-gray-250 shadow-xs cursor-grab hover:shadow-md transition-all relative group touch-manipulation flex flex-col gap-1 select-none ${
        isOver ? 'ring-2 ring-emerald-600 bg-emerald-50/20 shadow-inner' : ''
      }`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-[4.5px] rounded-l-xl"
        style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#163328' }}
      />
      <h4 className="font-bold text-sm text-[#1C1C1A] leading-tight select-none pointer-events-none pr-1">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-[11px] text-gray-500 leading-relaxed pointer-events-none line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-2 flex-wrap gap-1.5 font-sans">
        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-[#f0f4f3] text-gray-600 rounded pointer-events-none select-none">
          {task.category}
        </span>
        
        {/* Hover Controls for Desktop / Always Visible for Mobile */}
        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 duration-150 flex items-center gap-1.5 pointer-events-auto shrink-0">
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={async (e) => {
              e.stopPropagation();
              await handleToggleComplete(task.id);
            }}
            className="text-[10px] text-white bg-[#163328] hover:bg-[#2c4c3f] font-bold tracking-wider uppercase px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Check className="size-3" /> Complete
          </button>
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={async (e) => {
              e.stopPropagation();
              await handleDeleteTask(task.id);
            }}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
            title="Delete Goal"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Internal Subtasks Accordion & Form */}
      <div className="mt-2 text-xs font-sans pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1 font-bold text-[10px] text-gray-500 uppercase tracking-wide select-none">
            <ListTodo className="size-3.5 text-[#163328]" />
            {totalSubs > 0 ? `${completedSubs}/${totalSubs} subtasks` : 'subtasks'}
          </span>
          <button 
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsSubtasksExpanded(!isSubtasksExpanded); }}
            className="text-[9px] font-bold text-[#163328] bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded cursor-pointer select-none"
          >
            {isSubtasksExpanded ? 'Hide' : totalSubs > 0 ? 'Edit' : '+ Add'}
          </button>
        </div>
        
        {totalSubs > 0 && !isSubtasksExpanded && (
          <div className="w-full bg-gray-100 h-1 rounded-full mt-2 overflow-hidden pointer-events-none">
            <div className="bg-[#163328] h-full transition-all duration-300" style={{ width: `${percent}%` }} />
          </div>
        )}

        {isSubtasksExpanded && (
          <div className="mt-2 flex flex-col gap-1.5 bg-[#F9F8F6] p-2.5 rounded-lg border border-gray-150">
            {task.subtasks && task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2 group/sub py-0.5 select-none">
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input 
                    type="checkbox"
                    checked={sub.completed}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={async (e) => {
                      e.stopPropagation();
                      await toggleSubtask(sub.id);
                    }}
                    className="size-3.5 rounded border-gray-300 text-[#163328] focus:ring-[#163328] cursor-pointer"
                  />
                  <span className={`text-[11px] truncate ${sub.completed ? 'line-through text-gray-400 font-medium' : 'text-gray-700 font-medium'}`}>
                    {sub.title}
                  </span>
                </label>
                <button 
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await deleteSubtask(sub.id);
                  }}
                  className="opacity-0 group-hover/sub:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addSubtask();
              }}
              className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-gray-200/60"
            >
              <input 
                type="text"
                value={newSubtaskTitle}
                onPointerDown={(e) => e.stopPropagation()}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add item..."
                className="flex-1 text-[11px] bg-white border border-gray-250 rounded-md px-2 py-1 focus:outline-none focus:border-[#163328]"
              />
              <button 
                type="submit"
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-[#163328] text-white hover:bg-[#2a483e] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Completed task strip inside column's footer folder
function CompletedTaskRow({ 
  task, 
  handleToggleComplete, 
  handleDeleteTask 
}: { 
  key?: string | number,
  task: Task, 
  handleToggleComplete: any, 
  handleDeleteTask: any 
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-gray-50/75 p-2.5 rounded-lg border border-gray-150 relative select-none">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg bg-gray-300" />
      <div className="flex items-center gap-2 pl-1.5 flex-1 min-w-0 select-none">
        <input 
          type="checkbox" 
          checked={true}
          onChange={async (e) => {
            e.stopPropagation();
            await handleToggleComplete(task.id);
          }}
          className="size-3.5 rounded border-gray-300 text-gray-400 focus:ring-gray-400 cursor-pointer"
        />
        <span className="text-xs text-gray-400 line-through font-medium truncate flex-1 leading-tight">
          {task.title}
        </span>
      </div>
      <button 
        onClick={async (e) => {
          e.stopPropagation();
          await handleDeleteTask(task.id);
        }}
        className="text-gray-350 hover:text-red-500 p-1 rounded transition-colors cursor-pointer shrink-0"
        title="Permanently Delete Goal"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// Droppable Column Component
function Column({ 
  col, 
  tasks, 
  setSelectedTask, 
  onCreateGoal, 
  handleToggleComplete, 
  handleDeleteTask,
  handleUpdateTaskDetail 
}: { 
  key?: string | number,
  col: any, 
  tasks: Task[], 
  setSelectedTask: any, 
  onCreateGoal: any,
  handleToggleComplete: any,
  handleDeleteTask: any,
  handleUpdateTaskDetail: any
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: col.key,
  });

  const [quickTitle, setQuickTitle] = React.useState('');
  const [quickCategory, setQuickCategory] = React.useState<any>('Work');
  const [isCompletedExpanded, setIsCompletedExpanded] = React.useState(false);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const success = await onCreateGoal(quickTitle.trim(), '', quickCategory, col.key);
    if (success) {
      setQuickTitle('');
      setQuickCategory('Work');
    }
  };

  const activeColTasks = sortBacklogTasks(tasks.filter(t => !t.completed));
  const completedColTasks = tasks.filter(t => t.completed);

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col w-full md:w-[330px] shrink-0 h-full rounded-xl p-3 border-2 transition-all duration-150 ${
        isOver 
          ? 'border-[#163328] bg-[#163328]/[0.02] scale-[1.015] shadow-xs' 
          : 'border-transparent'
      } ${
        col.key === 'someday' ? 'bg-black/[0.005] border-dashed border-gray-200' : 'bg-gray-50/20'
      }`}
    >
      {/* Header element */}
      <div className="sticky top-0 bg-[#F9F8F6] z-10 pb-3.5 flex items-center justify-between border-b border-gray-200 select-none">
        <div>
          <h3 className="text-base font-bold text-[#1C1C1A] font-display-title leading-tight pointer-events-none">{col.label}</h3>
          <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-0.5 tracking-wider pointer-events-none">{col.desc}</p>
        </div>
        <span className={`text-[11px] font-extrabold size-[21px] rounded-full flex items-center justify-center shrink-0 pointer-events-none ${
          col.key === 'this-month' ? 'bg-[#adcebe] text-[#022016]' : 'bg-gray-200 text-gray-650'
        }`}>
          {activeColTasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 py-3 overflow-y-auto max-h-[calc(100vh-170px)] h-auto select-none no-scrollbar flex-1">
        {col.key === 'inbox' && (
          <form onSubmit={handleQuickSubmit} className="bg-white p-3 rounded-xl border border-gray-150 hover:border-gray-200 shadow-xs flex flex-col gap-2 transition-all">
            <input 
              type="text" 
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="+ Quick add processing..."
              className="w-full text-xs bg-[#F9F8F6] border-0 outline-none focus:bg-white focus:ring-1 focus:ring-[#163328]/30 px-2.5 py-2 rounded-lg"
            />
            {quickTitle.trim().length > 0 && (
              <div className="flex items-center justify-between gap-2 mt-1">
                <select 
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="Work">💼 Work</option>
                  <option value="Spiritual">🌙 Spiritual</option>
                  <option value="Wellness">🌱 Wellness</option>
                  <option value="Personal">🏡 Personal</option>
                  <option value="Admin">⚙️ Admin</option>
                  <option value="Milestone">🎯 Milestone</option>
                  <option value="Growth">📈 Growth</option>
                  <option value="Rest">🧸 Rest</option>
                </select>
                <button 
                  type="submit" 
                  className="text-[10px] font-bold uppercase tracking-wider bg-[#163328] hover:bg-[#2c4c3f] active:scale-95 text-white px-3 py-1.5 rounded-md shadow-xs transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            )}
          </form>
        )}

        {/* Render active tasks mapped inside standard column list */}
        {activeColTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            setSelectedTask={setSelectedTask} 
            handleToggleComplete={handleToggleComplete}
            handleDeleteTask={handleDeleteTask}
            handleUpdateTaskDetail={handleUpdateTaskDetail}
          />
        ))}

        {activeColTasks.length === 0 && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            {col.key === 'someday' ? (
              <>
                <Sunset className="size-8 text-gray-350 mb-2" />
                <p className="text-xs text-[#8B8B88] font-semibold leading-normal">
                  Clear head space.<br />Drop future ideas here.
                </p>
              </>
            ) : (
              <p className="text-xs text-[#8B8B88] font-semibold leading-normal italic">
                {col.key === 'inbox' ? 'Empty mind' : 'No active targets'}
              </p>
            )}
          </div>
        )}

        {/* Beautiful bottom completed accordion folder */}
        {completedColTasks.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-gray-200">
            <button 
              type="button"
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              className="w-full flex items-center justify-between text-[10px] text-gray-400 hover:text-gray-700 font-extrabold tracking-widest uppercase py-1 focus:outline-none cursor-pointer"
            >
              <span className="flex items-center gap-1.5 matches-design select-none">
                <FolderCheck className="size-4" />
                Completed ({completedColTasks.length})
              </span>
              <span>{isCompletedExpanded ? '▲' : '▼'}</span>
            </button>
            
            {isCompletedExpanded && (
              <div className="flex flex-col gap-2 mt-2 pt-1">
                {completedColTasks.map(task => (
                  <CompletedTaskRow 
                    key={task.id}
                    task={task}
                    handleToggleComplete={handleToggleComplete}
                    handleDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoalBacklogView({
  filteredTasks,
  selectedTask,
  setSelectedTask,
  moveTaskToTodaySlot,
  handleDrop,
  onCreateGoal,
  handleUpdateTaskDetail,
  handleDeleteTask,
  handleReorderTasks,
}: GoalBacklogViewProps) {
  const statuses: { key: TaskStatus; label: string; desc: string; dotColor: string }[] = [
    { key: 'inbox', label: 'Inbox', desc: 'Unprocessed Ambitions', dotColor: 'bg-gray-400' },
    { key: 'this-month', label: 'This Month', desc: 'Active targets', dotColor: 'bg-[#adcebe]' },
    { key: 'someday', label: 'Someday', desc: 'Future dreams', dotColor: 'bg-[#795835]' },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const handleDragStartEvent = (event: any) => {
    setActiveTask(event.active.data.current?.task || null);
  };

  const handleDragEndEvent = async (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !active.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const columnsToShow = isMobile ? ['inbox', 'this-month', 'someday'] : ['inbox', 'this-month'];
    const isColumnTarget = columnsToShow.includes(overId);

    if (isColumnTarget) {
      const destinationStatus = overId as TaskStatus;
      const siblingTasks = sortBacklogTasks(filteredTasks.filter(t => t.status === destinationStatus && !t.completed && t.id !== activeId));
      const maxOrder = siblingTasks.length > 0 
        ? Math.max(...siblingTasks.map(t => t.order ?? 0)) 
        : 0;
      const newOrder = maxOrder + 10;
      await handleReorderTasks([{ id: activeId, order: newOrder, status: destinationStatus }]);
    } else {
      const targetTask = filteredTasks.find(t => t.id === overId);
      if (!targetTask) return;

      const destinationStatus = targetTask.status;
      const siblingTasks = sortBacklogTasks(filteredTasks.filter(t => t.status === destinationStatus && !t.completed && t.id !== activeId));
      
      const targetIndex = siblingTasks.findIndex(t => t.id === overId);
      if (targetIndex !== -1) {
        const reorderedList = [...siblingTasks];
        const draggedTask = filteredTasks.find(t => t.id === activeId) || { id: activeId } as Task;
        reorderedList.splice(targetIndex, 0, draggedTask);
        
        const updates = reorderedList.map((task, idx) => ({
          id: task.id,
          order: (idx + 1) * 10,
          status: destinationStatus
        }));
        await handleReorderTasks(updates);
      }
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId);
    if (task) {
      await handleUpdateTaskDetail({ ...task, completed: !task.completed });
    }
  };

  const activeStatuses = statuses.filter(s => 
    isMobile ? ['inbox', 'this-month', 'someday'].includes(s.key) : ['inbox', 'this-month'].includes(s.key)
  );

  return (
    <motion.div 
      key="backlog"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex overflow-hidden relative"
    >
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStartEvent}
        onDragEnd={handleDragEndEvent}
      >
        <div className={`flex-1 flex ${isMobile ? 'overflow-x-auto justify-start p-4 gap-6' : 'md:grid md:grid-cols-2 md:max-w-5xl md:mx-auto md:w-full md:p-8 md:gap-8'} items-start h-full no-scrollbar select-none`}>
          {activeStatuses.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <Column 
                key={col.key} 
                col={col} 
                tasks={colTasks} 
                setSelectedTask={setSelectedTask} 
                onCreateGoal={onCreateGoal}
                handleToggleComplete={handleToggleComplete}
                handleDeleteTask={handleDeleteTask}
                handleUpdateTaskDetail={handleUpdateTaskDetail}
              />
            );
          })}
        </div>

        <DragOverlay zIndex={1000}>
          {activeTask ? (
            <div 
              style={{ transform: 'rotate(-1.5deg)', boxShadow: '0 20px 40px -8px rgba(13,30,23,0.25)' }}
              className="bg-white border border-[#163328] p-4.5 w-[290px] rounded-xl flex flex-col gap-1 select-none opacity-95"
            >
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
    </motion.div>
  );
}
