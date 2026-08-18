import React from 'react';
import { 
  Sparkles, 
  Leaf, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Zap,
  Award
} from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

interface WalkthroughGuideProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDismiss: () => void;
}

export const WalkthroughGuide: React.FC<WalkthroughGuideProps> = ({ activeTab, setActiveTab, onDismiss }) => {
  const { switchAccount } = useWeb3();

  const steps = [
    {
      num: '1',
      title: 'Submit Clean Energy',
      role: 'Energy Producer',
      tab: 'corporate',
      accountIndex: 0, // Tata Power Corporate
      icon: Leaf,
      color: 'emerald',
      description: 'Upload solar PV generation telemetry. Instant AI check verifies pyranometer irradiance, diurnal models, and flags phantom nighttime claims.',
      actionLabel: 'Go to Producer Portal',
    },
    {
      num: '2',
      title: 'Auditor Approval',
      role: 'Government Auditor',
      tab: 'verifier',
      accountIndex: 1, // Bureau Veritas Verifier
      icon: ShieldCheck,
      color: 'cyan',
      description: 'Auditor inspects generation curves vs. grid meter and clicks "Approve" to issue a zero-gas digital signature.',
      actionLabel: 'Go to Auditor Hub',
    },
    {
      num: '3',
      title: 'Mint, Trade or Retire',
      role: 'Corporate & Buyer',
      tab: 'corporate',
      accountIndex: 0,
      icon: Award,
      color: 'amber',
      description: 'Producer mints 1 ZTC per ton of CO₂ saved into their wallet. Trade on Marketplace or burn for an official certificate.',
      actionLabel: 'Mint & Trade Credits',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-5 shadow-2xl animate-fade-in mb-8">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Quick Guide: How ZeroTrace Works in 3 Simple Steps</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-normal border border-emerald-500/20">
                Interactive Tour
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isCurrentTab = activeTab === s.tab;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                isCurrentTab
                  ? 'bg-slate-950/80 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-bold font-mono flex items-center justify-center">
                    {s.num}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">
                    {s.role}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">{s.title}</h4>
                </div>

                <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => {
                  switchAccount(s.accountIndex);
                  setActiveTab(s.tab);
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-slate-700 text-[11px] font-semibold transition flex items-center justify-center space-x-1.5"
              >
                <span>{s.actionLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
