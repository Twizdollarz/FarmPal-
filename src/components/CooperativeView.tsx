import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingBag,
  Truck,
  TrendingDown,
  Clock,
  Building2,
  CheckCircle2,
  Phone,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import { CooperativeGroup, BulkInputPool, ProduceAggregationPool } from '../types';

export const CooperativeView: React.FC = () => {
  const [coop, setCoop] = useState<CooperativeGroup | null>(null);
  const [bulkPools, setBulkPools] = useState<BulkInputPool[]>([]);
  const [aggregationPools, setAggregationPools] = useState<ProduceAggregationPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bulk' | 'aggregation'>('bulk');
  const [selectedBulkPool, setSelectedBulkPool] = useState<BulkInputPool | null>(null);
  const [selectedAggPool, setSelectedAggPool] = useState<ProduceAggregationPool | null>(null);
  const [pledgeQty, setPledgeQty] = useState<number>(0);
  const [commitVol, setCommitVol] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchCoopData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/cooperative');
      if (res.ok) {
        const data = await res.json();
        setCoop(data.cooperative);
        setBulkPools(data.bulkPools || []);
        setAggregationPools(data.aggregationPools || []);
      }
    } catch (err) {
      console.error('Error loading cooperative data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoopData();
  }, []);

  const handleUpdatePledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkPool) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/cooperative/bulk-pools/${selectedBulkPool.id}/pledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: pledgeQty }),
      });
      if (res.ok) {
        setSuccessToast(`Successfully updated order to ${pledgeQty} ${selectedBulkPool.unit}!`);
        setSelectedBulkPool(null);
        await fetchCoopData();
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Error pledging:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAggPool) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/cooperative/aggregation-pools/${selectedAggPool.id}/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: commitVol }),
      });
      if (res.ok) {
        setSuccessToast(`Committed ${commitVol} ${selectedAggPool.unit} to ${selectedAggPool.offtakerName}!`);
        setSelectedAggPool(null);
        await fetchCoopData();
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err) {
      console.error('Error committing volume:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Connecting to Cooperative Aggregation Network...</p>
      </div>
    );
  }

  const totalPledgedSavings = bulkPools.reduce((sum, p) => {
    const unitSaving = p.retailMarketPrice - p.coopBulkPrice;
    return sum + unitSaving * p.userPledgedQuantity;
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium">{successToast}</p>
        </div>
      )}

      {/* Header & Co-op Identity Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Phase 4 Hub
              </span>
              <span className="text-xs text-stone-400 font-mono">Reg: {coop?.societyNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {coop?.name || 'Farmers Cooperative Society'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl">
              Collective bargaining, wholesale input procurement discounts (18–25% savings), and direct commercial truck aggregation for industrial off-takers.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200 shrink-0">
            <div className="px-3 py-1 border-r border-stone-200">
              <p className="text-[11px] text-stone-500 font-medium">Members</p>
              <p className="text-sm sm:text-base font-bold text-stone-900">{coop?.totalMembers || 148} Farmers</p>
            </div>
            <div className="px-3 py-1 border-r border-stone-200">
              <p className="text-[11px] text-stone-500 font-medium">Zone</p>
              <p className="text-xs font-bold text-stone-900 truncate max-w-[140px]">Bunkure Belt</p>
            </div>
            <div className="px-3 py-1">
              <p className="text-[11px] text-emerald-700 font-medium">Your Group Savings</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700">
                ₦{totalPledgedSavings.toLocaleString('en-NG')}
              </p>
            </div>
          </div>
        </div>

        {/* Co-op Leadership & Verified Account bar */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-stone-400" />
              <span>Chairman: <strong>{coop?.chairperson}</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>{coop?.phone}</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Escrow: {coop?.bankAccount}</span>
            </span>
          </div>

          <button
            onClick={fetchCoopData}
            className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Group Orders</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'bulk'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Bulk Input Buying Pools ({bulkPools.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('aggregation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
            activeTab === 'aggregation'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Produce Aggregation & Off-Takers ({aggregationPools.length})</span>
        </button>
      </div>

      {/* SECTION 1: BULK INPUT PROCUREMENT POOLS */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Factory-Direct Group Purchases
              </h2>
              <p className="text-xs text-stone-500">
                Lock in certified inputs at wholesale manufacturer pricing by combining orders with cooperative peers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bulkPools.map((pool) => {
              const progressPercent = Math.min(100, Math.round((pool.pledgedQuantity / pool.targetQuantity) * 100));
              const unitSavings = pool.retailMarketPrice - pool.coopBulkPrice;
              const userTotalSavings = unitSavings * pool.userPledgedQuantity;

              return (
                <div
                  key={pool.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                            {pool.category}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Save {pool.discountPercent}%
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-stone-900 mt-1">
                          {pool.inputName}
                        </h3>
                        <p className="text-[11px] text-stone-500">Supplier: {pool.supplierName}</p>
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div>
                        <p className="text-[10px] text-stone-500 font-medium">Co-op Wholesale Price</p>
                        <p className="text-sm font-bold text-emerald-700">
                          ₦{pool.coopBulkPrice.toLocaleString('en-NG')} <span className="text-[10px] font-normal text-stone-500">/{pool.unit}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-500 font-medium">Retail Spot Price</p>
                        <p className="text-sm font-semibold text-stone-400 line-through">
                          ₦{pool.retailMarketPrice.toLocaleString('en-NG')}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-stone-700">
                          Group Target: {pool.pledgedQuantity} of {pool.targetQuantity} {pool.unit}
                        </span>
                        <span className="font-bold text-emerald-800">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Closes: {pool.deadlineDate}
                        </span>
                        <span>{pool.targetQuantity - pool.pledgedQuantity} {pool.unit} left to unlock tier</span>
                      </div>
                    </div>

                    {/* Farmer's pledge pill */}
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-emerald-900">Your Current Order</p>
                        <p className="text-xs font-bold text-emerald-800">
                          {pool.userPledgedQuantity > 0 ? (
                            <>
                              {pool.userPledgedQuantity} {pool.unit} (₦{(pool.userPledgedQuantity * pool.coopBulkPrice).toLocaleString('en-NG')})
                            </>
                          ) : (
                            'No quantity pledged yet'
                          )}
                        </p>
                      </div>
                      {pool.userPledgedQuantity > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-700">You Save</p>
                          <p className="text-xs font-bold text-emerald-700">₦{userTotalSavings.toLocaleString('en-NG')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setSelectedBulkPool(pool);
                      setPledgeQty(pool.userPledgedQuantity || 5);
                    }}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>{pool.userPledgedQuantity > 0 ? 'Modify Pledged Quantity' : 'Join Bulk Order'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: PRODUCE AGGREGATION & CONTRACT OFF-TAKERS */}
      {activeTab === 'aggregation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">
                Institutional Off-Take Aggregation
              </h2>
              <p className="text-xs text-stone-500">
                Fill commercial 30-tonne articulated trucks directly with food processors and supermarket chains at guaranteed floor prices.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {aggregationPools.map((agg) => {
              const progressPercent = Math.min(100, Math.round((agg.currentAggregatedVolume / agg.minimumVolumeRequired) * 100));
              const userProjectedRevenue = agg.userCommittedVolume * agg.agreedFloorPricePerUnit;

              return (
                <div
                  key={agg.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs space-y-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          {agg.cropName} Aggregation
                        </span>
                        <span className="text-xs font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                          {agg.contractType}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            agg.status === 'full'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-blue-800'
                          }`}
                        >
                          {agg.status === 'full' ? 'Truck Ready for Dispatch' : 'Loading in Progress'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900">
                        {agg.offtakerName}
                      </h3>
                      <p className="text-xs text-stone-600 max-w-2xl">{agg.termsNote}</p>
                    </div>

                    {/* Price banner */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-right shrink-0">
                      <p className="text-[11px] text-emerald-800 font-medium">Guaranteed Contract Floor</p>
                      <p className="text-lg font-bold text-emerald-800">
                        ₦{agg.agreedFloorPricePerUnit.toLocaleString('en-NG')}
                        <span className="text-xs font-normal text-emerald-700"> /{agg.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Volume progress meter */}
                  <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-stone-700">
                        Trailer Capacity Filled: {agg.currentAggregatedVolume} of {agg.minimumVolumeRequired} {agg.unit}
                      </span>
                      <span className="font-bold text-emerald-800">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>Delivery Hub: <strong>{agg.deliveryHub}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Cut-off: {agg.cutoffDate}
                      </span>
                    </div>
                  </div>

                  {/* Footer & Commitment button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="w-full sm:w-auto">
                      <p className="text-[11px] text-stone-500">Your Harvest Commitment:</p>
                      <p className="text-xs font-bold text-stone-900">
                        {agg.userCommittedVolume > 0 ? (
                          <>
                            {agg.userCommittedVolume} {agg.unit} committed ~ Projected Payout: <span className="text-emerald-700">₦{userProjectedRevenue.toLocaleString('en-NG')}</span>
                          </>
                        ) : (
                          '0 crates committed'
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAggPool(agg);
                        setCommitVol(agg.userCommittedVolume || 20);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{agg.userCommittedVolume > 0 ? 'Adjust Volume' : 'Commit Harvest Volume'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: PLEDGE BULK INPUTS */}
      {selectedBulkPool && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Cooperative Bulk Buy
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  {selectedBulkPool.inputName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBulkPool(null)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Wholesale Unit Price:</span>
                <span className="font-bold text-emerald-800">₦{selectedBulkPool.coopBulkPrice.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Retail Spot Price:</span>
                <span className="line-through text-stone-400">₦{selectedBulkPool.retailMarketPrice.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Saving per {selectedBulkPool.unit}:</span>
                <span>₦{(selectedBulkPool.retailMarketPrice - selectedBulkPool.coopBulkPrice).toLocaleString('en-NG')} ({selectedBulkPool.discountPercent}%)</span>
              </div>
            </div>

            <form onSubmit={handleUpdatePledge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  How many {selectedBulkPool.unit} do you want to order?
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={pledgeQty}
                    onChange={(e) => setPledgeQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-emerald-600"
                  />
                  <span className="text-xs font-medium text-stone-500">{selectedBulkPool.unit}</span>
                </div>
              </div>

              {pledgeQty > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <div className="flex justify-between text-emerald-900">
                    <span>Total Order Cost:</span>
                    <span className="font-bold">₦{(pledgeQty * selectedBulkPool.coopBulkPrice).toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Total Savings vs Market:</span>
                    <span>₦{(pledgeQty * (selectedBulkPool.retailMarketPrice - selectedBulkPool.coopBulkPrice)).toLocaleString('en-NG')}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBulkPool(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMMIT PRODUCE VOLUME */}
      {selectedAggPool && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                  Produce Contract Aggregation
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  {selectedAggPool.offtakerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAggPool(null)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Guaranteed Floor Price:</span>
                <span className="font-bold text-emerald-800">₦{selectedAggPool.agreedFloorPricePerUnit.toLocaleString('en-NG')} /{selectedAggPool.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Delivery Hub:</span>
                <span className="text-stone-800 font-medium">{selectedAggPool.deliveryHub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Cut-off Date:</span>
                <span className="text-stone-800 font-medium">{selectedAggPool.cutoffDate}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateCommitment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Commitment Quantity ({selectedAggPool.unit}):
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={commitVol}
                  onChange={(e) => setCommitVol(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-bold text-stone-900 focus:outline-emerald-600"
                />
              </div>

              {commitVol > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <div className="flex justify-between text-emerald-900 font-bold">
                    <span>Projected Off-Take Settlement:</span>
                    <span>₦{(commitVol * selectedAggPool.agreedFloorPricePerUnit).toLocaleString('en-NG')}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Direct electronic transfer to your account within 48 hours of warehouse weigh-in.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAggPool(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
