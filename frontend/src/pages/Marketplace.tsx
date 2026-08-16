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
  Wind,
  Trash2
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
  const [listProjectType, setListProjectType] = useState<string>('Solar Power Asset');
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
      addNotification('info', 'Creating Escrow Listing', 'Approving tokens and locking into marketplace contract...');

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
      addNotification('info', 'Purchasing Carbon Credits', `Executing on-chain settlement for ${amountNum} ZTC (${formatINR(totalCost)})...`);

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
      (selectedCategory === 'SOLAR' && l.project_type.toLowerCase().includes('solar')) ||
      (selectedCategory === 'WIND' && l.project_type.toLowerCase().includes('wind'));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="trust-card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl text-slate-900">Decentralized Carbon Marketplace</h1>
              <p className="text-xs text-slate-500">
                Peer-to-peer carbon credit trading with non-custodial smart contract escrow in Indian Rupees (₹)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowListModal(true)}
          className="trust-btn-primary px-6 py-3 text-xs flex items-center space-x-2 whitespace-nowrap shadow-primary-btn"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Credits for Sale</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="trust-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search solar, wind, or asset name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full trust-input pl-10 text-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold w-full sm:w-auto justify-center">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedCategory === 'ALL' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => setSelectedCategory('SOLAR')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              selectedCategory === 'SOLAR' ? 'bg-white text-amber-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Solar</span>
          </button>
          <button
            onClick={() => setSelectedCategory('WIND')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              selectedCategory === 'WIND' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
        </div>

      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.length === 0 ? (
          <div className="col-span-full trust-card p-16 text-center text-slate-500 text-xs">
            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-900">No Active Listings in Escrow</p>
            <p className="text-[11px] mt-1">Energy producers can list carbon credits using the button above.</p>
          </div>
        ) : (
          filteredListings.map((item) => {
            const isSolar = item.project_type.toLowerCase().includes('solar');
            const isMyListing = item.seller_wallet.toLowerCase() === walletAddress.toLowerCase();
            const unitPrice = item.unit_price_inr || 1250;

            return (
              <div
                key={item.id}
                className="trust-card-hover p-8 flex flex-col justify-between space-y-5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSolar ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {isSolar ? <Sun className="w-5 h-5" /> : <Wind className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-slate-900">{item.project_name || item.project_type}</h3>
                        <p className="text-[10px] text-slate-400">Vintage Year {item.vintage_year}</p>
                      </div>
                    </div>

                    {isMyListing && (
                      <span className="trust-badge-indigo px-2 py-0.5 text-[9px]">
                        My Listing
                      </span>
                    )}
                  </div>

                  <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining</span>
                      <p className="font-mono font-extrabold text-base text-emerald-600 mt-0.5">{item.remaining_amount.toFixed(1)} ZTC</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Price</span>
                      <p className="font-mono font-extrabold text-base text-slate-900 mt-0.5">{formatINR(unitPrice)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Seller:</span>
                    <span className="font-mono">{item.seller_wallet.slice(0, 6)}...{item.seller_wallet.slice(-4)}</span>
                  </div>

                  {isMyListing ? (
                    <button
                      onClick={() => handleCancelListing(item)}
                      className="trust-btn-secondary w-full py-2.5 text-xs text-rose-600 hover:text-rose-700 hover:border-rose-300 font-bold flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Listing & Reclaim</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedListing(item);
                        setBuyAmount(Math.min(10, item.remaining_amount).toString());
                      }}
                      className="trust-btn-primary w-full py-2.5 text-xs flex items-center justify-center space-x-1.5"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                <h3 className="font-display font-extrabold text-base text-slate-900">List Carbon Credits (INR ₹)</h3>
              </div>
              <button onClick={() => setShowListModal(false)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Project / Asset Name</label>
                <input
                  type="text"
                  value={listProjectType}
                  onChange={(e) => setListProjectType(e.target.value)}
                  className="w-full trust-input text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Credits to List (ZTC)</label>
                  <span className="text-[11px] text-slate-400 font-mono">Available: {ztcBalance} ZTC</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={ztcBalance}
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                  className="w-full trust-input text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Unit Price (₹ per ZTC / ton CO₂)</label>
                <input
                  type="number"
                  step="50"
                  min="100"
                  value={listUnitPrice}
                  onChange={(e) => setListUnitPrice(e.target.value)}
                  className="w-full trust-input text-xs font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isListing || parseFloat(ztcBalance) <= 0}
                className="trust-btn-primary w-full py-3.5 text-xs flex items-center justify-center space-x-2 mt-4"
              >
                {isListing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                <h3 className="font-display font-extrabold text-base text-slate-900">Buy Carbon Credits (INR ₹)</h3>
              </div>
              <button onClick={() => setSelectedListing(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBuyCredits} className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 block mb-1 font-bold">Project</span>
                <p className="text-sm font-bold text-slate-900">{selectedListing.project_name || selectedListing.project_type}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Quantity to Buy (ZTC)</label>
                  <span className="text-[11px] text-slate-400 font-mono">
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
                  className="w-full trust-input text-xs font-mono"
                  required
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-500 text-[11px]">
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
