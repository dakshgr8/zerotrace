import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PlatformStats } from '../types';
import { 
  Sun, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Globe,
  Lock,
  BarChart3,
  Award,
  ArrowUpRight,
  LogIn,
  Layers,
  FileCheck,
  IndianRupee,
  Check
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
      organization: 'Tata Power Renewable Energy',
      icon: Sun,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 border-amber-200/80',
      btnClass: 'trust-btn-primary',
      badge: 'Role 1: Mint',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      description: 'Record Solar PV generation output, monitor clear-sky diurnal models, and mint verified on-chain ZTC carbon credits.',
      features: [
        'Multi-plant telemetry ingestion',
        'Substation grid meter reconciliation',
        'Direct 1-click token minting to wallet'
      ]
    },
    {
      id: 'auditor',
      tab: 'verifier',
      accountIndex: 1,
      title: 'Independent Auditor',
      organization: 'Bureau Veritas Compliance',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      btnClass: 'trust-btn-emerald',
      badge: 'Role 2: Verify',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Inspect plant SCADA generation against substation grid export meters, review AI sanity checks, and issue cryptographic signatures.',
      features: [
        'Diurnal solar physics cross-checking',
        'Substation meter anomaly alerts',
        'Automated IPFS JSON-LD report issuance'
      ]
    },
    {
      id: 'buyer',
      tab: 'buyer',
      accountIndex: 2,
      title: 'Corporate Carbon Buyer',
      organization: 'ESG Sustainability Treasury',
      icon: Coins,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200/80',
      btnClass: 'trust-btn-secondary',
      badge: 'Role 3: Trade & Retire',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Acquire verified solar carbon credits directly with Indian Rupee (₹) settlement and permanently burn credits for official offset certificates.',
      features: [
        'Instant peer-to-peer INR settlement',
        'Permanent on-chain credit retirement',
        'Downloadable cryptographic certificates'
      ]
    },
  ];

  const solarParks = [
    { name: 'Bhadla Solar Phase IV', capacity: '500 MW', location: 'Rajasthan, India', factor: '0.716 tCO₂/MWh', active: true },
    { name: 'Rewa Ultra Mega Solar', capacity: '250 MW', location: 'Madhya Pradesh, India', factor: '0.716 tCO₂/MWh', active: true },
    { name: 'Pavagada Solar Park', capacity: '300 MW', location: 'Karnataka, India', factor: '0.716 tCO₂/MWh', active: true },
  ];

  return (
    <div className="space-y-24 animate-fade-in py-6 max-w-6xl mx-auto relative">
      
      {/* Background Decorative Glow Orbs */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-200/30 via-amber-100/20 to-emerald-100/30 blur-3xl -z-10 pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center space-y-7 max-w-3xl mx-auto pt-4">
        
        {/* Top Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-sm backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-900">ZeroTrace Platform</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">AI-MRV Solar Carbon Tokenization</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-black text-4xl sm:text-6xl text-slate-950 tracking-tight leading-[1.12]">
          Turn Solar Energy into <br />
          <span className="gradient-text">Verified Carbon Credits</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
          Automated multi-sensor evaluation for solar power output against substation grid meters. 
          Auditors approve in seconds, and enterprises settle directly in <strong>Indian Rupees (₹)</strong>.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <button
            onClick={onOpenLogin}
            className="trust-btn-primary px-8 py-3.5 text-sm flex items-center space-x-2 shadow-primary-btn"
          >
            <LogIn className="w-4 h-4" />
            <span>Launch Platform & Choose Role</span>
          </button>
          
          <button
            onClick={() => onSelectRole('corporate', 0)}
            className="trust-btn-secondary px-7 py-3.5 text-sm flex items-center space-x-2"
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Quick Enter as Producer</span>
          </button>
        </div>
      </div>

      {/* 3 Role Portal Cards */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-slate-950">Select Your Workspace</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter one of the 3 dedicated operational roles below.</p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 self-start sm:self-auto">
            Interactive Prototype Environment
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;

            return (
              <div
                key={role.id}
                className="trust-card-hover p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${role.iconBg} shadow-sm transition-transform group-hover:scale-105`}>
                      <Icon className={`w-6 h-6 ${role.iconColor}`} />
                    </div>
                    <span className={`border rounded-full px-3 py-0.5 text-[10px] font-bold ${role.badgeClass}`}>
                      {role.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-900">{role.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{role.organization}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {role.features.map((feat, i) => (
                      <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onSelectRole(role.tab, role.accountIndex)}
                  className={`w-full py-3 text-xs font-bold flex items-center justify-center space-x-2 ${role.btnClass}`}
                >
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Process Flow (How it Works) */}
      <div className="trust-card p-10 space-y-8 bg-gradient-to-b from-white to-slate-50/50">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">End-to-End Architecture</span>
          <h2 className="font-display font-extrabold text-2xl text-slate-950">How ZeroTrace Converts Clean MWh into Carbon Credits</h2>
          <p className="text-xs text-slate-500">From solar plant pyranometers to blockchain settlement in 4 automated steps.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-extrabold text-xs font-mono">
              01
            </div>
            <h4 className="font-display font-bold text-sm text-slate-900">Solar Telemetry Ingestion</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inverter output and grid substation meter readings are uploaded and parsed into hourly generation blocks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-xs font-mono">
              02
            </div>
            <h4 className="font-display font-bold text-sm text-slate-900">AI Diurnal Physics Validation</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-sensor machine learning checks bell curves, pyranometer irradiance, and grid loss ratios (97.5% baseline).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-extrabold text-xs font-mono">
              03
            </div>
            <h4 className="font-display font-bold text-sm text-slate-900">Auditor Cryptographic Approval</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Auditor reviews anomalies and issues W3C JSON-LD IPFS reports with EIP-712 digital authorization signatures.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center font-extrabold text-xs font-mono">
              04
            </div>
            <h4 className="font-display font-bold text-sm text-slate-900">Instant Mint & ₹ Settlement</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Producers mint ZTC tokens to their wallet, list on the marketplace, or corporates retire for official certificates.
            </p>
          </div>

        </div>
      </div>

      {/* Verified Solar Assets Catalog Preview */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-slate-950">Active Solar Asset Registry</h2>
            <p className="text-xs text-slate-500 mt-0.5">100% verified utility solar parks monitored on the network.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {solarParks.map((park, i) => (
            <div key={i} className="trust-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="trust-badge-emerald px-2.5 py-0.5 text-[10px]">
                  Active Telemetry
                </span>
              </div>

              <div>
                <h4 className="font-display font-extrabold text-base text-slate-900">{park.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{park.location}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Capacity</span>
                  <span className="font-mono font-bold text-slate-900">{park.capacity}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">CEA Emission Factor</span>
                  <span className="font-mono font-bold text-emerald-600">{park.factor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
