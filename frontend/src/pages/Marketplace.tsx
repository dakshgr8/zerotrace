import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { web3Service, formatINR } from '../services/web3';
import { MarketplaceListing } from '../types';
import { 
  Coins, 
  ShoppingCart, 
  Tag, 
  PlusCircle, 
  X, 
  Search, 
  Loader2, 
  Sun, 
  Zap,
  Sparkles,
  Layers,
  Trash2,
  CheckCircle2,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

export const Marketplace: React.FC = () => {
  const { walletAddress, ztcBalance, inrBalance, activeAccount, refreshBalances, addNotification } = useWeb3();

  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // List modal state
  const [showListModal, setShowListModal] = useState<boolean>(false);
  const [listAmount, setListAmount] = useState<string>('25');
  const [listUnitPrice, setListUnitPrice] = useState<string>('1250');
  const [listVintage, setListVintage] = useState<number>(2026);
  const [listProjectType, setListProjectType] = useState<string>('Bhadla Solar Asset Phase IV');
  const [isListing, setIsListing] = useState<boolean>(false);

  // Buy modal state
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('10');
  const [isBuying, setIsBuying] = useState<boolean>(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await api.getListings();
      setListings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(listAmount);
    const priceNum = parseFloat(listUnitPrice);

    if (isNaN(amountNum) || amountNum <= 0 || isNaN(priceNum) || priceNum <= 0) {
      addNotification('error', 'Invalid Input', 'Please check listing amount and price.');
      return;
    }

    if (amountNum > parseFloat(ztcBalance)) {
      addNotification('error', 'Insufficient Balance', `You only have ${ztcBalance} ZTC available to list.`);
      return;
    }

    try {
      setIsListing(true);
      addNotification('info', 'Creating Escrow Listing', 'Locking tokens into non-custodial marketplace escrow...');

      const onChainResult = await web3Service.listCreditsOnMarketplace(
        amountNum,
        priceNum,
        listVintage,
        listProjectType,
        activeAccount.privateKey
      );

      await api.createListing({
        listing_id: onChainResult.listingId,
        seller_wallet: walletAddress,
        project_type: listProjectType,
        project_name: listProjectType,
        vintage_year: listVintage,
        total_amount: amountNum,
        unit_price_inr: priceNum,
        tx_hash: onChainResult.txHash,
      });

      await refreshBalances();
      await fetchListings();
      setShowListModal(false);

      addNotification('success', 'Listing Active!', `Listed ${amountNum} ZTC for sale at ${formatINR(priceNum)}/ton.`);
    } catch (err: any) {
      addNotification('error', 'Listing Failed', err.reason || err.message || 'Failed to list credits');
    } finally {
      setIsListing(false);
    }
  };

  const handleBuyCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    const amountNum = parseFloat(buyAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > selectedListing.remaining_amount) {
      addNotification('error', 'Invalid Amount', 'Please enter a valid quantity.');
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
      await fetchListings();
      setSelectedListing(null);

      addNotification(
        'success',
        'Credits Purchased!',
        `Successfully bought ${amountNum} ZTC for ${formatINR(totalCost)}!`
      );
    } catch (err: any) {
      addNotification('error', 'Purchase Failed', err.reason || err.message || 'Failed to buy credits');
    } finally {
      setIsBuying(false);
    }
  };

  const handleCancelListing = async (listing: MarketplaceListing) => {
    try {
      addNotification('info', 'Canceling Listing', 'Unlocking escrow tokens back to your wallet...');

      await web3Service.cancelListing(listing.listing_id, activeAccount.privateKey);
      await api.cancelListing(listing.listing_id);
      await refreshBalances();
      await fetchListings();

      addNotification('success', 'Listing Canceled', 'Remaining credits returned to your wallet.');
    } catch (err: any) {
      addNotification('error', 'Cancel Error', err.reason || err.message || 'Failed to cancel listing');
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.project_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.project_name && l.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'UTILITY' && (l.project_type.toLowerCase().includes('utility') || l.project_type.toLowerCase().includes('park') || (l.project_name && (l.project_name.toLowerCase().includes('bhadla') || l.project_name.toLowerCase().includes('rewa') || l.project_name.toLowerCase().includes('pavagada'))))) ||
      (selectedCategory === 'ROOFTOP' && (l.project_type.toLowerCase().includes('rooftop') || l.project_type.toLowerCase().includes('commercial'))) ||
      (selectedCategory === 'FLOATING' && (l.project_type.toLowerCase().includes('floating') || (l.project_name && l.project_name.toLowerCase().includes('floating'))));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-pop-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="pop-card-yellow p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[#FEF3C7] border-2 border-[#1E293B] flex items-center justify-center text-[#B45309] shadow-pop-xs">
            <Sun className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-[#1E293B]">Solar Carbon Credit Marketplace</h1>
            <p className="text-xs text-[#64748B] font-medium">
              Peer-to-peer verified solar credit trading with non-custodial smart contract escrow in Indian Rupees (₹)
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowListModal(true)}
          className="pop-btn-primary px-6 py-3 text-xs flex items-center space-x-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 text-[#FBBF24] stroke-[2.5]" />
          <span>List Solar Credits for Sale</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="pop-card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#64748B] stroke-[2.5]" />
          <input
            type="text"
            placeholder="Search solar park, project, or vintage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pop-input pl-10 text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 p-1.5 bg-[#F1F5F9] border-2 border-[#1E293B] rounded-full text-xs font-display font-bold w-full sm:w-auto justify-center overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-1.5 rounded-full transition-all ${
              selectedCategory === 'ALL' ? 'bg-[#8B5CF6] text-white border-2 border-[#1E293B] shadow-pop-xs' : 'text-[#1E293B] hover:text-[#8B5CF6]'
            }`}
          >
            All Credits
          </button>
          <button
            onClick={() => setSelectedCategory('UTILITY')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              selectedCategory === 'UTILITY' ? 'bg-[#FEF3C7] text-[#B45309] border-2 border-[#1E293B] shadow-pop-xs' : 'text-[#1E293B] hover:text-[#B45309]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mega Solar</span>
          </button>
          <button
            onClick={() => setSelectedCategory('ROOFTOP')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              selectedCategory === 'ROOFTOP' ? 'bg-[#EDE9FE] text-[#6D28D9] border-2 border-[#1E293B] shadow-pop-xs' : 'text-[#1E293B] hover:text-[#6D28D9]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>C&I Rooftop</span>
          </button>
          <button
            onClick={() => setSelectedCategory('FLOATING')}
            className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-1.5 ${
              selectedCategory === 'FLOATING' ? 'bg-[#D1FAE5] text-[#047857] border-2 border-[#1E293B] shadow-pop-xs' : 'text-[#1E293B] hover:text-[#047857]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Floating Solar</span>
          </button>
        </div>

      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.length === 0 ? (
          <div className="col-span-full pop-card p-16 text-center text-[#64748B] text-xs space-y-2 bg-white">
            <Sun className="w-12 h-12 text-[#FBBF24] mx-auto mb-2 stroke-[2.5]" />
            <p className="font-display font-black text-[#1E293B] text-base">No Active Solar Listings in Escrow</p>
            <p className="text-[11px] font-medium">Energy producers can deposit credits for sale using the button above.</p>
          </div>
        ) : (
          filteredListings.map((item) => {
            const isFloating = item.project_type.toLowerCase().includes('floating');
            const isMyListing = item.seller_wallet.toLowerCase() === walletAddress.toLowerCase();
            const unitPrice = item.unit_price_inr || 1250;
            const cardColor = isFloating ? 'pop-card-mint' : 'pop-card-yellow';

            return (
              <div
                key={item.id}
                className={`${cardColor} p-6 flex flex-col justify-between space-y-5 bg-white`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 border-[#1E293B] ${
                        isFloating ? 'bg-[#D1FAE5] text-[#047857]' : 'bg-[#FEF3C7] text-[#B45309]'
                      } shadow-pop-xs`}>
                        <Sun className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-sm text-[#1E293B]">{item.project_name || item.project_type}</h3>
                        <p className="text-[11px] text-[#64748B] font-bold">Vintage {item.vintage_year}</p>
                      </div>
                    </div>

                    {isMyListing && (
                      <span className="pop-badge-slate text-[9px]">
                        My Listing
                      </span>
                    )}
                  </div>

                  <div className="mt-5 p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-display font-black">Available</span>
                      <p className="font-mono font-black text-lg text-[#047857] mt-0.5">{item.remaining_amount.toFixed(1)} ZTC</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-display font-black">Price per ton</span>
                      <p className="font-mono font-black text-lg text-[#1E293B] mt-0.5">{formatINR(unitPrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-[#E2E8F0] space-y-2">
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono">
                    <span>Seller:</span>
                    <span className="font-bold">{item.seller_wallet.slice(0, 6)}...{item.seller_wallet.slice(-4)}</span>
                  </div>

                  {isMyListing ? (
                    <button
                      onClick={() => handleCancelListing(item)}
                      className="pop-btn-pink w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Cancel Listing & Reclaim</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedListing(item);
                        setBuyAmount(Math.min(10, item.remaining_amount).toString());
                      }}
                      className="pop-btn-primary w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Buy Carbon Credits</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border-2 border-[#1E293B] shadow-pop-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-[#8B5CF6] stroke-[2.5]" />
                <h3 className="font-display font-black text-lg text-[#1E293B]">List Carbon Credits (INR ₹)</h3>
              </div>
              <button onClick={() => setShowListModal(false)} className="p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="text-xs font-display font-black text-[#1E293B] block mb-1.5">Project / Asset Name</label>
                <input
                  type="text"
                  value={listProjectType}
                  onChange={(e) => setListProjectType(e.target.value)}
                  className="w-full pop-input text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-display font-black text-[#1E293B]">Credits to List (ZTC)</label>
                  <span className="text-[11px] text-[#64748B] font-mono font-bold">Available: {ztcBalance} ZTC</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={ztcBalance}
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                  className="w-full pop-input text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-display font-black text-[#1E293B] block mb-1.5">Unit Price (₹ per ZTC / ton CO₂)</label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  value={listUnitPrice}
                  onChange={(e) => setListUnitPrice(e.target.value)}
                  className="w-full pop-input text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isListing || parseFloat(ztcBalance) <= 0}
                className="pop-btn-primary w-full py-3.5 text-xs flex items-center justify-center space-x-2 mt-4"
              >
                {isListing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Locking Tokens in Escrow...</span>
                  </>
                ) : (
                  <span>Deposit & List Credits for Sale</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop-in">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border-2 border-[#1E293B] shadow-pop-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#E2E8F0]">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-[#8B5CF6] stroke-[2.5]" />
                <h3 className="font-display font-black text-lg text-[#1E293B]">Buy Carbon Credits (INR ₹)</h3>
              </div>
              <button onClick={() => setSelectedListing(null)} className="p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B]">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleBuyCredits} className="space-y-4">
              <div>
                <span className="text-xs text-[#64748B] block mb-1 font-display font-black">Project</span>
                <p className="text-sm font-display font-black text-[#1E293B]">{selectedListing.project_name || selectedListing.project_type}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-display font-black text-[#1E293B]">Quantity to Buy (ZTC)</label>
                  <span className="text-[11px] text-[#64748B] font-mono font-bold">
                    Max: {selectedListing.remaining_amount} ZTC
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={selectedListing.remaining_amount}
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  className="w-full pop-input text-xs font-mono"
                  required
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#1E293B] text-xs space-y-1.5 font-mono">
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
                    <span>Executing Purchase...</span>
                  </>
                ) : (
                  <span>Confirm Purchase ({formatINR((parseFloat(buyAmount || '0') * (selectedListing.unit_price_inr || 1250)))})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
