import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Leaf, 
  UploadCloud, 
  ShieldCheck, 
  ShoppingCart, 
  Layers, 
  ChevronDown, 
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
  Sun,
  Coins,
  IndianRupee
} from 'lucide-react';
import { DEMO_ACCOUNTS } from '../services/web3';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenLogin }) => {
  const { 
    activeAccount, 
    role, 
    ztcBalance, 
    inrBalance, 
    isAuthenticated,
    logout,
    switchAccount, 
  } = useWeb3();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Authenticated Role-Based Navigation Configuration
  const getNavItemsForRole = () => {
    switch (role) {
      case 'VERIFIER':
        return [
          { id: 'verifier', label: 'Auditor Hub', icon: ShieldCheck, color: 'hover:bg-[#D1FAE5]' },
          { id: 'explorer', label: 'Public Registry', icon: Layers, color: 'hover:bg-[#EDE9FE]' },
        ];
      case 'BUYER':
        return [
          { id: 'buyer', label: 'Carbon Marketplace', icon: ShoppingCart, color: 'hover:bg-[#FEF3C7]' },
          { id: 'explorer', label: 'Public Registry', icon: Layers, color: 'hover:bg-[#EDE9FE]' },
        ];
      case 'CORPORATE':
      default:
        return [
          { id: 'corporate', label: 'Producer Portal', icon: UploadCloud, color: 'hover:bg-[#FEF3C7]' },
          { id: 'marketplace', label: 'Marketplace Floor', icon: ShoppingCart, color: 'hover:bg-[#FCE7F3]' },
          { id: 'explorer', label: 'Public Registry', icon: Layers, color: 'hover:bg-[#EDE9FE]' },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  const getRoleDotClass = () => {
    if (role === 'VERIFIER') return 'bg-[#34D399]';
    if (role === 'BUYER') return 'bg-[#F472B6]';
    return 'bg-[#FBBF24]';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF5]/90 backdrop-blur-md border-b-2 border-[#1E293B] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-2">
        
        {/* Left: Brand Logo Sticker */}
        <div 
          onClick={() => {
            if (!isAuthenticated) setActiveTab('home');
          }}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center text-white shadow-pop-xs transition-transform group-hover:rotate-6 group-hover:scale-105">
            <Leaf className="w-5 h-5 text-[#FBBF24] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-xl text-[#1E293B] tracking-tight">
                Zero<span className="text-[#8B5CF6]">Trace</span>
              </span>
              <span className="bg-[#FBBF24] text-[#1E293B] border-2 border-[#1E293B] rounded-full px-2 py-0.5 text-[10px] font-display font-black tracking-wide shadow-pop-xs">
                {isAuthenticated ? 'APP' : 'AI-MRV'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
              {isAuthenticated ? activeAccount.name.split('(')[0] : 'Solar Carbon Credit Protocol'}
            </p>
          </div>
        </div>

        {/* Center: Navigation Pill Tabs */}
        {isAuthenticated ? (
          <nav className="hidden md:flex items-center space-x-2 p-1.5 bg-white border-2 border-[#1E293B] rounded-full shadow-pop-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-display font-extrabold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#8B5CF6] text-white border-2 border-[#1E293B] shadow-pop-xs translate-x-[-1px] translate-y-[-1px]'
                      : `text-[#1E293B] ${item.color}`
                  }`}
                >
                  <Icon className={`w-4 h-4 stroke-[2.5] ${isActive ? 'text-[#FBBF24]' : 'text-[#1E293B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center space-x-6 text-xs font-display font-extrabold text-[#1E293B]">
            <button 
              onClick={() => setActiveTab('home')}
              className={`transition hover:text-[#8B5CF6] px-3 py-1 rounded-full ${activeTab === 'home' ? 'bg-[#EDE9FE] border-2 border-[#1E293B] shadow-pop-xs' : ''}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`transition hover:text-[#8B5CF6] px-3 py-1 rounded-full ${activeTab === 'explorer' ? 'bg-[#EDE9FE] border-2 border-[#1E293B] shadow-pop-xs' : ''}`}
            >
              Public Registry
            </button>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          
          {isAuthenticated ? (
            <>
              {/* Role-Specific Balances / Verification Badge */}
              {role === 'VERIFIER' ? (
                <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 bg-[#D1FAE5] border-2 border-[#1E293B] rounded-full text-xs font-display font-extrabold shadow-pop-xs">
                  <ShieldCheck className="w-4 h-4 text-[#047857] stroke-[2.5]" />
                  <span className="text-[#047857] text-[11px] uppercase tracking-wide">
                    Authorized Oracle Verifier
                  </span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-3 px-3.5 py-1.5 bg-white border-2 border-[#1E293B] rounded-full text-xs font-mono shadow-pop-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#64748B] font-display text-[11px] font-bold">Credits:</span>
                    <span className="font-extrabold text-[#059669]">{ztcBalance} ZTC</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[#64748B] font-display text-[11px] font-bold">{role === 'BUYER' ? 'Wallet:' : 'Treasury:'}</span>
                    <span className="font-extrabold text-[#1E293B] font-sans">{inrBalance}</span>
                  </div>
                </div>
              )}

              {/* Role Switcher Pop Button */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="pop-btn-secondary px-3.5 py-1.5 text-xs flex items-center space-x-2"
                >
                  <div className={`w-3 h-3 rounded-full border border-[#1E293B] ${getRoleDotClass()}`} />
                  <span className="font-display font-bold text-[#1E293B] truncate max-w-[130px]">
                    {activeAccount.name.split('(')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#1E293B] stroke-[2.5] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border-2 border-[#1E293B] shadow-pop-lg z-50 p-2.5 space-y-1.5 animate-pop-in">
                      <div className="px-3 py-2 border-b-2 border-[#E2E8F0] mb-1">
                        <p className="text-[10px] uppercase font-display font-black text-[#8B5CF6] tracking-wider">Switch Organization</p>
                        <p className="text-xs text-[#64748B] font-medium mt-0.5">Select active enterprise identity</p>
                      </div>

                      {DEMO_ACCOUNTS.map((acc, idx) => {
                        const isSelected = activeAccount.address === acc.address;
                        const bgCard = idx === 0 ? 'hover:bg-[#FEF3C7]' : idx === 1 ? 'hover:bg-[#D1FAE5]' : 'hover:bg-[#FCE7F3]';
                        
                        return (
                          <button
                            key={acc.address}
                            onClick={() => {
                              switchAccount(idx);
                              setDropdownOpen(false);
                              if (acc.role === 'CORPORATE') setActiveTab('corporate');
                              else if (acc.role === 'VERIFIER') setActiveTab('verifier');
                              else if (acc.role === 'BUYER') setActiveTab('buyer');
                            }}
                            className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition-all border-2 ${
                              isSelected
                                ? 'bg-[#EDE9FE] text-[#1E293B] font-bold border-[#1E293B] shadow-pop-xs'
                                : `border-transparent ${bgCard} text-[#1E293B]`
                            }`}
                          >
                            <div className="truncate">
                              <p className="truncate font-display font-bold text-xs">{acc.name}</p>
                              <p className="text-[10px] text-[#64748B] font-mono mt-0.5">{acc.address.slice(0, 6)}...{acc.address.slice(-4)}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] stroke-[2.5] flex-shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}

                      <div className="pt-2 border-t-2 border-[#E2E8F0] mt-1">
                        <button
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                            setActiveTab('home');
                          }}
                          className="w-full p-2.5 rounded-xl text-xs bg-[#F1F5F9] hover:bg-[#FCE7F3] hover:text-[#DB2777] text-[#1E293B] font-display font-bold flex items-center justify-center space-x-2 transition border-2 border-transparent hover:border-[#1E293B]"
                        >
                          <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Sign Out & Return Home</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Logout */}
              <button
                onClick={() => {
                  logout();
                  setActiveTab('home');
                }}
                className="p-2 rounded-xl text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition hidden sm:block border-2 border-transparent hover:border-[#1E293B]"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="pop-btn-primary px-5 py-2 text-xs flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Launch App</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
