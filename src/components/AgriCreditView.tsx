import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Download,
  Info,
  DollarSign,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { AgriCreditScore, AgriLoanProduct, Crop, FarmSummary, DebtorSummary } from '../types';
import { FarmpalLogo } from './FarmpalLogo';

interface AgriCreditViewProps {
  crops: Crop[];
  farmSummary: FarmSummary;
  debtorSummary: DebtorSummary | null;
}

export const AgriCreditView: React.FC<AgriCreditViewProps> = ({ crops, farmSummary, debtorSummary }) => {
  const [creditData, setCreditData] = useState<AgriCreditScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<AgriLoanProduct | null>(null);
  const [borrowAmount, setBorrowAmount] = useState<number>(500000);
  const [isApplying, setIsApplying] = useState(false);
  const [applicationResult, setApplicationResult] = useState<{ id: string; message: string } | null>(null);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  const fetchCreditScore = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/loans/credit-score');
      if (res.ok) {
        setCreditData(await res.json());
      }
    } catch (err) {
      console.error('Error fetching credit score:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditScore();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      setIsApplying(true);
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedLoan.id,
          requestedAmount: borrowAmount,
          purpose: 'Seasonal inputs and irrigation maintenance',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplicationResult({
          id: data.applicationId,
          message: data.message,
        });
        setSelectedLoan(null);
      }
    } catch (err) {
      console.error('Error applying for loan:', err);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading || !creditData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Computing Agricultural Creditworthiness Rating...</p>
      </div>
    );
  }

  const scorePercentage = Math.round(((creditData.score - 300) / (creditData.maxScore - 300)) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Application Success Modal / Toast */}
      {applicationResult && (
        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold">Loan Application Successfully Lodged!</h4>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                  {applicationResult.id}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl">{applicationResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setApplicationResult(null)}
            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero: Score Card & Pre-Qualified Limit */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Rating & Score Gauge */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Phase 4 Agri-Fintech
              </span>
              <span className="text-xs text-stone-500 font-medium">Underwritten via Verified Ledger History</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Farm Credit & Seasonal Working Capital
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              {creditData.creditSummary}
            </p>

            {/* Score Metric Bar */}
            <div className="pt-2">
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-stone-900 font-mono">
                    {creditData.score}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">/ {creditData.maxScore} Max</span>
                  <span className="ml-2 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {creditData.ratingTier}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {creditData.approvalProbabilityPercent}% Approval Likelihood
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-700 rounded-full transition-all duration-700"
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                <span>300 (Subprime)</span>
                <span>580 (Moderate)</span>
                <span>720 (Strong)</span>
                <span>850 (Prime)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-Approved Capacity Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 border border-emerald-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-300">
                Pre-Approved Capacity
              </span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <p className="text-xs text-emerald-200">Maximum Seasonal Borrowing Limit</p>
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                ₦{creditData.maxEligibleBorrowing.toLocaleString('en-NG')}
              </p>
              <p className="text-[11px] text-emerald-300 mt-1">
                Concessionary single-digit & development bank facilities.
              </p>
            </div>

            <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setIsDossierModalOpen(true)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>View Bank Credit Dossier</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Credit Assessment */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-stone-900">
          Underwriting Credit Pillars & Health Factors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditData.pillars.map((pillar, i) => {
            const pct = Math.round((pillar.score / pillar.maxScore) * 100);
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 truncate pr-2">
                      {pillar.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        pillar.status === 'strong'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : pillar.status === 'good'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {pillar.status === 'strong' ? 'Strong' : pillar.status === 'good' ? 'Good' : 'Review'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">{pillar.note}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-stone-100">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-stone-400">Pillar Score</span>
                    <span className="font-bold text-stone-800">
                      {pillar.score} / {pillar.maxScore}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Qualified Financing Facilities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              Pre-Qualified Agricultural Financing Facilities
            </h2>
            <p className="text-xs text-stone-500">
              Select a facility tailored to your farm cycle with harvest balloon repayment.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {creditData.availableLoanProducts.map((loan) => {
            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-400 transition-colors"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {loan.institutionName}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Pre-Qualified
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900">
                      {loan.productTitle}
                    </h3>
                  </div>

                  {/* Financial Terms */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-500">Max Facility</p>
                      <p className="font-bold text-stone-900 font-mono text-sm">
                        ₦{loan.maxAmount.toLocaleString('en-NG')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-500">Concessionary Rate</p>
                      <p className="font-bold text-emerald-800 font-mono text-sm">
                        {loan.interestRatePerAnnum}% p.a.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-500">Tenor / Duration</p>
                      <p className="font-semibold text-stone-800">{loan.tenorMonths} Months</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-500">Grace Moratorium</p>
                      <p className="font-semibold text-stone-800">{loan.moratoriumMonths} Mo. (Planting)</p>
                    </div>
                  </div>

                  {/* Product Features Checklist */}
                  <ul className="space-y-1.5 text-xs text-stone-600">
                    {loan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    setSelectedLoan(loan);
                    setBorrowAmount(Math.min(loan.maxAmount, 600000));
                  }}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simulate & Apply</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOAN APPLICATION & REPAYMENT SIMULATOR MODAL */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {selectedLoan.institutionName}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">
                  {selectedLoan.productTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Slider / Amount Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700">
                Requested Working Capital:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100000"
                  max={selectedLoan.maxAmount}
                  step="50000"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-400 font-mono">₦100k</span>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  ₦{borrowAmount.toLocaleString('en-NG')}
                </span>
                <span className="text-stone-400 font-mono">₦{(selectedLoan.maxAmount / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Repayment Cashflow Breakdown */}
            {(() => {
              const interest = Math.round(borrowAmount * (selectedLoan.interestRatePerAnnum / 100) * (selectedLoan.tenorMonths / 12));
              const totalRepayment = borrowAmount + interest;
              return (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
                  <p className="font-bold text-stone-900 border-b border-stone-200 pb-1.5">
                    Seasonal Harvest Cashflow Structure ({selectedLoan.repaymentStructure})
                  </p>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Principal Amount:</span>
                    <span className="font-semibold text-stone-900 font-mono">₦{borrowAmount.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total Concessionary Interest ({selectedLoan.interestRatePerAnnum}% p.a.):</span>
                    <span className="font-semibold text-stone-900 font-mono">₦{interest.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold border-t border-stone-200 pt-1.5">
                    <span>Total Harvest Balloon Settlement:</span>
                    <span className="font-mono text-sm">₦{totalRepayment.toLocaleString('en-NG')}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed bg-white p-2 rounded-lg border border-stone-200">
                    💡 <strong>Moratorium Advantage:</strong> You pay ₦0 monthly during the {selectedLoan.moratoriumMonths}-month planting & vegetative cycle. Repayment is debited upon harvest sale reconciliation.
                  </p>
                </div>
              );
            })()}

            <form onSubmit={handleApply} className="space-y-3 pt-2">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApplying}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Transmitting to Bank Desk...' : 'Submit Certified Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFIED BANK LOAN DOSSIER MODAL */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto print:p-0">
            <div className="flex justify-between items-start pb-3 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <FarmpalLogo variant="icon" theme="green" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      FarmPal Certified Agricultural Credit Dossier
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500">Official Credit Readiness & Underwriter Packet</p>
                </div>
              </div>
              <button
                onClick={() => setIsDossierModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dossier Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div>
                  <p className="text-stone-500 font-medium text-[10px]">Farmer Name</p>
                  <p className="font-bold text-stone-900">Musa Ibrahim</p>
                </div>
                <div>
                  <p className="text-stone-500 font-medium text-[10px]">Location</p>
                  <p className="font-bold text-stone-900">Kano State, Nigeria</p>
                </div>
                <div>
                  <p className="text-stone-500 font-medium text-[10px]">Credit Score</p>
                  <p className="font-bold text-emerald-800 font-mono">{creditData.score} ({creditData.ratingTier})</p>
                </div>
                <div>
                  <p className="text-stone-500 font-medium text-[10px]">Active Crops</p>
                  <p className="font-bold text-stone-900">{crops.length} Crops ({crops.reduce((s, c) => s + (c.farmSizeAcres || 1), 0)} Acres)</p>
                </div>
              </div>

              {/* Certified Financials */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-100 px-3 py-2 font-bold text-stone-800 flex justify-between">
                  <span>Farm Operating Summary</span>
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold">Audited via FarmPal Ledger</span>
                </div>
                <div className="divide-y divide-stone-100">
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-stone-600">Gross Realized Sales Revenue:</span>
                    <span className="font-mono font-bold text-stone-900">₦{farmSummary.totalEarned.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-stone-600">Direct Input & Labour Expenses:</span>
                    <span className="font-mono font-semibold text-stone-900">₦{farmSummary.totalSpent.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="px-3 py-2 flex justify-between bg-emerald-50/60 font-bold text-emerald-900">
                    <span>Net Operating Cashflow:</span>
                    <span className="font-mono">₦{farmSummary.netProfit.toLocaleString('en-NG')} ({farmSummary.netProfitMargin.toFixed(1)}% Margin)</span>
                  </div>
                  <div className="px-3 py-2 flex justify-between">
                    <span className="text-stone-600">Debtor Receivables Outstanding:</span>
                    <span className="font-mono text-stone-800">
                      ₦{(debtorSummary?.totalOutstanding || 0).toLocaleString('en-NG')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification watermark / notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Underwriter Attestation:</strong> This profile includes cryptographic hash validation of daily farmer entries, timestamped harvest receipts, and verified debtor settlement track records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Print / Save PDF Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
