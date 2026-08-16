import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { DEMO_ACCOUNTS } from '../services/web3';
import { 
  Sun,
  Leaf, 
  ShieldCheck, 
  ShoppingCart, 
  Wallet, 
  X, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessRole?: (tab: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccessRole }) => {
  const { login, connectBrowserWallet, isConnecting } = useWeb3();

  if (!isOpen) return null;

  const roles = [
    {
      index: 0,
      tab: 'corporate',
      title: 'Energy Producer',
      name: DEMO_ACCOUNTS[0].name,
      description: 'Submit plant generation data, review physical baseline models, and mint carbon credits.',
      icon: Sun,
      iconColor: 'text-amber-500',
      bgBadge: 'bg-amber-50 border-amber-100',
      btnClass: 'trust-btn-primary',
    },
    {
      index: 1,
      tab: 'verifier',
      title: 'Independent Auditor',
      name: DEMO_ACCOUNTS[1].name,
      description: 'Review AI multi-sensor anomaly detection, verify grid meters, and issue digital signatures.',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      bgBadge: 'bg-emerald-50 border-emerald-100',
      btnClass: 'trust-btn-emerald',
    },
    {
      index: 2,
      tab: 'buyer',
      title: 'Carbon Credit Buyer',
      name: DEMO_ACCOUNTS[2].name,
      description: 'Purchase verified carbon credits in Indian Rupees (₹) and retire them for certificates.',
      icon: ShoppingCart,
      iconColor: 'text-amber-600',
      bgBadge: 'bg-amber-50 border-amber-100',
      btnClass: 'trust-btn-secondary',
    },
  ];

  const handleSelectRole = (index: number, tab: string) => {
    login(index);
    if (onSuccessRole) onSuccessRole(tab);
    onClose();
  };

  const handleBrowserConnect = async () => {
    await connectBrowserWallet();
    if (onSuccessRole) onSuccessRole('corporate');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-900">Sign In to ZeroTrace</h2>
              <p className="text-xs text-slate-500">Select your organization role to enter your secure workspace.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Cards */}
        <div className="space-y-3.5">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div
                key={role.index}
                onClick={() => handleSelectRole(role.index, role.tab)}
                className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:bg-slate-50/80 cursor-pointer transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-card"
              >
                <div className="flex items-start space-x-3.5 pr-3">
                  <div className={`w-10 h-10 rounded-xl border flex-shrink-0 flex items-center justify-center ${role.bgBadge} ${role.iconColor} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-extrabold text-xs text-slate-900">{role.title}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">({role.name.split('(')[0].trim()})</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{role.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Wallet Connect Option */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">Need to test a custom Ethereum address?</span>
          <button
            type="button"
            onClick={handleBrowserConnect}
            disabled={isConnecting}
            className="trust-btn-secondary px-4 py-2 text-xs flex items-center space-x-1.5 w-full sm:w-auto justify-center"
          >
            <Wallet className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
