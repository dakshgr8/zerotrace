import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { LandingPage } from './pages/LandingPage';
import { CorporateDashboard } from './pages/CorporateDashboard';
import { VerifierDashboard } from './pages/VerifierDashboard';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { Marketplace } from './pages/Marketplace';
import { Explorer } from './pages/Explorer';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  ShieldCheck, 
  Leaf, 
  Globe, 
  ExternalLink 
} from 'lucide-react';
import { CARBON_TOKEN_ADDRESS, MARKETPLACE_ADDRESS } from './services/web3';

const MainLayout: React.FC = () => {
  const { 
    role, 
    isAuthenticated, 
    login, 
    notifications, 
    removeNotification 
  } = useWeb3();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  const handleSelectRoleFromLanding = (tab: string, accountIndex: number) => {
    login(accountIndex);
    setActiveTab(tab);
  };

  const handleTabChange = (tab: string) => {
    // If user is not authenticated and tries to open protected portals
    if (!isAuthenticated && ['corporate', 'verifier', 'buyer', 'marketplace'].includes(tab)) {
      setLoginModalOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl bg-white border shadow-lg flex items-start space-x-3 transition-all duration-300 animate-slide-up ${
              n.type === 'success'
                ? 'border-emerald-200 text-emerald-950'
                : n.type === 'error'
                ? 'border-rose-200 text-rose-950'
                : 'border-indigo-200 text-indigo-950'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {n.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-display">{n.title}</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">{n.message}</p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-700 flex-shrink-0 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* PUBLIC UN-AUTHENTICATED STATE */}
        {!isAuthenticated ? (
          <>
            {activeTab === 'home' && (
              <LandingPage 
                onSelectRole={handleSelectRoleFromLanding}
                onOpenLogin={() => setLoginModalOpen(true)}
              />
            )}

            {activeTab === 'explorer' && (
              <Explorer />
            )}
          </>
        ) : (
          /* AUTHENTICATED PLATFORM STATE */
          <>
            {activeTab === 'corporate' && (
              <CorporateDashboard />
            )}

            {activeTab === 'verifier' && (
              <VerifierDashboard />
            )}

            {activeTab === 'buyer' && (
              <BuyerDashboard />
            )}

            {activeTab === 'marketplace' && (
              <Marketplace />
            )}

            {activeTab === 'explorer' && (
              <Explorer />
            )}
          </>
        )}

      </main>

      {/* Role Login Gateway Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccessRole={(tab) => setActiveTab(tab)}
      />

      {/* Corporate Trust Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm text-slate-900 tracking-tight">ZeroTrace</span>
              <p className="text-[11px] text-slate-400">Enterprise AI-MRV Carbon Tokenization & Rupee Settlement</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Token: {CARBON_TOKEN_ADDRESS.slice(0, 6)}...{CARBON_TOKEN_ADDRESS.slice(-4)}</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Marketplace: {MARKETPLACE_ADDRESS.slice(0, 6)}...{MARKETPLACE_ADDRESS.slice(-4)}</span>
            </div>
            <span>&bull;</span>
            <span className="text-emerald-700 font-bold font-sans">₹ INR Enterprise Settlement</span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <MainLayout />
    </Web3Provider>
  );
};
export default App;
