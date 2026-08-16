import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Leaf, 
  Home, 
  UploadCloud, 
  ShieldCheck, 
  ShoppingCart, 
  Layers, 
  Coins, 
  ChevronDown, 
  Wallet,
  CheckCircle2,
  LogIn,
  LogOut,
  Sparkles,
  Globe
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
    connectBrowserWallet,
    isConnecting 
  } = useWeb3();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Authenticated Role-Based Navigation Configuration
  const getNavItemsForRole = () => {
    switch (role) {
      case 'VERIFIER':
        return [
          { id: 'verifier', label: 'Auditor Hub', icon: ShieldCheck },
          { id: 'explorer', label: 'Public Registry', icon: Layers },
        ];
      case 'BUYER':
        return [
          { id: 'buyer', label: 'Marketplace (INR ₹)', icon: ShoppingCart },
          { id: 'explorer', label: 'Public Registry', icon: Layers },
        ];
      case 'CORPORATE':
      default:
        return [
          { id: 'corporate', label: 'Producer Portal', icon: UploadCloud },
          { id: 'marketplace', label: 'Marketplace Floor', icon: ShoppingCart },
          { id: 'explorer', label: 'Public Registry', icon: Layers },
        ];
    }
  };

  const navItems = getNavItemsForRole();

  const getRoleDotClass = () => {
    if (role === 'VERIFIER') return 'bg-emerald-500';
    if (role === 'BUYER') return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        
        {/* Logo & Brand */}
        <div 
          onClick={() => {
            if (!isAuthenticated) setActiveTab('home');
          }}
          className="flex items-center space-x-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-primary-btn flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Zero<span className="gradient-text">Trace</span>
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                {isAuthenticated ? 'Workspace' : 'AI-MRV dApp'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {isAuthenticated ? `${activeAccount.name.split('(')[0]}` : 'Enterprise Carbon Credit Platform'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {isAuthenticated ? (
          <nav className="hidden md:flex items-center space-x-1.5 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <button 
              onClick={() => setActiveTab('home')}
              className={`transition hover:text-indigo-600 ${activeTab === 'home' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('explorer')}
              className={`transition hover:text-indigo-600 ${activeTab === 'explorer' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Public Registry
            </button>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          
          {isAuthenticated ? (
            <>
              {/* Wallet Token Balances */}
              <div className="hidden sm:flex items-center space-x-3 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-sans text-[11px]">Carbon:</span>
                  <span className="font-bold text-emerald-600">{ztcBalance} ZTC</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-sans text-[11px]">Balance:</span>
                  <span className="font-bold text-slate-900 font-sans">{inrBalance}</span>
                </div>
              </div>

              {/* Role Switcher */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="trust-btn-secondary px-3.5 py-2 text-xs flex items-center space-x-2"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${getRoleDotClass()}`} />
                  <span className="font-bold text-slate-800 truncate max-w-[130px]">
                    {activeAccount.name.split('(')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 space-y-1 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Switch Role</p>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">Switch active organization</p>
                      </div>

                      {DEMO_ACCOUNTS.map((acc, idx) => (
                        <button
                          key={acc.address}
                          onClick={() => {
                            switchAccount(idx);
                            setDropdownOpen(false);
                            if (acc.role === 'CORPORATE') setActiveTab('corporate');
                            else if (acc.role === 'VERIFIER') setActiveTab('verifier');
                            else if (acc.role === 'BUYER') setActiveTab('buyer');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            activeAccount.address === acc.address
                              ? 'bg-indigo-50/80 text-indigo-900 font-bold border border-indigo-100'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate">
                            <p className="truncate font-semibold">{acc.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.address.slice(0, 6)}...{acc.address.slice(-4)}</p>
                          </div>
                          {activeAccount.address === acc.address && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      ))}

                      <div className="pt-2 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                            setActiveTab('home');
                          }}
                          className="w-full p-2.5 rounded-xl text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold flex items-center justify-center space-x-2 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out & Return to Landing</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Logout Button */}
              <button
                onClick={() => {
                  logout();
                  setActiveTab('home');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition hidden sm:block"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="trust-btn-primary px-5 py-2.5 text-xs flex items-center space-x-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Launch App</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
