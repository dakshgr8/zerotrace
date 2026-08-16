import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { web3Service, formatINR } from '../services/web3';
import { MarketplaceListing, Retirement } from '../types';
import { CertificateModal } from '../components/CertificateModal';
import { 
  Coins, 
  ShoppingCart, 
  Flame, 
  Sun, 
  Wind, 
  Loader2, 
  X,
  IndianRupee,
  ShieldCheck,
  Award
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { walletAddress, ztcBalance, inrBalance, activeAccount, refreshBalances, addNotification } = useWeb3();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Buy modal
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('10');
  const [isBuying, setIsBuying] = useState<boolean>(false);

  // Retire form
  const [burnAmount, setBurnAmount] = useState<string>('5');
  const [beneficiary, setBeneficiary] = useState<string>('Corporate ESG Sustainability');
  const [isBurning, setIsBurning] = useState<boolean>(false);
  const [selectedRetirement, setSelectedRetirement] = useState<Retirement | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [listData, retData] = await Promise.all([
        api.getListings(),
        api.getRetirements(),
      ]);
      setListings(listData);
      setRetirements(retData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [walletAddress]);

  const handleBuyCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    const amountNum = parseFloat(buyAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > selectedListing.remaining_amount) {
      addNotification('error', 'Invalid Amount', 'Please check available quantity.');
      return;
    }

    const unitPrice = selectedListing.unit_price_inr || 1250;
    const totalCost = amountNum * unitPrice;

    try {
      setIsBuying(true);
      addNotification('info', 'Purchasing Carbon Credits', `Executing on-chain settlement for ${amountNum} ZTC (${formatINR(totalCost)})...`);

      await web3Service.buyCreditsFromMarketplace(
        selectedListing.listing_id,
        amountNum,
        unitPrice,
        activeAccount.privateKey
      );

      await api.syncPurchase(selectedListing.listing_id, amountNum);
      await refreshBalances();
      await loadData();
      setSelectedListing(null);

      addNotification('success', 'Purchase Successful!', `Bought ${amountNum} ZTC carbon credits for ${formatINR(totalCost)}.`);
    } catch (err: any) {
      addNotification('error', 'Purchase Failed', err.reason || err.message || 'Failed to buy');
    } finally {
      setIsBuying(false);
    }
  };

  const handleBurnForOffset = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(burnAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > parseFloat(ztcBalance)) {
      addNotification('error', 'Invalid Amount', 'Please check available balance.');
      return;
    }

    try {
      setIsBurning(true);
      addNotification('info', 'Retiring Credits', 'Permanently neutralizing carbon units on blockchain...');

      const result = await web3Service.burnForOffset(
        amountNum,
        beneficiary,
        'Scope 1 & 2 Neutralization',
        activeAccount.privateKey
      );

      const ret = await api.recordRetirement({
        certificate_id: result.certificateId,
        burner_wallet: walletAddress,
        corporate_beneficiary: beneficiary,
        reason: 'Scope 1 & 2 Neutralization',
        amount_tonnes: amountNum,
        tx_hash: result.txHash,
        block_number: result.blockNumber,
      });

      await refreshBalances();
      await loadData();
      addNotification('success', 'Offset Retired!', `Retired ${amountNum} ZTC. Cryptographic certificate generated!`);
      setSelectedRetirement(ret);
    } catch (err: any) {
      addNotification('error', 'Retirement Failed', err.reason || err.message || 'Failed to retire');
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Summary */}
      <div className="trust-card p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-slate-900">Carbon Credit Marketplace (INR ₹)</h1>
            <p className="text-xs text-slate-500">Direct peer-to-peer carbon trading with instant blockchain settlement in Indian Rupees.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-medium">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-500">Wallet Balance: </span>
            <span className="font-bold text-slate-900 font-sans">{inrBalance}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono">
            <span className="text-slate-500">Credits: </span>
            <span className="font-bold text-emerald-600">{ztcBalance} ZTC</span>
          </div>
        </div>
      </div>

      {/* Clean Grid of Available Listings */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
          Available Carbon Credits ({listings.length})
        </span>

        {listings.length === 0 ? (
          <div className="trust-card p-12 text-center text-slate-500 text-xs">
            <p className="font-bold text-slate-900">No Active Listings in Order Book</p>
            <p className="text-[11px] mt-1">Energy producers can list verified credits for sale from the marketplace tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {listings.map((item) => {
              const isSolar = item.project_type.toLowerCase().includes('solar');
              const unitPrice = item.unit_price_inr || 1250;

              return (
                <div
                  key={item.id}
                  className="trust-card-hover p-6 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSolar ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {isSolar ? <Sun className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-xs text-slate-900">{item.project_name || item.project_type}</h3>
                        <p className="text-[10px] text-slate-400">Vintage {item.vintage_year}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Available</span>
                        <span className="font-bold text-emerald-600">{item.remaining_amount.toFixed(1)} ZTC</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Price</span>
                        <span className="font-bold text-slate-900">{formatINR(unitPrice)} <span className="text-[10px] font-sans font-normal text-slate-400">/ ton</span></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedListing(item);
                      setBuyAmount(Math.min(10, item.remaining_amount).toString());
                    }}
                    className="trust-btn-primary w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Buy Credits</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retire Credits Section */}
      <div className="trust-card p-8 space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-900">Retire Carbon Credits</h2>
            <p className="text-xs text-slate-500">Permanently neutralize your company's carbon footprint and generate an official cryptographic certificate.</p>
          </div>
        </div>

        <form onSubmit={handleBurnForOffset} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Quantity to Retire (ZTC)</label>
            <input
              type="number"
              min="1"
              max={ztcBalance}
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              className="w-full trust-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Company / Beneficiary</label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="w-full trust-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBurning || parseFloat(ztcBalance) <= 0}
            className="trust-btn-secondary py-3 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center space-x-1.5"
          >
            <Flame className="w-4 h-4" />
            <span>Retire & Get Certificate</span>
          </button>
        </form>
      </div>

      {/* Buy Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-base text-slate-900">Buy Carbon Credits (INR ₹)</h3>
              <button onClick={() => setSelectedListing(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBuyCredits} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5 font-bold">Project</span>
                <p className="text-sm font-bold text-slate-900">{selectedListing.project_name || selectedListing.project_type}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Quantity to Buy (ZTC)</label>
                  <span className="text-[11px] text-slate-400 font-mono">Max: {selectedListing.remaining_amount} ZTC</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedListing.remaining_amount}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="w-full trust-input font-mono"
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Unit Price:</span>
                  <span>{formatINR(selectedListing.unit_price_inr || 1250)} / ton</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Total Settlement:</span>
                  <span className="text-emerald-600">
                    {formatINR((parseFloat(buyAmount || '0') * (selectedListing.unit_price_inr || 1250)))}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBuying}
                className="trust-btn-primary w-full py-3.5 text-xs flex items-center justify-center space-x-2"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Blockchain Settlement...</span>
                  </>
                ) : (
                  <span>Confirm Purchase ({formatINR((parseFloat(buyAmount || '0') * (selectedListing.unit_price_inr || 1250)))})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <CertificateModal
        retirement={selectedRetirement}
        onClose={() => setSelectedRetirement(null)}
      />

    </div>
  );
};
