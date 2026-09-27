import React, { useState } from 'react';
import {
  Sprout,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { Crop, FarmSummary, CropFinancials, FarmerProfile } from '../types';
import { translations, formatNaira } from '../lib/i18n';

interface HomeDashboardProps {
  crops: Crop[];
  cropFinancials: Record<string, CropFinancials>;
  farmSummary: FarmSummary;
  profile: FarmerProfile;
  onSelectCrop: (cropId: string) => void;
  onOpenNewCropModal: () => void;
  onQuickAction: (type: 'expense' | 'harvest' | 'sale', cropId?: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  crops,
  cropFinancials,
  farmSummary,
  profile,
  onSelectCrop,
  onOpenNewCropModal,
  onQuickAction,
}) => {
  const t = translations[profile.preferredLanguage] || translations.en;
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('active');

  const activeCrops = crops.filter((c) => c.status === 'active');
  const finishedCrops = crops.filter((c) => c.status === 'finished');
  const displayedCrops =
    filter === 'active' ? activeCrops : filter === 'finished' ? finishedCrops : crops;

  const isProfitable = farmSummary.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Farm Financial Overview */}
      <div className="bg-stone-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-stone-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-800 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                Farm Financial Overview
              </span>
              <span className="text-xs text-stone-400">
                {activeCrops.length} active crop{activeCrops.length > 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Welcome, {profile.name}
            </h1>
            <p className="text-xs text-stone-400">{profile.location}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-start-new-crop-top"
              onClick={onOpenNewCropModal}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newCrop}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Money Spent, Money Earned, Current Profit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Money Spent */}
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/60">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span>{t.moneySpent}</span>
              <span className="p-1 rounded-md bg-rose-950/80 text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-stone-100">
              {formatNaira(farmSummary.totalSpent)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Total recorded input & labour</p>
          </div>

          {/* Money Earned */}
          <div className="bg-stone-800/80 rounded-xl p-4 border border-stone-700/60">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span>{t.moneyEarned}</span>
              <span className="p-1 rounded-md bg-emerald-950/80 text-emerald-400">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatNaira(farmSummary.totalEarned)}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Total revenue from crop sales</p>
          </div>

          {/* Current Profit */}
          <div
            className={`rounded-xl p-4 border ${
              isProfitable
                ? 'bg-emerald-950/40 border-emerald-800/60'
                : 'bg-amber-950/40 border-amber-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
              <span>{isProfitable ? t.profit : t.loss}</span>
              <span
                className={`p-1 rounded-md ${
                  isProfitable ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-800 text-amber-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div
              className={`text-2xl font-bold ${
                isProfitable ? 'text-emerald-300' : 'text-amber-300'
              }`}
            >
              {formatNaira(Math.abs(farmSummary.netProfit))}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {isProfitable ? 'Farm is profitable' : 'Recovering recorded expenses'}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Assistant Feed (Ground truth insights) */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4.5 sm:p-5">
        <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{t.smartInsights}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {farmSummary.primaryInsights.map((insight, idx) => (
            <div
              key={idx}
              className="bg-white/90 rounded-xl p-3 text-xs sm:text-sm text-stone-700 border border-emerald-100 flex items-start gap-2.5 shadow-2xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
          {/* Highlight crop specific insights */}
          {(Object.values(cropFinancials) as CropFinancials[])
            .flatMap((cf) => (cf.insights ? cf.insights.slice(0, 1) : []))
            .slice(0, 2)
            .map((insight, idx) => (
              <div
                key={`crop-${idx}`}
                className="bg-white/90 rounded-xl p-3 text-xs sm:text-sm text-stone-700 border border-emerald-100 flex items-start gap-2.5 shadow-2xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
        </div>
      </div>

      {/* "My Crops" Section Header with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>{t.myCrops}</span>
            <span className="text-xs font-normal text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
              {displayedCrops.length}
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            Tap a crop to see detailed records, average selling prices, and expense charts
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'active'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.activeCrops} ({activeCrops.length})
          </button>
          <button
            onClick={() => setFilter('finished')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'finished'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.finishedCrops} ({finishedCrops.length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({crops.length})
          </button>
        </div>
      </div>

      {/* Active Crop Cards Grid */}
      {displayedCrops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-stone-300 p-8">
          <Sprout className="w-12 h-12 text-stone-400 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-base font-semibold text-stone-800">No {filter} crops found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Start a new crop like Tomato, Cucumber, Sweetcorn, Pepper, or Okra to track expenses and sales.
          </p>
          <button
            onClick={onOpenNewCropModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newCrop}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedCrops.map((crop) => {
            const fin = cropFinancials[crop.id] || {
              totalSpent: 0,
              totalEarned: 0,
              netProfit: 0,
              profitMarginPercent: 0,
              weightedAvgSellingPrice: 0,
              primaryUnit: 'crates',
              totalHarvestedQuantity: 0,
              totalSoldQuantity: 0,
            };
            const cropProfit = fin.netProfit >= 0;

            return (
              <div
                key={crop.id}
                id={`crop-card-${crop.id}`}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all hover:border-emerald-300 flex flex-col justify-between group overflow-hidden"
              >
                {/* Card Top / Header */}
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => onSelectCrop(crop.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                          {crop.name}
                        </h3>
                        {crop.status === 'active' ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                            Finished
                          </span>
                        )}
                      </div>
                      {crop.variety && (
                        <p className="text-xs text-stone-500 font-medium">{crop.variety}</p>
                      )}
                    </div>
                    <span className="text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  </div>

                  {/* Farm Size & Planting Date meta */}
                  <div className="flex items-center gap-3 text-xs text-stone-500 mb-4 pb-3 border-b border-stone-100">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-stone-400" />
                      {crop.farmSizeAcres} acre{crop.farmSizeAcres > 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      Planted {crop.plantingDate}
                    </span>
                  </div>

                  {/* Financial Metrics Stack */}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-xs">{t.moneySpent}:</span>
                      <span className="font-semibold text-stone-800">
                        {formatNaira(fin.totalSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 text-xs">{t.moneyEarned}:</span>
                      <span className="font-semibold text-emerald-600">
                        {formatNaira(fin.totalEarned)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-stone-600 text-xs font-medium">
                        {cropProfit ? t.profit : t.loss}:
                      </span>
                      <span
                        className={`font-bold ${
                          cropProfit ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {formatNaira(fin.netProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Variable price & harvest progress note */}
                  {fin.weightedAvgSellingPrice > 0 && (
                    <div className="mt-3.5 bg-stone-50 rounded-lg p-2 text-[11px] text-stone-600 flex items-center justify-between border border-stone-100">
                      <span>Avg selling price:</span>
                      <span className="font-semibold text-stone-800">
                        {formatNaira(fin.weightedAvgSellingPrice)} / {fin.primaryUnit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Quick Action Bar (3 Easy Buttons) */}
                <div className="bg-stone-50/80 px-4 py-2.5 border-t border-stone-100 flex items-center justify-between gap-1 text-xs">
                  <button
                    onClick={() => onQuickAction('expense', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-medium rounded-lg border border-stone-200 hover:border-rose-200 transition-colors text-center"
                  >
                    + Expense
                  </button>
                  <button
                    onClick={() => onQuickAction('harvest', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-medium rounded-lg border border-stone-200 hover:border-emerald-200 transition-colors text-center"
                  >
                    + Harvest
                  </button>
                  <button
                    onClick={() => onQuickAction('sale', crop.id)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-50 text-amber-800 hover:text-amber-900 font-medium rounded-lg border border-stone-200 hover:border-amber-200 transition-colors text-center"
                  >
                    + Sale
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating or bottom prompt to start crop */}
      <div className="bg-stone-100 rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-stone-700">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            🌱
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">Planting another plot or crop?</h4>
            <p className="text-xs text-stone-500">
              You can track Tomato, Cucumber, Sweetcorn, Pepper, Okra, or enter any custom crop.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewCropModal}
          className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          {t.newCrop}
        </button>
      </div>
    </div>
  );
};
