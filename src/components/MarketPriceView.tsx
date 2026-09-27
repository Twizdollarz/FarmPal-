import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  Truck,
  Sparkles,
  Calculator,
  RefreshCw,
  Package,
  Calendar,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { MarketPriceBenchmark, MarketAdvisoryInsight, WeeklyPricePoint } from '../types';
import { formatNaira } from '../lib/i18n';
import { DEFAULT_FALLBACK_BENCHMARKS, DEFAULT_FALLBACK_INSIGHTS } from '../data/marketPriceData';

export const MarketPriceView: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<MarketPriceBenchmark[]>(DEFAULT_FALLBACK_BENCHMARKS);
  const [insights, setInsights] = useState<MarketAdvisoryInsight[]>(DEFAULT_FALLBACK_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [regionFilter, setRegionFilter] = useState<'all' | 'North' | 'South' | 'West' | 'East'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'weekly_table'>('cards');

  // Interactive Freight / Arbitrage Calculator state
  const [calcQuantity, setCalcQuantity] = useState<number>(30);
  const [selectedDestinationMarketId, setSelectedDestinationMarketId] = useState<string>('');
  const [calcTransportPerUnit, setCalcTransportPerUnit] = useState<number>(2500);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/market/benchmarks');
      if (res.ok) {
        const data = await res.json();
        if (data.benchmarks && data.benchmarks.length > 0) {
          setBenchmarks(data.benchmarks);
        }
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
      }
    } catch (err) {
      console.warn('Could not reach remote market benchmark feed, using verified local data cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const cropsAvailable: string[] = Array.from(new Set(benchmarks.map((b) => b.cropName)));

  // Filter benchmarks by selected crop
  const cropBenchmarks = benchmarks.filter(
    (b) => b.cropName.toLowerCase() === selectedCrop.toLowerCase()
  );

  // Filter by region
  const filteredBenchmarks = cropBenchmarks.filter((b) => {
    if (regionFilter === 'all') return true;
    return b.region === regionFilter;
  });

  const currentUnit = cropBenchmarks[0]?.unit || 'units';
  const farmerPrice = cropBenchmarks.find((b) => b.farmerRealizedAvgPrice)?.farmerRealizedAvgPrice;

  // Find local market (Kano) vs terminal destination market (Lagos or user-selected)
  const localMarket = cropBenchmarks.find((b) => b.state.toLowerCase() === 'kano') || cropBenchmarks[0];

  // Destination market for arbitrage calculator
  const destinationMarket =
    cropBenchmarks.find((b) => b.id === selectedDestinationMarketId) ||
    cropBenchmarks.find((b) => b.state.toLowerCase() === 'lagos') ||
    [...cropBenchmarks].sort((a, b) => b.wholesaleAvg - a.wholesaleAvg)[0];

  // Auto update transport cost when crop or destination changes
  useEffect(() => {
    if (destinationMarket?.haulageRateFromNorth) {
      setCalcTransportPerUnit(destinationMarket.haulageRateFromNorth);
    } else if (currentUnit === 'crates') {
      setCalcTransportPerUnit(2500);
    } else {
      setCalcTransportPerUnit(5000);
    }
  }, [selectedCrop, destinationMarket?.id, currentUnit]);

  // Arbitrage calculations
  const localGross = (localMarket?.wholesaleAvg || 16500) * calcQuantity;
  const interstateGross = (destinationMarket?.wholesaleAvg || 36000) * calcQuantity;
  const totalHaulageCost = calcTransportPerUnit * calcQuantity;
  const interstateNet = interstateGross - totalHaulageCost;
  const arbitrageGain = interstateNet - localGross;

  // Compute highest & lowest market for quick comparison
  const highestMarket = [...cropBenchmarks].sort((a, b) => b.wholesaleAvg - a.wholesaleAvg)[0];
  const lowestMarket = [...cropBenchmarks].sort((a, b) => a.wholesaleAvg - b.wholesaleAvg)[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Market Intelligence
              </span>
              <span className="text-xs text-stone-500 font-medium">Weekly Price Tracking</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">Market Price Intelligence & Fair Value</h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Live wholesale benchmarks, weekly price evolution, standard packaging weights & interstate haulage freight rates.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={fetchMarketData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Intelligence Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">Weekly Wholesale Bulletin</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-semibold">
                  Weekly Frequency
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Aggregated weekly across northern assembly hubs (Kano Dawanau/Yankaba, Kaduna Makarfi) and southern wholesale terminal hubs (Mile 12 Lagos, Bodija Ibadan, Sagamu, Ogbaru).
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 flex items-start gap-3">
            <div className="p-2 bg-sky-100 text-sky-800 rounded-lg shrink-0 mt-0.5">
              <Truck className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-900">Interstate Freight & Logistics</span>
                <span className="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.5 rounded font-semibold">
                  Transit Benchmarks
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Commercial produce haulage rates from Northern transit corridors to Lagos, Ibadan, and Eastern terminals to calculate net transport arbitrage.
              </p>
            </div>
          </div>
        </div>

        {/* Commodity Selector & View Toggles */}
        <div className="pt-4 border-t border-stone-100 mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Commodity Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {cropsAvailable.map((cropName) => {
                const isSelected = selectedCrop.toLowerCase() === cropName.toLowerCase();
                return (
                  <button
                    key={cropName}
                    onClick={() => setSelectedCrop(cropName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                    }`}
                  >
                    {cropName}
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle: Cards vs Weekly Table */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Market Cards</span>
              </button>
              <button
                onClick={() => setViewMode('weekly_table')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'weekly_table'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Weekly Trends</span>
              </button>
            </div>
          </div>

          {/* Region Sub-Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
            <span className="text-stone-500 font-medium mr-1 text-[11px]">Region:</span>
            {[
              { key: 'all', label: `All Hubs (${cropBenchmarks.length})` },
              { key: 'North', label: 'North' },
              { key: 'South', label: 'South (Lagos)' },
              { key: 'West', label: 'West (Oyo/Ogun)' },
              { key: 'East', label: 'East (Anambra)' },
            ].map((reg) => (
              <button
                key={reg.key}
                onClick={() => setRegionFilter(reg.key as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  regionFilter === reg.key
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Realized Price vs Fair Benchmark Card (If farmer recorded sales) */}
      {farmerPrice && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-stone-900">
                Your Realized Selling Price vs Market Average ({selectedCrop})
              </h3>
            </div>
            <span className="text-xs text-stone-500">Calculated from recorded sales ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Your Average Sale Price
              </span>
              <span className="text-lg font-bold text-stone-900 mt-0.5 block">
                {formatNaira(farmerPrice)} / {currentUnit}
              </span>
              <span className="text-[10px] text-stone-500">Farmgate / local delivery</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Local Market Benchmark (Kano)
              </span>
              <span className="text-lg font-bold text-stone-900 mt-0.5 block">
                {formatNaira(localMarket?.wholesaleAvg || 16500)} / {currentUnit}
              </span>
              <span className="text-[10px] text-stone-500">{localMarket?.marketName}</span>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-100">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Price Variance
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {farmerPrice >= (localMarket?.wholesaleAvg || 16500) ? (
                  <span className="text-lg font-bold text-emerald-700">
                    +{formatNaira(farmerPrice - (localMarket?.wholesaleAvg || 16500))} (Premium)
                  </span>
                ) : (
                  <span className="text-lg font-bold text-amber-600">
                    -{formatNaira((localMarket?.wholesaleAvg || 16500) - farmerPrice)} (Below local wholesale)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-500">vs wholesale benchmark</span>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY PRICE EVOLUTION TABLE (Prices per Week) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Weekly Price History per Week — {selectedCrop} ({currentUnit})
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Updated weekly across assembly & terminal markets
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600">
                <th className="py-2.5 px-3 font-semibold">Market Hub</th>
                <th className="py-2.5 px-3 font-semibold">Region</th>
                <th className="py-2.5 px-3 font-semibold text-right">Week 1</th>
                <th className="py-2.5 px-3 font-semibold text-right">Week 2</th>
                <th className="py-2.5 px-3 font-semibold text-right">Week 3</th>
                <th className="py-2.5 px-3 font-semibold text-right bg-emerald-50/50 text-emerald-900">
                  Week 4 (Current)
                </th>
                <th className="py-2.5 px-3 font-semibold text-right">4-Wk Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBenchmarks.map((bench) => {
                const weekly = bench.weeklyPrices || [];
                const w1 = weekly.find((w) => w.weekLabel.includes('Week 1'))?.wholesaleAvg;
                const w2 = weekly.find((w) => w.weekLabel.includes('Week 2'))?.wholesaleAvg;
                const w3 = weekly.find((w) => w.weekLabel.includes('Week 3'))?.wholesaleAvg;
                const w4 = weekly.find((w) => w.weekLabel.includes('Week 4'))?.wholesaleAvg || bench.wholesaleAvg;
                const fourWeekShift = w1 ? Math.round(((w4 - w1) / w1) * 100) : bench.changePercent7d;

                return (
                  <tr key={bench.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-3 font-medium text-stone-900">
                      <div>{bench.marketName}</div>
                      <div className="text-[10px] text-stone-500">{bench.state} State • {bench.variety || 'Standard'}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        bench.region === 'North'
                          ? 'bg-amber-100 text-amber-800'
                          : bench.region === 'South'
                          ? 'bg-sky-100 text-sky-800'
                          : bench.region === 'West'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {bench.region} Hub
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-stone-600">
                      {w1 ? formatNaira(w1) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-stone-600">
                      {w2 ? formatNaira(w2) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-stone-600">
                      {w3 ? formatNaira(w3) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-stone-900 bg-emerald-50/30">
                      {formatNaira(w4)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-0.5 font-bold text-[11px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-800">
                        {fourWeekShift > 0 ? (
                          <span className="text-emerald-700 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-0.5" />+{fourWeekShift}%
                          </span>
                        ) : fourWeekShift < 0 ? (
                          <span className="text-red-700 flex items-center">
                            <TrendingDown className="w-3 h-3 mr-0.5" />{fourWeekShift}%
                          </span>
                        ) : (
                          <span className="text-stone-600 flex items-center">
                            <Minus className="w-3 h-3 mr-0.5" />0%
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Price Grid of Market Cards */}
      {viewMode === 'cards' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-stone-900">
                Regional Wholesale Board — {selectedCrop} ({currentUnit})
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              Showing {filteredBenchmarks.length} market hubs
            </span>
          </div>

          {filteredBenchmarks.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              No price entries found for this region. Try selecting "All Hubs".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredBenchmarks.map((bench) => {
                const weekly = bench.weeklyPrices || [];
                return (
                  <div
                    key={bench.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top metadata & region classification */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            bench.region === 'North'
                              ? 'bg-amber-100 text-amber-800'
                              : bench.region === 'South'
                              ? 'bg-sky-100 text-sky-800'
                              : bench.region === 'West'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {bench.region === 'North'
                            ? 'Northern Assembly Hub'
                            : bench.region === 'South'
                            ? 'Southern Terminal Wholesale'
                            : bench.region === 'West'
                            ? 'Southwest Off-take Hub'
                            : 'Eastern Corridor Wholesale'}
                        </span>

                        <div
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            bench.trend === 'rising'
                              ? 'bg-emerald-100 text-emerald-800'
                              : bench.trend === 'falling'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {bench.trend === 'rising' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : bench.trend === 'falling' ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3" />
                          )}
                          <span>
                            {bench.changePercent7d > 0 ? `+${bench.changePercent7d}%` : `${bench.changePercent7d}%`}
                          </span>
                        </div>
                      </div>

                      {/* Market & Location */}
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">{bench.marketName}</h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{bench.state} State ({bench.region} Region)</span>
                        </div>
                      </div>

                      {/* Packaging Standard */}
                      {bench.packageType && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-stone-600 bg-white px-2 py-1 rounded-lg border border-stone-200/70">
                          <Package className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{bench.packageType}</span>
                        </div>
                      )}

                      {/* Price Details */}
                      <div className="pt-3">
                        <span className="text-[11px] text-stone-500 block">Current Wholesale Average</span>
                        <span className="text-xl font-bold text-stone-900 block mt-0.5">
                          {formatNaira(bench.wholesaleAvg)}
                          <span className="text-xs font-normal text-stone-500"> / {bench.unit}</span>
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 pt-1.5 border-t border-stone-200/60">
                          <span>Min: {formatNaira(bench.wholesaleMin)}</span>
                          <span>Max: {formatNaira(bench.wholesaleMax)}</span>
                        </div>
                      </div>

                      {/* Weekly Price Sparkline / History in Card */}
                      {weekly.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-200/60">
                          <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                            Weekly Progression (Prices per Week)
                          </span>
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                            {weekly.map((wp, idx) => (
                              <div
                                key={wp.weekKey || idx}
                                className={`p-1 rounded ${
                                  idx === weekly.length - 1
                                    ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                                    : 'bg-white text-stone-600 border border-stone-200'
                                }`}
                              >
                                <div className="text-[9px] text-stone-500 truncate">{wp.weekLabel.replace(' (Current)', '')}</div>
                                <div className="font-semibold">{formatNaira(wp.wholesaleAvg).replace('₦', '')}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status footer */}
                    <div className="text-[10px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-200/60">
                      <span className="truncate">Variety: {bench.variety || 'Standard'}</span>
                      {bench.haulageRateFromNorth !== undefined && bench.haulageRateFromNorth > 0 && (
                        <span className="text-sky-700 font-medium">
                          Haulage: {formatNaira(bench.haulageRateFromNorth)}/{bench.unit}
                        </span>
                      )}
                      <span>{bench.lastUpdated}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actionable Market Advisory Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <div
            key={insight.headline}
            className={`p-4.5 rounded-2xl border transition-all ${
              insight.urgency === 'high'
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-emerald-50/70 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  insight.urgency === 'high'
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {insight.cropName} Market Signal
              </span>

              <span className="text-[10px] font-semibold text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Weekly Dispatch Advisory</span>
              </span>
            </div>

            <h4 className="text-xs font-bold text-stone-900 mt-1">{insight.headline}</h4>
            <p className="text-xs text-stone-700 leading-relaxed mt-1.5">{insight.recommendation}</p>

            <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800">Target Terminal: {insight.bestMarket}</span>
              <span className="font-bold text-emerald-800">
                Up to {formatNaira(insight.highestPrice)} / {insight.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Interstate Arbitrage & Freight Calculator */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Interstate Haulage & Arbitrage Calculator
            </h3>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            Commercial Road Freight Calculator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Quantity to Dispatch ({currentUnit})
              </label>
              <input
                type="number"
                min={1}
                value={calcQuantity}
                onChange={(e) => setCalcQuantity(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Target Terminal Destination
              </label>
              <select
                value={destinationMarket?.id || ''}
                onChange={(e) => setSelectedDestinationMarketId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              >
                {cropBenchmarks
                  .filter((b) => b.state.toLowerCase() !== 'kano')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.marketName} ({b.state}) — {formatNaira(b.wholesaleAvg)}/{b.unit}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                Haulage & Loading Cost per {currentUnit} (₦)
              </label>
              <input
                type="number"
                step={100}
                value={calcTransportPerUnit}
                onChange={(e) => setCalcTransportPerUnit(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-stone-50 border border-stone-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Typical commercial transit freight: Kano → Lagos ₦2,200–₦2,600/crate; ₦4,800–₦5,500/bag.
              </span>
            </div>
          </div>

          {/* Arbitrage Result Box */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Haulage Comparison for {calcQuantity} {currentUnit} of {selectedCrop}
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-stone-200">
                <span className="text-stone-600">Sell Locally ({localMarket?.marketName || 'Kano Dawanau'}):</span>
                <span className="font-bold text-stone-900">{formatNaira(localGross)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-stone-200">
                <span className="text-stone-600">
                  Sell at {destinationMarket?.marketName || 'Mile 12 Lagos'} ({destinationMarket?.state}):
                </span>
                <span className="font-bold text-stone-900">{formatNaira(interstateGross)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-stone-200">
                <span className="text-stone-600">Less Haulage Freight ({calcQuantity} × {formatNaira(calcTransportPerUnit)}):</span>
                <span className="font-semibold text-red-600">-{formatNaira(totalHaulageCost)}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 bg-emerald-50 px-2 rounded-lg text-emerald-950 font-bold">
                <span>Interstate Net Revenue:</span>
                <span>{formatNaira(interstateNet)}</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[11px] font-semibold text-stone-500 block">Net Gain after Interstate Freight:</span>
              <span
                className={`text-base font-bold ${
                  arbitrageGain > 0 ? 'text-emerald-700' : 'text-stone-700'
                }`}
              >
                {arbitrageGain > 0
                  ? `+${formatNaira(arbitrageGain)} Extra Net Gain (+${Math.round((arbitrageGain / Math.max(1, localGross)) * 100)}%)`
                  : 'Sell locally (interstate freight exceeds price spread)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
