import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArchiveRestore, Trash2, RefreshCcw } from 'lucide-react';
import { Task } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedTasks: Task[];
  onRestore: (taskId: string) => Promise<void>;
  onPermanentDelete: (taskId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

export function TrashModal({ isOpen, onClose, deletedTasks, onRestore, onPermanentDelete, onEmptyTrash }: TrashModalProps) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#F9F8F6] w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
      >
        <div className="border-b border-[#E8E6E1] p-4 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Trash2 className="size-5 text-red-500" />
            <h2 className="font-display-title text-xl font-bold text-gray-900 leading-none">Trash</h2>
          </div>
          <div className="flex items-center gap-2.5">
            {deletedTasks.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (confirmEmpty) {
                    await onEmptyTrash();
                    setConfirmEmpty(false);
                  } else {
                    setConfirmEmpty(true);
                  }
                }}
                onMouseLeave={() => setConfirmEmpty(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer rounded-lg border h-8.5 select-none ${
                  confirmEmpty 
                    ? 'text-white bg-red-700 border-red-700 hover:bg-red-800' 
                    : 'text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600'
                }`}
                title={confirmEmpty ? "Click once more to confirm permanent erasure" : "Permanently erase all items presently in trash"}
              >
                <Trash2 className="size-3.5" />
                <span>{confirmEmpty ? 'Click to confirm' : 'Empty Trash'}</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-red-50/50 border-b border-red-100 shrink-0">
          <p className="text-[11px] text-red-800 font-medium leading-relaxed">
            Items in trash will be permanently deleted after 7 days.
          </p>
        </div>

        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
          {deletedTasks.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
              <Trash2 className="size-8 mb-3" />
              <p className="text-sm font-medium">Trash is empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {deletedTasks.map((task) => {
                const daysLeft = task.deletedAt ? Math.max(0, 7 - Math.floor((Date.now() - task.deletedAt) / (1000 * 60 * 60 * 24))) : 7;
                return (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-3 rounded-xl border border-[#E8E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{task.title}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        <span className="font-bold uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                          {task.category}
                        </span>
                        {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => onRestore(task.id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-[#163328] hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Restore task"
                      >
                        <RefreshCcw className="size-3.5" />
                        Restore
                      </button>
                      <button 
                        onClick={() => onPermanentDelete(task.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete permanently"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
