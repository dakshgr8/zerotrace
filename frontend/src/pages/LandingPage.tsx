import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlatformStats } from '../types';
import { 
  Leaf, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Check, 
  Globe,
  Lock,
  BarChart3,
  Award,
  ArrowUpRight,
  LogIn
} from 'lucide-react';

interface LandingPageProps {
  onSelectRole: (tab: string, accountIndex: number) => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, onOpenLogin }) => {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.getStats().then((data) => setStats(data)).catch((err) => console.error(err));
  }, []);

  const roles = [
    {
      id: 'producer',
      tab: 'corporate',
      accountIndex: 0,
      title: 'Energy Producer',
      subtitle: 'Tata Power & Clean Generators',
      icon: Leaf,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      btnClass: 'trust-btn-primary',
      description: 'Submit solar PV generation telemetry, cross-check AI diurnal baseline models, and mint verified on-chain carbon credits.',
      badge: 'Role 1: Mint',
    },
    {
      id: 'auditor',
      tab: 'verifier',
      accountIndex: 1,
      title: 'Auditor & Verifier',
      subtitle: 'Bureau Veritas & Accredited Verifiers',
      icon: ShieldCheck,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      btnClass: 'trust-btn-emerald',
      description: 'Inspect plant SCADA vs. substation grid export meters, evaluate AI fraud checks, and issue ECDSA digital signatures.',
      badge: 'Role 2: Verify',
    },
    {
      id: 'buyer',
      tab: 'buyer',
      accountIndex: 2,
      title: 'Carbon Credit Buyer',
      subtitle: 'Corporate ESG & Sustainability Funds',
      icon: Coins,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      btnClass: 'trust-btn-secondary',
      description: 'Purchase verified carbon credits directly in Indian Rupees (₹) and retire them for official cryptographic certificates.',
      badge: 'Role 3: Trade & Retire',
    },
  ];

  return (
    <div className="space-y-20 animate-fade-in py-6 max-w-6xl mx-auto relative">
      
      {/* Atmospheric Background Blur Orbs */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-emerald-200/20 blur-3xl -z-10 pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>AI-Verified Carbon Credits on Enterprise Blockchain</span>
        </div>

        {/* Split Gradient Headline */}
        <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-slate-900 tracking-tight leading-[1.15]">
          Turn Clean Energy into <br />
          <span className="gradient-text">Verified Carbon Credits</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
          ZeroTrace automatically evaluates utility & commercial solar PV power output against grid substation meters with AI. 
          Auditors approve in seconds, and enterprises settle directly in <strong>Indian Rupees (₹)</strong>.
        </p>

        {/* Quick CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onOpenLogin}
            className="trust-btn-primary px-7 py-3.5 text-sm flex items-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Choose Role</span>
          </button>
          
          <button
            onClick={() => onSelectRole('corporate', 0)}
            className="trust-btn-secondary px-6 py-3.5 text-sm flex items-center space-x-2"
          >
            <Leaf className="w-4 h-4 text-indigo-600" />
            <span>Quick Enter as Producer</span>
          </button>
        </div>
      </div>

      {/* 3 Elevated Role Portals (Clicking enters that workspace) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="font-display font-extrabold text-lg text-slate-900">Protected Workspaces by Role</h2>
            <p className="text-xs text-slate-500">Sign in to access your role-specific dashboard and actions.</p>
          </div>
          <button
            onClick={onOpenLogin}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
          >
            <span>View All Sign In Options</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                className="trust-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${role.iconBg} shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="bg-slate-100 text-slate-600 border border-slate-200/80 rounded-full px-3 py-1 text-[10px] font-bold">
                      {role.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-xl text-slate-900">{role.title}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{role.subtitle}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {role.description}
                  </p>
                </div>

                <button
                  onClick={() => onSelectRole(role.tab, role.accountIndex)}
                  className={`w-full py-3 px-4 text-xs font-semibold flex items-center justify-center space-x-2 ${role.btnClass}`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Login as {role.title.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Statistics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="trust-card p-6 space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Verified Clean Energy</span>
            <p className="font-display font-extrabold text-3xl text-emerald-600 font-mono">
              {stats.total_validated_mwh.toLocaleString()} <span className="text-sm font-sans font-semibold text-slate-500">MWh</span>
            </p>
            <p className="text-[11px] text-slate-400">Substation Meter Confirmed</p>
          </div>

          <div className="trust-card p-6 space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Carbon Credits Minted</span>
            <p className="font-display font-extrabold text-3xl text-indigo-600 font-mono">
              {stats.total_carbon_credits_minted_ztc.toLocaleString()} <span className="text-sm font-sans font-semibold text-slate-500">ZTC</span>
            </p>
            <p className="text-[11px] text-slate-400">1 ZTC = 1 Ton CO₂ Offset</p>
          </div>

          <div className="trust-card p-6 space-y-1">
            <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Permanently Retired</span>
            <p className="font-display font-extrabold text-3xl text-slate-900 font-mono">
              {stats.total_retired_offset_tonnes.toLocaleString()} <span className="text-sm font-sans font-semibold text-slate-500">Tons</span>
            </p>
            <p className="text-[11px] text-slate-400">Official Certificates Issued</p>
          </div>
        </div>
      )}

      {/* How It Works (Clean 3-Step Process) */}
      <div className="trust-card p-10 space-y-8">
        <div className="text-center space-y-1">
          <h2 className="font-display font-extrabold text-2xl text-slate-900">
            How ZeroTrace Works
          </h2>
          <p className="text-xs text-slate-500 font-medium">Autonomous multi-sensor verification from generation to tokenization</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Submit Generation</h3>
            <p className="text-slate-600 leading-relaxed">
              Renewable plant operators enter active generation or upload SCADA CSV files. AI cross-checks physical baseline models.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">1-Click AI Verification</h3>
            <p className="text-slate-600 leading-relaxed">
              Auditors review multi-sensor anomaly reports and issue cryptographic ECDSA authorization signatures.
            </p>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900">Mint, Trade in INR & Retire</h3>
            <p className="text-slate-600 leading-relaxed">
              Tokens are minted to the producer's wallet, listed in the Indian Rupee marketplace, and retired for certificates.
            </p>
          </div>
        </div>
      </div>

      {/* Dramatic Dark Section CTA */}
      <div className="gradient-dark-section rounded-3xl p-10 sm:p-12 text-center space-y-6">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
          Ready to verify your clean energy generation?
        </h2>
        <p className="text-sm text-indigo-200 max-w-xl mx-auto font-normal">
          Experience enterprise-grade blockchain transparency with zero setup hassle and instant verification.
        </p>
        <div>
          <button
            onClick={onOpenLogin}
            className="bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-slate-50 hover:scale-105 transition-all text-xs"
          >
            Sign In to Platform Workspace
          </button>
        </div>
      </div>

    </div>
  );
};
