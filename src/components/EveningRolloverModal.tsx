import React from 'react';
import { motion } from 'motion/react';
import { Sunset, X, Sparkles, CheckSquare, Check } from 'lucide-react';
import { Task } from '../types';
import { CATEGORY_COLORS } from '../initialData';

interface EveningRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayTasks: Task[];
  reflectionText: string;
  setReflectionText: (text: string) => void;
  moveTaskToTodaySlot: (taskId: string, slot: "Pre-Fajr") => Promise<void>;
  handleMoveTaskStatus: (taskId: string, status: "inbox" | "this-month" | "someday" | "today") => Promise<void>;
  handleDeleteTask: (taskId: string) => Promise<void>;
  handleCommitRollover: () => Promise<void>;
}

export default function EveningRolloverModal({
  isOpen,
  onClose,
  todayTasks,
  reflectionText,
  setReflectionText,
  moveTaskToTodaySlot,
  handleMoveTaskStatus,
  handleDeleteTask,
  handleCommitRollover,
}: EveningRolloverModalProps) {
  const [rolledOverIds, setRolledOverIds] = React.useState<string[]>([]);

  if (!isOpen) return null;

  const incompleteTasks = todayTasks.filter(t => !t.completed);
  const pendingTasks = incompleteTasks.filter(t => !rolledOverIds.includes(t.id));
  const rolledOverTasks = incompleteTasks.filter(t => rolledOverIds.includes(t.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#F9F8F6]/95 backdrop-blur-md flex flex-col justify-end font-sans">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="w-full max-w-2xl mx-auto h-full md:h-[90vh] md:mt-[10vh] bg-white rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Grab handle bar for drawer feel */}
        <div className="w-full flex justify-center py-3.5 shrink-0 select-none">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Header structure */}
        <header className="px-6 pb-4 pt-2 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-display-title text-2xl font-semibold text-[#163328] leading-none flex items-center gap-2">
              <Sunset className="size-6 text-[#795835]" /> Evening Rollover
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Closing the day with intention and grace.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-all cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Content list scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 pb-24">
          
          {/* Mindful reflection box */}
          <section className="bg-gray-50 border border-[#E8E6E1]/50 p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#795835]" />
              <h3 className="font-heading-section text-sm font-semibold text-[#163328]">Mindful Reflection</h3>
            </div>
            <label className="block mb-2 font-display-title italic text-sm text-gray-600 pl-1">
              "What brought peace today? What will you release?"
            </label>
            <textarea 
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Type your reflection, gratitude list, or focus notes here..."
              className="w-full h-28 p-3 bg-white border border-[#E8E6E1] rounded-lg text-xs leading-relaxed outline-none focus:ring-1 focus:ring-[#163328] placeholder:text-gray-400 resize-none shadow-sm transition-all"
            />
          </section>

          {/* Pending check tasks of today */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-[#795835]" />
                <h3 className="font-heading-section text-sm font-semibold text-gray-900">Pending Intentions</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#8B8B88] bg-gray-100 px-2 py-0.5 rounded-full">
                {pendingTasks.length} Tasks Remaining
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">Review items left incomplete. Choose where they go:</p>

            <div className="space-y-2.5">
              {pendingTasks.map(task => (
                <div 
                  key={task.id}
                  className="bg-white border border-[#E8E6E1] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-xs relative"
                >
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-xl"
                    style={{ backgroundColor: CATEGORY_COLORS[task.category] || '#1c1c1a' }}
                  />
                  <div className="pl-1">
                    <h4 className="text-xs font-bold text-gray-900">{task.title}</h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">{task.category}</p>
                  </div>

                  {/* Action triggers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={async () => {
                        setRolledOverIds(prev => [...prev, task.id]);
                        await moveTaskToTodaySlot(task.id, 'Pre-Fajr');
                      }}
                      className="bg-gray-100 hover:bg-[#163328] hover:text-white transition-colors duration-150 px-3 py-1.5 text-[9px] font-bold text-gray-600 uppercase tracking-widest rounded-lg cursor-pointer"
                    >
                      DO TOMORROW
                    </button>
                    <button 
                      onClick={() => handleMoveTaskStatus(task.id, 'inbox')}
                      className="bg-gray-100 hover:bg-[#795835] hover:text-white transition-colors duration-150 px-3 py-1.5 text-[9px] font-bold text-gray-600 uppercase tracking-widest rounded-lg cursor-pointer"
                    >
                      BACKLOG
                    </button>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-red-50 hover:bg-red-500 hover:text-white transition-colors duration-150 px-3 py-1.5 text-[9px] font-bold text-red-600 uppercase tracking-widest rounded-lg cursor-pointer"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="py-8 text-center bg-[#faf9f7] rounded-xl border border-dashed border-[#E8E6E1]/60 flex flex-col items-center justify-center p-4">
                  <Sparkles className="size-6 text-[#163328] mb-2" />
                  <p className="text-xs text-[#163328] font-bold">Every intention was organized!</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">Your focus is beautifully prepared for tomorrow.</p>
                </div>
              )}
            </div>
          </section>

          {/* Carried Over List Section */}
          {rolledOverTasks.length > 0 && (
            <section className="space-y-3 bg-[#fdfdfd] border border-gray-150/80 p-4 rounded-xl">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🌤️ Carried over to Tomorrow ({rolledOverTasks.length})</span>
                </h4>
              </div>
              <div className="space-y-2">
                {rolledOverTasks.map(task => (
                  <div 
                    key={task.id}
                    className="bg-white border border-gray-150 p-3 rounded-lg flex items-center justify-between gap-3 text-xs shadow-3xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-semibold text-gray-700">{task.title}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setRolledOverIds(prev => prev.filter(id => id !== task.id));
                      }}
                      className="text-[9px] font-bold text-[#795835] hover:text-red-600 uppercase tracking-wider cursor-pointer bg-amber-50 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      Undo
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Serene success image banner */}
          <div className="relative overflow-hidden rounded-2xl h-44 group select-none shadow-sm">
            <img 
              className="absolute inset-0 w-full h-full object-cover brightness-[0.7] focus:outline-none" 
              alt="Physical leather planner next to a ceramic cup under warm lamplight"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLkamH5DsLKCMxpwJG6Ec0BDjCD2j_Xu6KC4-UYcPonwJNhpcRxuIX7Hslmbp97GVXV3fCWhAeSgd2An47uOe-mhef_v8czCPKVn-5BtmpiG2C61Z3bAV1eBCrSAQs_eXym_rQWXRw7qclGM3jiaAzFTFzKUg_aK3J2LN16wM6xkkUFAbz1pP1QXT_DVm7GX4LMy9Vber9X7psFFIJyzDB-IDRsT_uUkSnP5mS699A5AJVMTH0ioHYO_1V8EjczDwhyu6G88ngAr4"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-5">
              <p className="text-white font-serif italic text-xs text-shadow-sm leading-relaxed max-w-md select-none">
                "Peace comes from knowing you have done enough for today."
              </p>
            </div>
          </div>

        </div>

        {/* Footer commits */}
        <footer className="shrink-0 p-5 bg-gradient-to-t from-white via-white/95 to-transparent border-t border-gray-100 flex flex-col gap-3">
          <button 
            onClick={handleCommitRollover}
            className="w-full bg-[#163328] text-white hover:bg-[#2d4a3e] active:scale-[0.98] py-4 rounded-xl text-center font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 group transition-all cursor-pointer"
          >
            <Check className="size-4" />
            <span>Save & Commit Reset</span>
          </button>
          <button 
            onClick={onClose}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 text-center py-2 cursor-pointer"
          >
            Cancel and Return to Dashboard
          </button>
        </footer>

      </motion.div>
    </div>
  );
}
