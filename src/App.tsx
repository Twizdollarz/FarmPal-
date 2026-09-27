import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { CropDetailModal } from './components/CropDetailModal';
import { QuickEntryModal } from './components/QuickEntryModal';
import { NewCropModal } from './components/NewCropModal';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { RecordsLedger } from './components/RecordsLedger';
import { SettingsView } from './components/SettingsView';
import { FinancialIntelligenceView } from './components/FinancialIntelligenceView';
import { DebtorsTracker } from './components/DebtorsTracker';
import { FarmFinancialHealthCardModal } from './components/FarmFinancialHealthCardModal';
import { PlanningView } from './components/PlanningView';
import { MarketPriceView } from './components/MarketPriceView';
import { UssdSimulatorModal } from './components/UssdSimulatorModal';
import { CooperativeView } from './components/CooperativeView';
import { AgriCreditView } from './components/AgriCreditView';
import { WeatherAdvisoryView } from './components/WeatherAdvisoryView';
import { InventoryView } from './components/InventoryView';
import { DailyReminderNotification } from './components/DailyReminderNotification';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { FarmerFeedbackModal } from './components/FarmerFeedbackModal';
import { TesterGuideDrawer } from './components/TesterGuideDrawer';
import { TesterFeedbackView } from './components/TesterFeedbackView';
import { MessageSquare, Sparkles } from 'lucide-react';
import {
  Crop,
  CropFinancials,
  FarmSummary,
  Expense,
  SaleRecord,
  HarvestRecord,
  LabourRecord,
  ExpenseCategory,
  FarmerProfile,
  Language,
  CropComparison,
  DebtorSummary,
  CashflowMonth,
  FarmFinancialHealth,
  DailyReminder,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('crops');
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropFinancials, setCropFinancials] = useState<Record<string, CropFinancials>>({});
  const [farmSummary, setFarmSummary] = useState<FarmSummary>({
    totalSpent: 0,
    totalEarned: 0,
    netProfit: 0,
    overallProfitMargin: 0,
    cropSummaries: {},
    primaryInsights: [],
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [labourRecords, setLabourRecords] = useState<LabourRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [profile, setProfile] = useState<FarmerProfile>({
    id: 'user-1',
    name: 'Musa Ibrahim',
    phone: '+234 803 123 4567',
    location: 'Kano, Nigeria',
    preferredLanguage: 'en',
    currency: 'NGN',
    activeCropIds: [],
    dailyReminderEnabled: true,
    dailyReminderTime: '19:00',
  });

  // Phase 2 Financial Intelligence States
  const [cropComparisons, setCropComparisons] = useState<CropComparison[]>([]);
  const [debtorSummary, setDebtorSummary] = useState<DebtorSummary | null>(null);
  const [cashflowTimeline, setCashflowTimeline] = useState<CashflowMonth[]>([]);
  const [financialHealth, setFinancialHealth] = useState<FarmFinancialHealth | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isUssdModalOpen, setIsUssdModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTesterGuideOpen, setIsTesterGuideOpen] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(3);
  const [testerToastMessage, setTesterToastMessage] = useState<string | null>(null);

  const [selectedCropDetailId, setSelectedCropDetailId] = useState<string | null>(null);
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<'expense' | 'sale' | 'harvest' | 'labour'>('expense');
  const [quickEntryCropId, setQuickEntryCropId] = useState<string | undefined>(undefined);
  const [isNewCropOpen, setIsNewCropOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Daily Friendly Reminders State
  const [dailyReminder, setDailyReminder] = useState<DailyReminder | null>(null);
  const [showReminderBanner, setShowReminderBanner] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const fetchDailyReminder = useCallback(async (forceNew = false) => {
    try {
      const res = await fetch(`/api/reminders/daily?forceNew=${forceNew}`);
      if (res.ok) {
        const data: DailyReminder = await res.json();
        setDailyReminder(data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch daily reminder:', e);
    }
    return null;
  }, []);

  // Load all data from backend
  const loadData = useCallback(async () => {
    try {
      const safeJson = async (res: Response) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          return null;
        }
        try {
          return await res.json();
        } catch (e) {
          console.warn(`Failed to parse JSON for ${res.url}:`, e);
          return null;
        }
      };

      const [cropsRes, expRes, salesRes, harvRes, labRes, catRes, finRes, profRes, analyticsRes] =
        await Promise.all([
          fetch('/api/crops'),
          fetch('/api/expenses'),
          fetch('/api/sales'),
          fetch('/api/harvest'),
          fetch('/api/labour'),
          fetch('/api/categories'),
          fetch('/api/financials'),
          fetch('/api/profile'),
          fetch('/api/analytics'),
        ]);

      const cropsData = await safeJson(cropsRes);
      if (cropsData) setCrops(cropsData);

      const expData = await safeJson(expRes);
      if (expData) setExpenses(expData);

      const salesData = await safeJson(salesRes);
      if (salesData) setSales(salesData);

      const harvData = await safeJson(harvRes);
      if (harvData) setHarvests(harvData);

      const labData = await safeJson(labRes);
      if (labData) setLabourRecords(labData);

      const catData = await safeJson(catRes);
      if (catData) setCategories(catData);

      const profData = await safeJson(profRes);
      if (profData) setProfile(profData);

      const finData = await safeJson(finRes);
      if (finData) {
        if (finData.farmSummary) setFarmSummary(finData.farmSummary);
        if (finData.cropFinancials) setCropFinancials(finData.cropFinancials);
      }

      const analyticsData = await safeJson(analyticsRes);
      if (analyticsData) {
        if (!finData && analyticsData.farmSummary) {
          setFarmSummary(analyticsData.farmSummary);
        }
        setCropComparisons(analyticsData.cropComparisons || []);
        setDebtorSummary(analyticsData.debtorSummary || null);
        setCashflowTimeline(analyticsData.cashflowTimeline || []);
        setFinancialHealth(analyticsData.financialHealth || null);
      }
    } catch (err) {
      console.error('Error fetching farm data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchDailyReminder().then((rem) => {
      if (rem) {
        // Show gentle in-app reminder banner after short delay
        const timer = setTimeout(() => {
          setShowReminderBanner(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    });
  }, [loadData, fetchDailyReminder]);

  // Actions
  const handleCreateCrop = async (data: any) => {
    const res = await fetch('/api/crops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create crop');
    }
    await loadData();
  };

  const handleFinishCrop = async (cropId: string) => {
    await fetch(`/api/crops/${cropId}/finish`, { method: 'PUT' });
    await loadData();
  };

  const handleReopenCrop = async (cropId: string) => {
    await fetch(`/api/crops/${cropId}/reopen`, { method: 'PUT' });
    await loadData();
  };

  const handleSaveExpense = async (data: any) => {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save expense');
    }
    await loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    await loadData();
  };

  const handleSaveSale = async (data: any) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save sale');
    }
    await loadData();
  };

  const handleSaveHarvest = async (data: any) => {
    const res = await fetch('/api/harvest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save harvest');
    }
    await loadData();
  };

  const handleSaveLabour = async (data: any) => {
    const res = await fetch('/api/labour', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save labour');
    }
    await loadData();
  };

  const handleCollectDebtorPayment = async (saleId: string, amount: number, notes?: string) => {
    const res = await fetch(`/api/sales/${saleId}/collect-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record debtor payment');
    }
    await loadData();
  };

  const handleUpdateProfile = async (updated: Partial<FarmerProfile>) => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setProfile(await res.json());
    }
  };

  const handleResetSeed = async () => {
    await fetch('/api/reset', { method: 'POST' });
    await loadData();
  };

  const handleLanguageChange = (lang: Language) => {
    handleUpdateProfile({ preferredLanguage: lang });
  };

  const handleResetToCleanSlate = async () => {
    if (!window.confirm('Clear sample crops and expenses so you can test adding your own real farm records? (Feedback history will be preserved).')) return;
    try {
      const res = await fetch('/api/test-mode/clean-slate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testerName: profile.name || 'Farmer Tester',
          testerLocation: profile.location || 'Nigeria',
          testerPhone: profile.phone || '',
        }),
      });
      if (res.ok) {
        setTesterToastMessage('🌱 Clean farm slate created! You can now test adding your own crops, expenses, and harvests.');
        await loadData();
        setActiveTab('crops');
        setTimeout(() => setTesterToastMessage(null), 5000);
      }
    } catch (e) {
      console.error('Failed to reset to clean slate:', e);
    }
  };

  const handleReloadDemoFarm = async () => {
    try {
      const res = await fetch('/api/test-mode/reload-demo', { method: 'POST' });
      if (res.ok) {
        setTesterToastMessage('🌾 Sample Kano farm reloaded with Tomato, Cucumber, Sweetcorn, budgets, and cooperative records.');
        await loadData();
        setTimeout(() => setTesterToastMessage(null), 5000);
      }
    } catch (e) {
      console.error('Failed to reload demo farm:', e);
    }
  };

  const openQuickEntry = (type: 'expense' | 'sale' | 'harvest' | 'labour', cropId?: string) => {
    setQuickEntryType(type);
    setQuickEntryCropId(cropId);
    setIsQuickEntryOpen(true);
  };

  const selectedCrop = crops.find((c) => c.id === selectedCropDetailId);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans antialiased selection:bg-emerald-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        onLanguageChange={handleLanguageChange}
        onOpenQuickEntry={() => openQuickEntry('expense')}
        onOpenUssdModal={() => setIsUssdModalOpen(true)}
        debtorCount={debtorSummary?.debtorsWithDebtCount || 0}
        onOpenReminders={() => setIsNotificationCenterOpen(true)}
        hasActiveReminder={profile.dailyReminderEnabled}
        onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
        onOpenTesterGuide={() => setIsTesterGuideOpen(true)}
        feedbackCount={feedbackCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <p className="text-xs text-stone-500 font-medium">Opening FarmPal notebook...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: CROPS LIST & MANAGEMENT */}
            {activeTab === 'crops' && (
              <HomeDashboard
                crops={crops}
                cropFinancials={cropFinancials}
                farmSummary={farmSummary}
                profile={profile}
                onSelectCrop={(cropId) => setSelectedCropDetailId(cropId)}
                onOpenNewCropModal={() => setIsNewCropOpen(true)}
                onQuickAction={(type, cropId) => openQuickEntry(type, cropId)}
              />
            )}

            {/* VIEW 1B: SEASONAL PLANNING, BUDGETS & AGRONOMIC TASKS (PHASE 3) */}
            {activeTab === 'planning' && (
              <PlanningView
                crops={crops}
                onOpenQuickEntry={(cropId) => openQuickEntry('expense', cropId)}
              />
            )}

            {/* VIEW 1C: MARKET PRICE INTELLIGENCE & BENCHMARKS (PHASE 3) */}
            {activeTab === 'market' && (
              <MarketPriceView />
            )}

            {/* VIEW: COOPERATIVE BULK BUYING & OFF-TAKE AGGREGATION (PHASE 4) */}
            {activeTab === 'cooperative' && (
              <CooperativeView />
            )}

            {/* VIEW: AGRI-CREDIT SCORE & CONCESSIONARY FINANCING (PHASE 4) */}
            {activeTab === 'credit' && (
              <AgriCreditView
                crops={crops}
                farmSummary={farmSummary}
                debtorSummary={debtorSummary}
              />
            )}

            {/* VIEW: HYPERLOCAL AGRO-WEATHER & CROP THREAT ADVISORY (PHASE 4) */}
            {activeTab === 'weather' && (
              <WeatherAdvisoryView />
            )}

            {/* VIEW: FARM STOREHOUSE DEPOT INVENTORY (PHASE 4) */}
            {activeTab === 'inventory' && (
              <InventoryView />
            )}

            {/* VIEW 2: FINANCIAL INTELLIGENCE (PHASE 2) */}
            {activeTab === 'intelligence' && (
              <FinancialIntelligenceView
                farmSummary={farmSummary}
                cropComparisons={cropComparisons}
                debtorSummary={debtorSummary}
                cashflowTimeline={cashflowTimeline}
                financialHealth={financialHealth}
                expenses={expenses}
                onOpenStatementModal={() => setIsStatementModalOpen(true)}
                onNavigateToDebtors={() => setActiveTab('debtors')}
                onNavigateToCropDetail={(cropId) => setSelectedCropDetailId(cropId)}
              />
            )}

            {/* VIEW 3: DEBTORS & CREDIT TRACKER (PHASE 2) */}
            {activeTab === 'debtors' && (
              <DebtorsTracker
                debtorSummary={debtorSummary}
                onCollectPayment={handleCollectDebtorPayment}
                onRefresh={loadData}
              />
            )}

            {/* VIEW 4: RECORDS LEDGER */}
            {activeTab === 'records' && (
              <RecordsLedger
                crops={crops}
                expenses={expenses}
                sales={sales}
                harvests={harvests}
                labourRecords={labourRecords}
                onDeleteExpense={handleDeleteExpense}
                onOpenQuickEntry={(type) => openQuickEntry(type)}
              />
            )}

            {/* VIEW 5: WHATSAPP SIMULATOR */}
            {activeTab === 'whatsapp' && (
              <WhatsAppSimulator
                activeCrops={crops.filter((c) => c.status === 'active')}
                onRefreshData={loadData}
                onOpenUssdModal={() => setIsUssdModalOpen(true)}
              />
            )}

            {/* VIEW 6: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsView
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onResetSeed={handleResetSeed}
                onTriggerTestReminder={async () => {
                  const rem = await fetchDailyReminder(true);
                  if (rem) setShowReminderBanner(true);
                }}
              />
            )}

            {/* VIEW 7: FARMER PILOT FEEDBACK & TESTER HUB */}
            {activeTab === 'feedback' && (
              <TesterFeedbackView
                profile={profile}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                onOpenTesterGuide={() => setIsTesterGuideOpen(true)}
                onResetToCleanSlate={handleResetToCleanSlate}
                onReloadDemoFarm={handleReloadDemoFarm}
              />
            )}
          </>
        )}
      </main>

      {/* Tester Action Toast Banner */}
      {testerToastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-stone-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testerToastMessage}</span>
          <button
            onClick={() => setTesterToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Farmer Testing & Feedback Quick Widget */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 pointer-events-auto">
        <button
          onClick={() => setIsTesterGuideOpen(true)}
          title="Farmer Testing Guide & Scenarios"
          className="bg-stone-900/90 hover:bg-stone-900 text-emerald-300 border border-emerald-600/60 px-3.5 py-2 rounded-full text-xs font-bold shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
        >
          <span>🌾 Pilot Guide</span>
        </button>
        <button
          onClick={() => setIsFeedbackModalOpen(true)}
          title="Farmer Feedback Form"
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl transition-all hover:scale-105 flex items-center gap-2 cursor-pointer ring-4 ring-emerald-600/20"
        >
          <MessageSquare className="w-4 h-4 text-amber-300" />
          <span>Farmer Feedback</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>
      </div>

      {/* Daily Reminder Floating Banner */}
      {showReminderBanner && dailyReminder && (
        <DailyReminderNotification
          reminder={dailyReminder}
          farmerName={profile.name || 'Musa'}
          onClose={() => setShowReminderBanner(false)}
          onRecordExpense={() => {
            openQuickEntry('expense');
            setShowReminderBanner(false);
          }}
          onRecordSale={() => {
            openQuickEntry('sale');
            setShowReminderBanner(false);
          }}
          onOpenWhatsApp={() => {
            setActiveTab('whatsapp');
            setShowReminderBanner(false);
          }}
          onShuffleReminder={async () => {
            const fresh = await fetchDailyReminder(true);
            if (fresh) setDailyReminder(fresh);
          }}
        />
      )}

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        profile={profile}
        currentReminder={dailyReminder}
        onTriggerNewReminder={() => fetchDailyReminder(true)}
        onSendToWhatsApp={() => {
          setActiveTab('whatsapp');
          setShowReminderBanner(true);
          setIsNotificationCenterOpen(false);
        }}
        onRecordExpense={() => {
          openQuickEntry('expense');
          setIsNotificationCenterOpen(false);
        }}
        onRecordSale={() => {
          openQuickEntry('sale');
          setIsNotificationCenterOpen(false);
        }}
      />

      {/* MODAL 1: Crop Deep Inspection View */}
      {selectedCrop && (
        <CropDetailModal
          crop={selectedCrop}
          financials={
            cropFinancials[selectedCrop.id] || {
              totalSpent: 0,
              totalEarned: 0,
              netProfit: 0,
              profitMarginPercent: 0,
              weightedAvgSellingPrice: 0,
              primaryUnit: 'crates',
              totalHarvestedQuantity: 0,
              totalSoldQuantity: 0,
              breakEvenPrice: 0,
              expenseDistribution: [],
              insights: [],
            }
          }
          expenses={expenses}
          harvests={harvests}
          sales={sales}
          labourRecords={labourRecords}
          onClose={() => setSelectedCropDetailId(null)}
          onFinishCrop={handleFinishCrop}
          onReopenCrop={handleReopenCrop}
          onQuickAction={(type, cropId) => openQuickEntry(type, cropId)}
        />
      )}

      {/* MODAL 2: Quick Entry (Expense, Sale, Harvest, Labour) */}
      {isQuickEntryOpen && (
        <QuickEntryModal
          initialType={quickEntryType}
          initialCropId={quickEntryCropId}
          crops={crops}
          categories={categories}
          onClose={() => setIsQuickEntryOpen(false)}
          onSaveExpense={handleSaveExpense}
          onSaveSale={handleSaveSale}
          onSaveHarvest={handleSaveHarvest}
          onSaveLabour={handleSaveLabour}
        />
      )}

      {/* MODAL 3: Start New Crop */}
      {isNewCropOpen && (
        <NewCropModal
          onClose={() => setIsNewCropOpen(false)}
          onSaveCrop={handleCreateCrop}
        />
      )}

      {/* MODAL 4: Bank-Ready Farm Financial Health Statement (Phase 2) */}
      <FarmFinancialHealthCardModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        profile={profile}
        farmSummary={farmSummary}
        cropComparisons={cropComparisons}
        debtorSummary={debtorSummary}
        financialHealth={financialHealth}
      />

      {/* MODAL 5: Offline USSD Handset Simulator (Phase 3) */}
      <UssdSimulatorModal
        isOpen={isUssdModalOpen}
        onClose={() => setIsUssdModalOpen(false)}
        onRecordAdded={loadData}
      />

      {/* MODAL 6: Farmer Tester Feedback Modal */}
      <FarmerFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        profile={profile}
        onFeedbackSubmitted={() => {
          setFeedbackCount((prev) => prev + 1);
          setTesterToastMessage('Nagode! Your feedback has been recorded in the Farmer Feedback Hub.');
          setTimeout(() => setTesterToastMessage(null), 5000);
        }}
      />

      {/* DRAWER: Farmer Pilot Testing Guide */}
      <TesterGuideDrawer
        isOpen={isTesterGuideOpen}
        onClose={() => setIsTesterGuideOpen(false)}
        profile={profile}
        onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        onOpenWhatsApp={() => setActiveTab('whatsapp')}
        onOpenUssd={() => setIsUssdModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onResetToCleanSlate={handleResetToCleanSlate}
        onReloadDemoFarm={handleReloadDemoFarm}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/60 py-4 text-center text-xs text-stone-400">
        FarmPal • Simple farm notebook that quietly thinks for the farmer
      </footer>
    </div>
  );
}
