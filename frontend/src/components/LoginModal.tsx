import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { DEMO_ACCOUNTS } from '../services/web3';
import { 
  Sun,
  ShieldCheck, 
  ShoppingCart, 
  Wallet, 
  X, 
  ArrowRight,
  Lock,
  Sparkles
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
      title: 'Solar Power Producer',
      name: DEMO_ACCOUNTS[0].name,
      description: 'Submit plant generation data, review physical baseline models, and mint carbon credits.',
      icon: Sun,
      iconColor: 'text-[#B45309]',
      bgBadge: 'bg-[#FEF3C7]',
      btnClass: 'pop-btn-yellow',
    },
    {
      index: 1,
      tab: 'verifier',
      title: 'Government Auditor',
      name: DEMO_ACCOUNTS[1].name,
      description: 'Review AI multi-sensor anomaly detection, verify grid meters, and issue digital signatures.',
      icon: ShieldCheck,
      iconColor: 'text-[#047857]',
      bgBadge: 'bg-[#D1FAE5]',
      btnClass: 'pop-btn-mint',
    },
    {
      index: 2,
      tab: 'buyer',
      title: 'Corporate Carbon Buyer',
      name: DEMO_ACCOUNTS[2].name,
      description: 'Purchase verified carbon credits in Indian Rupees (₹) and retire them for certificates.',
      icon: ShoppingCart,
      iconColor: 'text-[#DB2777]',
      bgBadge: 'bg-[#FCE7F3]',
      btnClass: 'pop-btn-pink',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border-2 border-[#1E293B] shadow-pop-lg overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-[#E2E8F0]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] border-2 border-[#1E293B] flex items-center justify-center text-[#8B5CF6] shadow-pop-xs">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-[#1E293B]">Enter ZeroTrace Workspace</h2>
              <p className="text-xs text-[#64748B] font-medium">Select an organization role to launch into your dashboard.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] transition"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
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
                className="p-4 rounded-2xl border-2 border-[#1E293B] bg-white hover:bg-[#FFFDF5] cursor-pointer transition-all duration-150 flex items-center justify-between group shadow-pop-xs hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-pop"
              >
                <div className="flex items-start space-x-3.5 pr-3">
                  <div className={`w-11 h-11 rounded-2xl border-2 border-[#1E293B] flex-shrink-0 flex items-center justify-center ${role.bgBadge} ${role.iconColor} shadow-pop-xs`}>
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-black text-sm text-[#1E293B]">{role.title}</h3>
                      <span className="text-[10px] text-[#64748B] font-mono">({role.name.split('(')[0].trim()})</span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-snug font-medium">{role.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-xl bg-[#1E293B] text-white group-hover:bg-[#8B5CF6] transition-colors flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom Wallet Connect Option */}
        <div className="pt-3 border-t-2 border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#64748B] font-medium">Need to connect a custom Web3 address?</span>
          <button
            type="button"
            onClick={handleBrowserConnect}
            disabled={isConnecting}
            className="pop-btn-secondary px-4 py-2 text-xs flex items-center space-x-2 w-full sm:w-auto justify-center font-display font-bold"
          >
            <Wallet className="w-4 h-4 text-[#8B5CF6] stroke-[2.5]" />
            <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
