import React from 'react';
import {
  Sprout,
  MessageSquare,
  BookOpen,
  Settings,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  Store,
  PhoneCall,
  Handshake,
  Landmark,
  CloudSun,
  Package,
  Bell,
} from 'lucide-react';
import { Language, FarmerProfile } from '../types';
import { translations } from '../lib/i18n';
import { FarmpalLogo } from './FarmpalLogo';

export type NavTab =
  | 'crops'
  | 'planning'
  | 'market'
  | 'cooperative'
  | 'credit'
  | 'weather'
  | 'inventory'
  | 'intelligence'
  | 'debtors'
  | 'records'
  | 'whatsapp'
  | 'settings'
  | 'feedback';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  profile: FarmerProfile;
  onLanguageChange: (lang: Language) => void;
  onOpenQuickEntry: () => void;
  onOpenUssdModal?: () => void;
  debtorCount?: number;
  onOpenReminders?: () => void;
  hasActiveReminder?: boolean;
  onOpenFeedbackModal?: () => void;
  onOpenTesterGuide?: () => void;
  onOpenGitHubModal?: () => void;
  feedbackCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  onLanguageChange,
  onOpenQuickEntry,
  onOpenUssdModal,
  debtorCount = 0,
  onOpenReminders,
  hasActiveReminder = true,
  onOpenFeedbackModal,
  onOpenTesterGuide,
  onOpenGitHubModal,
  feedbackCount = 0,
}) => {
  const t = translations[profile.preferredLanguage] || translations.en;

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Tagline */}
          <div
            id="nav-brand-logo"
            className="flex items-center gap-3 cursor-pointer shrink-0 py-1"
            onClick={() => setActiveTab('crops')}
            title="FarmPal Home"
          >
            <FarmpalLogo variant="full" theme="white" size="md" />
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-700/60 hidden sm:inline-block">
              Phase 4
            </span>
          </div>

          {/* Right actions: USSD Offline, Language & Quick Add */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* USSD Simulator Button */}
            {onOpenUssdModal && (
              <button
                onClick={onOpenUssdModal}
                title="Dial *384*24# Offline USSD"
                className="flex items-center gap-1.5 bg-stone-900/80 hover:bg-stone-900 text-emerald-300 border border-emerald-700/60 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">*384*24# USSD</span>
                <span className="md:hidden">USSD</span>
              </button>
            )}

            {/* Language dropdown */}
            <div className="hidden sm:flex items-center text-xs bg-emerald-800/80 rounded-lg px-2 py-1 border border-emerald-700">
              <span className="text-emerald-300 mr-1.5 font-medium">Lang:</span>
              <select
                id="language-selector"
                value={profile.preferredLanguage}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                aria-label="Preferred Language"
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="en" className="bg-emerald-900 text-white">
                  English
                </option>
                <option value="ig" className="bg-emerald-900 text-white">
                  Igbo (Asụsụ)
                </option>
                <option value="yo" className="bg-emerald-900 text-white">
                  Yoruba (Èdè)
                </option>
                <option value="ha" className="bg-emerald-900 text-white">
                  Hausa (Harshe)
                </option>
              </select>
            </div>

            {/* Pilot Testing Guide Button */}
            {onOpenTesterGuide && (
              <button
                id="nav-btn-tester-guide"
                onClick={onOpenTesterGuide}
                title="Farmer Testing Guide & Scenarios"
                className="flex items-center gap-1.5 bg-emerald-800/90 hover:bg-emerald-700 text-emerald-200 hover:text-white border border-emerald-600/70 px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span className="text-xs">🌾</span>
                <span className="hidden lg:inline">Pilot Testing</span>
              </button>
            )}

            {/* Farmer Feedback Modal Trigger Button */}
            {onOpenFeedbackModal && (
              <button
                id="nav-btn-feedback-trigger"
                onClick={onOpenFeedbackModal}
                title="Give Farmer Feedback"
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Feedback</span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </button>
            )}

            {/* GitHub Push / Sync Modal Trigger Button */}
            {onOpenGitHubModal && (
              <button
                id="nav-btn-github-modal"
                onClick={onOpenGitHubModal}
                title="Push to GitHub / Export Codebase"
                className="flex items-center gap-1.5 bg-stone-900/90 hover:bg-stone-900 text-stone-200 hover:text-white border border-stone-700/80 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="hidden md:inline">GitHub</span>
              </button>
            )}

            {/* Daily Reminder Bell Button */}
            {onOpenReminders && (
              <button
                id="nav-btn-reminders"
                onClick={onOpenReminders}
                title="Daily Record Reminders & Check-ins"
                className="relative p-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-700 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {hasActiveReminder && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-emerald-900 animate-pulse" />
                )}
              </button>
            )}

            {/* Quick Add Button */}
            <button
              id="btn-quick-record-entry"
              onClick={onOpenQuickEntry}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Record Entry</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nav Tabs Bar (Scrollable on smaller screens, sleek on desktop) */}
      <div className="bg-emerald-950/90 border-t border-emerald-800/70 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          <button
            id="nav-tab-crops"
            onClick={() => setActiveTab('crops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'crops'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{t.myCrops}</span>
          </button>

          <button
            id="nav-tab-planning"
            onClick={() => setActiveTab('planning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'planning'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Budgets & Tasks</span>
          </button>

          <button
            id="nav-tab-market"
            onClick={() => setActiveTab('market')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'market'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Market Prices</span>
          </button>

          {/* Phase 4: Co-op Hub */}
          <button
            id="nav-tab-cooperative"
            onClick={() => setActiveTab('cooperative')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'cooperative'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Handshake className="w-3.5 h-3.5 text-amber-300" />
            <span>Co-op Hub</span>
            <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full font-bold">
              P4
            </span>
          </button>

          {/* Phase 4: Agri-Credit */}
          <button
            id="nav-tab-credit"
            onClick={() => setActiveTab('credit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-300" />
            <span>Agri-Credit</span>
            <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full font-bold">
              P4
            </span>
          </button>

          {/* Phase 4: Agro-Weather */}
          <button
            id="nav-tab-weather"
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'weather'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5 text-amber-300" />
            <span>Agro-Weather</span>
            <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full font-bold">
              P4
            </span>
          </button>

          {/* Phase 4: Store Inventory */}
          <button
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>Farm Store</span>
            <span className="text-[9px] bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full font-bold">
              P4
            </span>
          </button>

          <button
            id="nav-tab-intelligence"
            onClick={() => setActiveTab('intelligence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'intelligence'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Intelligence</span>
          </button>

          <button
            id="nav-tab-debtors"
            onClick={() => setActiveTab('debtors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer relative ${
              activeTab === 'debtors'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Debtors</span>
            {debtorCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-stone-950 font-bold">
                {debtorCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-records"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'records'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Records</span>
          </button>

          <button
            id="nav-tab-whatsapp"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </button>

          <button
            id="nav-tab-feedback"
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer relative ${
              activeTab === 'feedback'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
            <span>Tester Feedback</span>
            <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-amber-400 text-stone-950 font-bold">
              Pilot
            </span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

