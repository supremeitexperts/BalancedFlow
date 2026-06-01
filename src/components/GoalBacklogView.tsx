import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Sunset } from 'lucide-react';
import { Task, TaskStatus, PrayerTimeslot } from '../types';
import { CATEGORY_COLORS } from '../initialData';

interface GoalBacklogViewProps {
  filteredTasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  moveTaskToTodaySlot: (taskId: string, slot: PrayerTimeslot) => Promise<void>;
  handleDragStart: (e: React.DragEvent, taskId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent | null, status: TaskStatus, manualTaskId?: string) => Promise<void>;
  handleUpdateTaskDetail: (updated: Task) => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
}

export default function GoalBacklogView({
  filteredTasks,
  selectedTask,
  setSelectedTask,
  moveTaskToTodaySlot,
  handleDragStart,
  handleDragOver,
  handleDragEnter,
  handleDrop,
  handleUpdateTaskDetail,
  handleDeleteTask,
}: GoalBacklogViewProps) {
  // Columns Definition
  const statuses: { key: TaskStatus; label: string; desc: string; dotColor: string }[] = [
    { key: 'inbox', label: 'Inbox', desc: 'Unprocessed Ambitions', dotColor: 'bg-gray-400' },
    { key: 'this-week', label: 'This Week', desc: 'Weekly Targets', dotColor: 'bg-[#163328]' },
    { key: 'this-month', label: 'This Month', desc: 'Active targets', dotColor: 'bg-[#adcebe]' },
    { key: 'someday', label: 'Someday', desc: 'Future dreams', dotColor: 'bg-[#795835]' },
  ];

  // Touch Drag-And-Drop State Managers for Mobile
  const [touchActiveTaskId, setTouchActiveTaskId] = useState<string | null>(null);
  const [touchOverColumn, setTouchOverColumn] = useState<TaskStatus | null>(null);
  const [touchCoords, setTouchCoords] = useState<{ x: number; y: number } | null>(null);
  const [draggedTaskObj, setDraggedTaskObj] = useState<Task | null>(null);

  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    const touch = e.touches[0];
    setTouchActiveTaskId(task.id);
    setDraggedTaskObj(task);
    setTouchCoords({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActiveTaskId) return;
    // VERY IMPORTANT: preventDefault stops the page from scrolling while dragging
    // Wait, React synthetic event preventDefault doesn't work for touchmove if passive by default. 
    // We might have to handle this in a non-react way, or just disable scrolling on the container.
    // Instead of messing with touch coords natively, let me fix the drag.
    const touch = e.touches[0];
    setTouchCoords({ x: touch.clientX, y: touch.clientY });

    // Look up column element currently situated under the touch locator
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const colEl = element.closest('[data-column-status]');
      if (colEl) {
        const colKey = colEl.getAttribute('data-column-status') as TaskStatus;
        if (colKey && colKey !== touchOverColumn) {
          setTouchOverColumn(colKey);
        }
      } else {
        setTouchOverColumn(null);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!touchActiveTaskId) return;
    if (touchOverColumn) {
      await handleDrop(null, touchOverColumn, touchActiveTaskId);
    }
    // Clean states safely
    setTouchActiveTaskId(null);
    setTouchOverColumn(null);
    setTouchCoords(null);
    setDraggedTaskObj(null);
  };

  return (
    <motion.div 
      key="backlog"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex overflow-hidden relative"
    >
      {/* Kanban Board Container */}
      <div className="flex-1 flex overflow-x-auto p-4 md:p-8 gap-6 items-start h-full no-scrollbar select-none">
        {statuses.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.key);
          const isHighlighted = touchOverColumn === col.key;

          return (
            <div 
              key={col.key}
              data-column-status={col.key}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => handleDrop(e, col.key)}
              className={`flex flex-col w-[310px] shrink-0 h-full rounded-xl p-1.5 border-2 transition-all duration-150 ${
                isHighlighted 
                  ? 'border-[#163328] bg-emerald-50/20 scale-[1.01] shadow-2xs' 
                  : 'border-transparent'
              } ${
                col.key === 'someday' ? 'bg-black/[0.008] border-dashed border-gray-150 p-2' : ''
              }`}
            >
              {/* Column Header */}
              <div className="sticky top-0 bg-[#F9F8F6] z-10 pb-3 flex items-center justify-between border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-display-title leading-tight">{col.label}</h3>
                  <p className="text-[11px] text-[#8B8B88] font-semibold uppercase mt-0.5 tracking-wider">{col.desc}</p>
                </div>
                <span className={`text-xs font-extrabold size-5 rounded-full flex items-center justify-center shrink-0 ${
                  (col.key === 'this-month' || col.key === 'this-week') ? 'bg-[#adcebe] text-[#022016]' : 'bg-gray-200 text-gray-650'
                }`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Stack of Cards */}
              <div className="flex flex-col gap-3 py-3 overflow-y-auto max-h-[calc(100vh-170px)] h-auto select-none">
                {colTasks.map(task => {
                  const isTouchDraggingThis = touchActiveTaskId === task.id;

                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      onTouchStart={(e) => handleTouchStart(e, task)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`bg-white p-4 rounded-xl border border-gray-100 hover:border-gray-200 shadow-sm cursor-grab hover:shadow-md transition-all relative group ${
                        isTouchDraggingThis ? 'opacity-40 scale-95 touch-none' : ''
                      }`}
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
                        style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#163328' }}
                      />
                      <h4 className="font-bold text-sm text-[#1C1C1A] leading-tight select-none">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-1.5 font-sans">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#f0f4f3] text-gray-600 rounded">
                          {task.category}
                        </span>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTaskToTodaySlot(task.id, 'Pre-Fajr');
                          }}
                          className="opacity-0 group-hover:opacity-100 duration-150 text-xs text-[#163328] bg-[#adcebe]/40 hover:bg-[#adcebe] font-bold tracking-wider uppercase px-2 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                        >
                          <Clock className="size-2.5" /> Schedule
                        </button>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                    {col.key === 'someday' ? (
                      <>
                        <Sunset className="size-8 text-gray-350 mb-2" />
                        <p className="text-xs text-[#8B8B88] font-medium leading-normal">
                          Clear head space.<br />Drop future ideas here.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#8B8B88] font-medium leading-normal italic">
                        {col.key === 'inbox' ? 'Empty mind' : 'No active targets'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING GHOST ELEMENT SEATED DIRECTLY UNDER USER FINGER DURING TOUCH-DRAGS */}
      {touchActiveTaskId && draggedTaskObj && touchCoords && (
        <div 
          style={{
            position: 'fixed',
            left: `${touchCoords.x - 110}px`,
            top: `${touchCoords.y - 45}px`,
            width: '220px',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: 0.93,
            transform: 'scale(1.02) rotate(-1deg)',
            boxShadow: '0 25px 50px -12px rgba(13,30,23,0.3)',
          }}
          className="bg-white border border-[#163328] p-3 rounded-xl flex flex-col gap-1 select-none transition-transform"
        >
          <div 
            className="w-1 absolute left-0 top-3 bottom-3 rounded-r" 
            style={{ backgroundColor: CATEGORY_COLORS[draggedTaskObj.category] || '#163328' }}
          />
          <h4 className="font-bold text-xs text-[#1C1C1A] leading-tight line-clamp-1 pl-1.5">
            {draggedTaskObj.title}
          </h4>
          <div className="flex items-center justify-between text-[8px] font-bold tracking-wider uppercase text-gray-500 pl-1.5 pt-0.5">
            <span>{draggedTaskObj.category}</span>
            {touchOverColumn && (
              <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-md font-extrabold normal-case">
                Move to → {touchOverColumn === 'inbox' ? 'Inbox' : touchOverColumn === 'this-week' ? 'Week' : touchOverColumn === 'this-month' ? 'Month' : 'Someday'}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
