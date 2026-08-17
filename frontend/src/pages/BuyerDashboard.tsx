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
  Zap,
  Sparkles, 
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
  const [beneficiary, setBeneficiary] = useState<string>('Infosys Technologies Ltd');
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
      addNotification('info', 'Purchasing Carbon Credits', `Executing settlement for ${amountNum} ZTC (${formatINR(totalCost)})...`);

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
    <div className="space-y-10 animate-pop-in max-w-5xl mx-auto">
      
      {/* Header Summary */}
      <div className="pop-card-pink p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[#FCE7F3] border-2 border-[#1E293B] flex items-center justify-center text-[#DB2777] shadow-pop-xs">
            <ShoppingCart className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-[#1E293B]">Carbon Credit Marketplace & Retirement</h1>
            <p className="text-xs text-[#64748B] font-medium">Acquire verified solar credits with Indian Rupee (₹) settlement and retire for official certificates.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-display font-bold">
          <div className="px-4 py-2 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] font-mono shadow-pop-xs">
            <span className="text-[#64748B] font-display font-bold">INR Wallet: </span>
            <span className="font-black text-[#1E293B] font-sans">{inrBalance}</span>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] font-mono shadow-pop-xs">
            <span className="text-[#64748B] font-display font-bold">Holding: </span>
            <span className="font-black text-[#047857]">{ztcBalance} ZTC</span>
          </div>
        </div>
      </div>

      {/* Clean Grid of Available Listings */}
      <div className="space-y-4">
        <span className="text-xs font-display font-black text-[#1E293B] uppercase tracking-wider px-1">
          Available Carbon Credits ({listings.length} Active Listings)
        </span>

        {listings.length === 0 ? (
          <div className="pop-card p-12 text-center text-[#64748B] text-xs bg-white">
            <p className="font-display font-black text-[#1E293B] text-base">No Active Listings in Order Book</p>
            <p className="text-[11px] mt-1 font-medium">Solar producers can list verified credits for sale from the marketplace tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {listings.map((item) => {
              const unitPrice = item.unit_price_inr || 1250;

              return (
                <div
                  key={item.id}
                  className="pop-card-yellow p-6 flex flex-col justify-between space-y-4 bg-white"
                >
                  <div>
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#FEF3C7] text-[#B45309] border-2 border-[#1E293B] shadow-pop-xs">
                        <Sun className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-sm text-[#1E293B]">{item.project_name || item.project_type}</h3>
                        <p className="text-[11px] text-[#64748B] font-bold">Vintage {item.vintage_year}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3.5 bg-[#FFFDF5] rounded-2xl border-2 border-[#1E293B] flex justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-[#64748B] uppercase block font-display font-black">Available</span>
                        <span className="font-black text-base text-[#047857]">{item.remaining_amount.toFixed(1)} ZTC</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#64748B] uppercase block font-display font-black">Price</span>
                        <span className="font-black text-base text-[#1E293B]">{formatINR(unitPrice)} <span className="text-[10px] font-sans font-normal text-[#64748B]">/ ton</span></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedListing(item);
                      setBuyAmount(Math.min(10, item.remaining_amount).toString());
                    }}
                    className="pop-btn-primary w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Buy Credits</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Retire Credits Section */}
      <div className="pop-card-mint p-8 space-y-5 bg-white">
        <div className="flex items-center space-x-3.5 pb-4 border-b-2 border-[#E2E8F0]">
          <div className="w-11 h-11 rounded-2xl bg-[#D1FAE5] border-2 border-[#1E293B] flex items-center justify-center text-[#047857] shadow-pop-xs">
            <Flame className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-[#1E293B]">Retire Carbon Credits for Certificate</h2>
            <p className="text-xs text-[#64748B] font-medium">Permanently neutralize your carbon footprint and generate an official cryptographic certificate.</p>
          </div>
        </div>

        <form onSubmit={handleBurnForOffset} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-display font-black text-[#1E293B] block mb-1">Quantity to Retire (ZTC)</label>
            <input
              type="number"
              min="1"
              max={ztcBalance}
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              className="w-full pop-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-display font-black text-[#1E293B] block mb-1">Company / Beneficiary Name</label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="w-full pop-input font-display font-bold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBurning || parseFloat(ztcBalance) <= 0}
            className="pop-btn-mint py-3 text-xs flex items-center justify-center space-x-1.5"
          >
            <Flame className="w-4 h-4 stroke-[2.5]" />
            <span>Retire & Get Certificate</span>
          </button>
        </form>
      </div>

      {/* Buy Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border-2 border-[#1E293B] shadow-pop-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#E2E8F0]">
              <h3 className="font-display font-black text-lg text-[#1E293B]">Buy Carbon Credits (INR ₹)</h3>
              <button onClick={() => setSelectedListing(null)} className="p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleBuyCredits} className="space-y-4">
              <div>
                <span className="text-xs text-[#64748B] block mb-0.5 font-display font-black">Project</span>
                <p className="text-sm font-display font-black text-[#1E293B]">{selectedListing.project_name || selectedListing.project_type}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-display font-black text-[#1E293B]">Quantity to Buy (ZTC)</label>
                  <span className="text-[11px] text-[#64748B] font-mono font-bold">Max: {selectedListing.remaining_amount} ZTC</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedListing.remaining_amount}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="w-full pop-input font-mono"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] space-y-1 text-xs font-mono">
                <div className="flex justify-between text-[#64748B]">
                  <span>Unit Price:</span>
                  <span>{formatINR(selectedListing.unit_price_inr || 1250)} / ton</span>
                </div>
                <div className="flex justify-between text-[#1E293B] font-black pt-1.5 border-t-2 border-[#E2E8F0]">
                  <span>Total Settlement:</span>
                  <span className="text-[#047857]">
                    {formatINR((parseFloat(buyAmount || '0') * (selectedListing.unit_price_inr || 1250)))}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBuying}
                className="pop-btn-primary w-full py-3.5 text-xs flex items-center justify-center space-x-2"
              >
                {isBuying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Executing Settlement...</span>
                  </>
                ) : (
                  <span>Confirm Purchase ({formatINR((parseFloat(buyAmount || '0') * (selectedListing.unit_price_inr || 1250)))})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        retirement={selectedRetirement}
        onClose={() => setSelectedRetirement(null)}
      />

    </div>
  );
};
