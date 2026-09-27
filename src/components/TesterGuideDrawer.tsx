import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Share2,
  Smartphone,
  Sparkles,
  MessageSquare,
  PhoneCall,
  TrendingUp,
  Store,
  Landmark,
  RotateCcw,
  QrCode,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { FarmerProfile } from '../types';

interface TesterGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FarmerProfile;
  onOpenFeedback: () => void;
  onOpenWhatsApp: () => void;
  onOpenUssd: () => void;
  onNavigateTab: (tab: any) => void;
  onResetToCleanSlate: () => void;
  onReloadDemoFarm: () => void;
}

interface TestTask {
  id: string;
  title: string;
  category: string;
  instructions: string;
  actionText: string;
  action: () => void;
}

export const TesterGuideDrawer: React.FC<TesterGuideDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenFeedback,
  onOpenWhatsApp,
  onOpenUssd,
  onNavigateTab,
  onResetToCleanSlate,
  onReloadDemoFarm,
}) => {
  const [copied, setCopied] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('farmpal_tester_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => {
      const updated = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      try {
        localStorage.setItem('farmpal_tester_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const shareableUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const tasks: TestTask[] = [
    {
      id: 'task-whatsapp',
      title: '1. Chat & Record via WhatsApp',
      category: 'Input Logging',
      instructions: 'Open the WhatsApp simulator. Type: "Paid ₦15,000 for 2 bags fertilizer" or try a labour expense: "Paid 4 weeders ₦2,500 each". See how it extracts amounts without forms.',
      actionText: 'Open WhatsApp Simulator',
      action: () => {
        onClose();
        onOpenWhatsApp();
      },
    },
    {
      id: 'task-ussd',
      title: '2. Test Offline USSD Dialing (*384*24#)',
      category: 'Rural Access',
      instructions: 'Dial the USSD simulator to test logging an expense or sale as if you had no smartphone data or internet connection.',
      actionText: 'Dial *384*24# USSD',
      action: () => {
        onClose();
        onOpenUssd();
      },
    },
    {
      id: 'task-planning',
      title: '3. Inspect Crop Budgets & Burn Rate',
      category: 'Planning',
      instructions: 'Navigate to Planning. Check how the budget shows actual spending vs benchmark targets for Tomato, Cucumber, and Sweetcorn.',
      actionText: 'View Crop Planning',
      action: () => {
        onClose();
        onNavigateTab('planning');
      },
    },
    {
      id: 'task-market',
      title: '4. Check Mile 12 & Dawanau Prices',
      category: 'Market Intelligence',
      instructions: 'Go to Market Prices. Compare current wholesale prices across Lagos Mile 12, Kano Dawanau, and Ibadan Bodija with haulage margins.',
      actionText: 'View Market Benchmarks',
      action: () => {
        onClose();
        onNavigateTab('market');
      },
    },
    {
      id: 'task-cooperative',
      title: '5. Explore Produce Aggregation & Credit',
      category: 'Financing & Sales',
      instructions: 'Check the Cooperative pooling batch for bulk wholesale transport and generate the Agri-Credit score report.',
      actionText: 'Open Cooperative Tab',
      action: () => {
        onClose();
        onNavigateTab('cooperative');
      },
    },
    {
      id: 'task-feedback',
      title: '6. Submit Your Honest Farmer Feedback',
      category: 'Review',
      instructions: 'Tell us what was easy, what was confusing, and what features you need next for your farm.',
      actionText: 'Give Feedback Now 💬',
      action: () => {
        onClose();
        onOpenFeedback();
      },
    },
  ];

  if (!isOpen) return null;

  const progressPercent = Math.round((completedTasks.length / tasks.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/60 backdrop-blur-2xs transition-opacity">
      <div
        id="tester-guide-drawer"
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-stone-200 overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌾</span>
              <h2 className="text-base font-bold">Farmer Testing Pilot Guide</h2>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Interactive test scenarios for farmers and evaluators
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 shrink-0 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
              <span>Testing Progress:</span>
              <span className="text-emerald-700 font-bold">{completedTasks.length} of {tasks.length} Completed</span>
            </div>
            <div className="w-48 bg-emerald-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenFeedback();
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Give Feedback
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5 overflow-y-auto space-y-5 grow text-stone-800">
          {/* Share with Farmers Box */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-stone-900">Share with Other Farmers</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                Live URL
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Send this link to farmers in your cooperative or cluster so they can test on their Android or iPhone:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="grow bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-700 font-mono select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="p-2.5 bg-white border border-stone-200 rounded-xl text-[11px] text-stone-600 space-y-1">
              <div className="font-semibold text-stone-800 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                Tip for Mobile Phone Testers:
              </div>
              <p>
                Open in Chrome or Safari, tap <strong>Share / Menu</strong> &gt; <strong>&quot;Add to Home screen&quot;</strong>. FarmPal will launch full-screen like a native mobile app!
              </p>
            </div>
          </div>

          {/* Test Tasks List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Recommended Test Scenarios
            </h3>

            {tasks.map((task) => {
              const isDone = completedTasks.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-600 cursor-pointer focus:outline-hidden"
                      title={isDone ? 'Mark uncompleted' : 'Mark completed'}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300" />
                      )}
                    </button>
                    <div className="grow space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-medium text-stone-400 uppercase">
                          {task.category}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {task.instructions}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            toggleTask(task.id);
                            task.action();
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>{task.actionText}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Farm State Controls */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-stone-800">
              Farm Data Settings for Testers
            </h3>
            <p className="text-xs text-stone-600">
              Want to test FarmPal with your own real farm records or reload the Kano demo farm?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onResetToCleanSlate}
                className="grow bg-white border border-stone-300 hover:border-emerald-500 hover:text-emerald-800 text-stone-700 text-xs font-semibold py-2 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                Start Clean Farm Slate
              </button>
              <button
                type="button"
                onClick={onReloadDemoFarm}
                className="grow bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold py-2 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Reload Demo Farm
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 shrink-0 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Tester: <strong className="text-stone-800">{profile.name}</strong> ({profile.location})
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenFeedback();
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Submit Feedback 💬
          </button>
        </div>
      </div>
    </div>
  );
};
