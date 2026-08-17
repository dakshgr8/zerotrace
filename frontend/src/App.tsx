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
  Leaf, 
  ShieldCheck, 
  Sparkles,
  Sun
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
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] text-[#1E293B] font-sans selection:bg-[#8B5CF6] selection:text-white">
      
      {/* Toast Notification Container with Playful Pop Style */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto p-4 rounded-2xl bg-white border-2 border-[#1E293B] shadow-pop flex items-start space-x-3 transition-all duration-300 animate-pop-in ${
              n.type === 'success'
                ? 'shadow-pop-mint'
                : n.type === 'error'
                ? 'shadow-pop-pink'
                : 'shadow-pop-violet'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {n.type === 'success' && (
                <div className="w-8 h-8 rounded-full bg-[#D1FAE5] border-2 border-[#1E293B] flex items-center justify-center text-[#047857]">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              {n.type === 'error' && (
                <div className="w-8 h-8 rounded-full bg-[#FCE7F3] border-2 border-[#1E293B] flex items-center justify-center text-[#DB2777]">
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              {n.type === 'info' && (
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] border-2 border-[#1E293B] flex items-center justify-center text-[#6D28D9]">
                  <Info className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-display font-extrabold text-[#1E293B]">{n.title}</h4>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-normal font-medium">{n.message}</p>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-[#64748B] hover:text-[#1E293B] flex-shrink-0 p-1 rounded-lg hover:bg-[#F1F5F9]"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
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

      {/* Playful Geometric Sticker Footer */}
      <footer className="w-full bg-white border-t-2 border-[#1E293B] py-8 px-4 sm:px-6 lg:px-8 mt-auto relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center text-white shadow-pop-xs">
              <Leaf className="w-5 h-5 text-[#FBBF24] stroke-[2.5]" />
            </div>
            <div>
              <span className="font-display font-black text-base text-[#1E293B] tracking-tight">ZeroTrace</span>
              <p className="text-[11px] text-[#64748B] font-medium">Playful Geometric AI-MRV Carbon Tokenization & Settlement</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#D1FAE5] border-2 border-[#1E293B] rounded-full shadow-pop-xs font-bold text-[#047857]">
              <Sun className="w-3.5 h-3.5 text-[#FBBF24] stroke-[2.5]" />
              <span>ERC-20: {CARBON_TOKEN_ADDRESS.slice(0, 6)}...{CARBON_TOKEN_ADDRESS.slice(-4)}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#FEF3C7] border-2 border-[#1E293B] rounded-full shadow-pop-xs font-bold text-[#B45309]">
              <span>Escrow: {MARKETPLACE_ADDRESS.slice(0, 6)}...{MARKETPLACE_ADDRESS.slice(-4)}</span>
            </div>

            <div className="px-3 py-1 bg-[#FCE7F3] border-2 border-[#1E293B] rounded-full shadow-pop-xs font-display font-black text-[#DB2777]">
              UNFCCC ACM0002 Compliance
            </div>
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
