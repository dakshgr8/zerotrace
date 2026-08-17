import React from 'react';
import { 
  Sun, 
  ShieldCheck, 
  Coins, 
  ArrowRight, 
  Sparkles,
  Check
} from 'lucide-react';
import { CarbonAtomCanvas } from '../components/CarbonAtomCanvas';

interface LandingPageProps {
  onSelectRole: (tab: string, accountIndex: number) => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole, onOpenLogin }) => {
  const roles = [
    {
      id: 'producer',
      tab: 'corporate',
      accountIndex: 0,
      title: 'Solar Power Producer',
      organization: 'Tata Power Renewable Energy Ltd',
      icon: Sun,
      iconColor: 'text-[#B45309]',
      cardClass: 'pop-card-yellow',
      iconBg: 'bg-[#FEF3C7] border-2 border-[#1E293B]',
      btnClass: 'pop-btn-yellow',
      badge: 'Role 1: Minting',
      badgeClass: 'pop-badge-yellow',
      description: 'Upload solar plant generation telemetry, reconcile substation export meters, and mint verified on-chain ZTC carbon tokens directly to wallet.',
      features: [
        'Multi-plant telemetry ingestion',
        'Substation grid meter 2.5% loss reconciliation',
        '1-Click zero-cost token minting'
      ]
    },
    {
      id: 'auditor',
      tab: 'verifier',
      accountIndex: 1,
      title: 'Independent Auditor',
      organization: 'Bureau Veritas Sustainability',
      icon: ShieldCheck,
      iconColor: 'text-[#047857]',
      cardClass: 'pop-card-mint',
      iconBg: 'bg-[#D1FAE5] border-2 border-[#1E293B]',
      btnClass: 'pop-btn-mint',
      badge: 'Role 2: Verification',
      badgeClass: 'pop-badge-mint',
      description: 'Inspect plant SCADA curves against substation export meters, evaluate automated AI multi-sensor checks, and issue cryptographic EIP-712 signatures.',
      features: [
        'Diurnal clear-sky solar model verification',
        'Substation grid export meter sanity checks',
        'Automated IPFS W3C JSON-LD audit reports'
      ]
    },
    {
      id: 'buyer',
      tab: 'buyer',
      accountIndex: 2,
      title: 'Corporate Carbon Buyer',
      organization: 'Corporate ESG Sustainability Treasury',
      icon: Coins,
      iconColor: 'text-[#DB2777]',
      cardClass: 'pop-card-pink',
      iconBg: 'bg-[#FCE7F3] border-2 border-[#1E293B]',
      btnClass: 'pop-btn-pink',
      badge: 'Role 3: Trade & Retire',
      badgeClass: 'pop-badge-pink',
      description: 'Acquire verified solar carbon credits with instant Indian Rupee (₹) non-custodial settlement and permanently burn credits for official offset certificates.',
      features: [
        'Instant peer-to-peer INR order book settlement',
        'Permanent on-chain carbon retirement',
        'Official single-page cryptographic certificates'
      ]
    },
  ];

  return (
    <>
      {/* Floating Interactive Carbon Atoms Background */}
      <CarbonAtomCanvas />

      <div className="animate-pop-in max-w-6xl mx-auto relative z-10">
        
        {/* ========================================================================= */}
        {/* PAGE 1: First Viewport - Big, Bold, Left-Aligned Headline & Canvas        */}
        {/* ========================================================================= */}
        <section className="min-h-[calc(100vh-8rem)] flex flex-col justify-center relative py-12">
          
          {/* Decorative Background Shapes */}
          <div className="absolute top-10 -left-12 w-32 h-32 rounded-full bg-[#FBBF24]/20 pointer-events-none -z-10 animate-float-slow" />
          <div className="absolute top-36 right-10 w-28 h-28 rounded-2xl rotate-12 bg-[#F472B6]/15 pointer-events-none -z-10" />

          <div className="max-w-3xl space-y-6 text-left">
            {/* Big, High-Impact Left-Aligned Headline */}
            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-8xl text-[#1E293B] tracking-tight leading-[1.05]">
              Solar Carbon Credits, <br />
              <span className="text-[#8B5CF6]">Independently Verified.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-[#64748B] font-medium leading-relaxed max-w-xl pt-2">
              Autonomous multi-sensor verification for solar plants with cryptographic oracle signatures and instant <strong>INR (₹)</strong> trading.
            </p>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* PAGE 2: Select Your Workspace                                             */}
        {/* ========================================================================= */}
        <section id="workspaces-section" className="min-h-[85vh] flex flex-col justify-center py-20 space-y-8">
          
          <div className="px-1 text-left">
            <h2 className="font-display font-black text-3xl sm:text-4xl text-[#1E293B]">Select Your Workspace</h2>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-1">Explore each stakeholder persona in the decarbonization lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {roles.map((role) => {
              const Icon = role.icon;

              return (
                <div
                  key={role.id}
                  className={`${role.cardClass} p-7 flex flex-col justify-between space-y-5 relative overflow-hidden group hover:scale-[1.01]`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.iconBg} shadow-pop-xs transition-transform group-hover:rotate-6`}>
                        <Icon className={`w-6 h-6 ${role.iconColor} stroke-[2.5]`} />
                      </div>
                      <span className={role.badgeClass}>
                        {role.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-black text-lg text-[#1E293B]">{role.title}</h3>
                      <p className="text-xs text-[#64748B] font-bold mt-0.5">{role.organization}</p>
                    </div>

                    <p className="text-xs text-[#475569] leading-relaxed font-medium">
                      {role.description}
                    </p>

                    <div className="space-y-1.5 pt-2.5 border-t-2 border-[#E2E8F0]">
                      {role.features.map((feat, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs text-[#1E293B] font-medium">
                          <div className="w-4 h-4 rounded-full bg-[#D1FAE5] border border-[#1E293B] flex items-center justify-center text-[#047857] flex-shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="text-[11px]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectRole(role.tab, role.accountIndex)}
                    className={`w-full py-3 text-xs font-display font-black flex items-center justify-center space-x-2 ${role.btnClass}`}
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              );
            })}
          </div>

        </section>

      </div>
    </>
  );
};
