import React, { useState, useEffect } from 'react';
import {
  User,
  Globe,
  Bell,
  CreditCard,
  RotateCcw,
  Check,
  ShieldCheck,
  Smartphone,
  Shuffle,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { FarmerProfile, Language, DailyReminder } from '../types';
import { translations } from '../lib/i18n';
import { playFriendlyChime } from '../lib/sound';

interface SettingsViewProps {
  profile: FarmerProfile;
  onUpdateProfile: (updated: Partial<FarmerProfile>) => Promise<void>;
  onResetSeed: () => Promise<void>;
  onTriggerTestReminder?: () => Promise<void>;
  onOpenGitHubModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onResetSeed,
  onTriggerTestReminder,
  onOpenGitHubModal,
}) => {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);
  const [language, setLanguage] = useState<Language>(profile.preferredLanguage);
  const [dailyReminder, setDailyReminder] = useState(profile.dailyReminderEnabled);
  const [reminderTime, setReminderTime] = useState(profile.dailyReminderTime);
  const [reminderChannel, setReminderChannel] = useState<'whatsapp' | 'in_app' | 'both'>(
    profile.reminderChannel || 'both'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewReminder, setPreviewReminder] = useState<DailyReminder | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load an initial preview reminder
  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async (forceNew = false) => {
    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/reminders/daily?forceNew=${forceNew}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewReminder(data);
      }
    } catch (err) {
      console.error('Error loading reminder preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleShufflePreview = async () => {
    playFriendlyChime();
    await loadPreview(true);
  };

  const t = translations[language] || translations.en;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await onUpdateProfile({
        name,
        phone,
        location,
        preferredLanguage: language,
        dailyReminderEnabled: dailyReminder,
        dailyReminderTime: reminderTime,
        reminderChannel,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        'Reset all crops and records back to initial realistic demonstration seed data?'
      )
    ) {
      await onResetSeed();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900 tracking-tight">Farm Settings & Profile</h2>
        <p className="text-xs text-stone-500">
          Manage your farmer profile, notifications, and language preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Farmer Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Farmer Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                Farm Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Language Preferences Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>Preferred Language</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { code: 'en', label: 'English', sub: 'English' },
              { code: 'ig', label: 'Igbo', sub: 'Asụsụ Igbo' },
              { code: 'yo', label: 'Yoruba', sub: 'Èdè Yorùbá' },
              { code: 'ha', label: 'Hausa', sub: 'Harshen Hausa' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code as Language)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  language === lang.code
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-bold text-stone-900 block">{lang.label}</span>
                <span className="text-[10px] text-stone-500">{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Daily 7:00 PM Reminder */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <Bell className="w-4 h-4 text-emerald-700" />
              <span>Daily Check-in Reminder</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => setDailyReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-900 block">
              Friendly & Relatable Daily Prompts
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">
              FarmPal sends an empathetic check-in asking if you spent on fuel, labour, or inputs, or made any sales today. The wording is culturally relatable and non-repeating (different every single time).
            </p>
          </div>

          {dailyReminder && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Picker */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Reminder Time</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="p-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    />
                    <span className="text-[11px] text-stone-500">Default: 7:00 PM (19:00)</span>
                  </div>
                </div>

                {/* Delivery Channel */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivery Channel</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'both', label: 'Both' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                      { id: 'in_app', label: 'In-App' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setReminderChannel(ch.id as any)}
                        className={`py-1 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          reminderChannel === ch.id
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-stone-50 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Live Reminder Preview (Different Every Time)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleShufflePreview}
                    disabled={previewLoading}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Shuffles to show another unique message"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${previewLoading ? 'animate-spin' : ''}`} />
                    <span>Try Another Message</span>
                  </button>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-1.5">
                  <span className="text-xs font-bold text-emerald-800 block">
                    {previewReminder?.greeting || `Sanu ${name || 'Musa'}! 🌾`}
                  </span>
                  <p className="text-xs text-stone-700 leading-relaxed font-normal">
                    {previewReminder?.message || 'Loading friendly reminder...'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {previewReminder?.quickReplies?.map((qr, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-stone-100 text-stone-700 font-semibold px-2 py-0.5 rounded-md border border-stone-200"
                      >
                        {qr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>✨ 25+ culturally tailored templates with anti-repetition rotation</span>
                  {onTriggerTestReminder && (
                    <button
                      type="button"
                      onClick={onTriggerTestReminder}
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Test In-App Alert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Plan (Phase 4 Commercial & Cooperative Tier) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Subscription & Commercial Tier</span>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Phase 4 Commercial Enterprise
            </span>
          </div>
          <p className="text-xs text-stone-600">
            Full enterprise access unlocked: Wholesale cooperative bulk buying (18–25% savings), guaranteed off-take contracts, pre-qualified single-digit agricultural credit lines (up to ₦3.5M), hyperlocal agro-weather spray telemetry, and storehouse stock alerts.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Co-op Hub</p>
              <p className="text-xs font-bold text-emerald-700">Active</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Bank Credit Desk</p>
              <p className="text-xs font-bold text-emerald-700">Pre-Qualified</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Weather Telemetry</p>
              <p className="text-xs font-bold text-emerald-700">Hyperlocal</p>
            </div>
            <div className="bg-stone-50 p-2 rounded-lg border border-stone-100 text-center">
              <p className="text-[10px] text-stone-500 font-medium">Store Depot</p>
              <p className="text-xs font-bold text-emerald-700">Reconciled</p>
            </div>
          </div>
        </div>

        {/* Developer & GitHub Integration Section */}
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub & Source Code Sync</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
              branch: main
            </span>
          </div>

          <p className="text-xs text-stone-300">
            Push this codebase directly to your personal or organization GitHub repository, or export an offline zip archive with all components, full server, models, and dependencies.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {onOpenGitHubModal && (
              <button
                type="button"
                onClick={onOpenGitHubModal}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Push to GitHub</span>
              </button>
            )}

            <a
              href="/api/github/export-zip"
              download="farmpal-source.zip"
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
            >
              <span>Download ZIP (.zip)</span>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sample Farm Data</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
