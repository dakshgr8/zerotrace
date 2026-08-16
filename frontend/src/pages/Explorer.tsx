import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Project, Claim, Retirement } from '../types';
import { CertificateModal } from '../components/CertificateModal';
import { IPFSModal } from '../components/IPFSModal';
import { 
  Layers, 
  ShieldCheck, 
  Database, 
  FileText, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Sun, 
  Zap, 
  Flame, 
  Award,
  Globe,
  MapPin
} from 'lucide-react';

export const Explorer: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'PROJECTS' | 'CLAIMS' | 'RETIREMENTS'>('PROJECTS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [selectedRetirement, setSelectedRetirement] = useState<Retirement | null>(null);
  const [selectedIPFSCid, setSelectedIPFSCid] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getProjects(),
      api.getAllClaims(),
      api.getRetirements(),
    ])
      .then(([projData, claimData, retData]) => {
        setProjects(projData);
        setClaims(claimData);
        setRetirements(retData);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.project_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClaims = claims.filter((c) =>
    c.claim_uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.project_name && c.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.corporate_wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRetirements = retirements.filter((r) =>
    r.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.corporate_beneficiary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.burner_wallet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <div className="trust-card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl text-slate-900">Public Transparency & Audit Registry</h1>
              <p className="text-xs text-slate-500">
                Verifiable on-chain carbon registry &bull; Cryptographic IPFS audit documents &bull; Permanent offset receipts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtabs and Search */}
      <div className="trust-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveSubTab('PROJECTS')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'PROJECTS' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registered Assets ({projects.length})
          </button>

          <button
            onClick={() => setActiveSubTab('CLAIMS')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'CLAIMS' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claims Ledger ({claims.length})
          </button>

          <button
            onClick={() => setActiveSubTab('RETIREMENTS')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'RETIREMENTS' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Retirements ({retirements.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full trust-input pl-10 text-xs"
          />
        </div>

      </div>

      {/* Tab 1: Registered Projects Portfolio */}
      {activeSubTab === 'PROJECTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((proj) => {
            const isSolar = proj.project_type.toLowerCase().includes('solar');

            return (
              <div
                key={proj.id}
                className="trust-card-hover p-8 flex flex-col justify-between space-y-5 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100">
                      <Sun className="w-5 h-5" />
                    </div>
                    <span className="trust-badge-emerald px-2.5 py-0.5 text-[10px]">
                      Verified Asset
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-extrabold text-base text-slate-900">{proj.name}</h3>
                    <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{proj.location}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Capacity</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">{proj.peak_capacity_mw} MW</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Type</span>
                      <p className="font-mono font-bold text-indigo-600 mt-0.5">{proj.project_type}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Code: {proj.project_code}</span>
                  <span className="text-emerald-600 font-bold">Factor: 0.716 tCO₂/MWh</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Claims Ledger */}
      {activeSubTab === 'CLAIMS' && (
        <div className="trust-card p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Claim UID</th>
                  <th className="py-3 px-3">Plant</th>
                  <th className="py-3 px-3">Producer Wallet</th>
                  <th className="py-3 px-3">Validated MWh</th>
                  <th className="py-3 px-3">Credits (ZTC)</th>
                  <th className="py-3 px-3">Risk</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Audit Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No claims recorded in ledger yet.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{claim.claim_uid}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{claim.project_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {claim.corporate_wallet.slice(0, 6)}...{claim.corporate_wallet.slice(-4)}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900">{claim.validated_mwh.toFixed(1)} MWh</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                        {claim.co2_offset_tonnes.toFixed(2)} ZTC
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          claim.risk_score < 25 ? 'trust-badge-emerald' : claim.risk_score < 60 ? 'trust-badge-amber' : 'trust-badge-rose'
                        }`}>
                          {claim.risk_score.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="trust-badge-indigo px-2.5 py-0.5 text-[10px] uppercase font-bold">
                          {claim.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {claim.ipfs_cid && (
                          <button
                            onClick={() => setSelectedIPFSCid(claim.ipfs_cid!)}
                            className="trust-btn-secondary p-1.5 text-xs text-indigo-600"
                            title="View IPFS Document"
                          >
                            <Database className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permanent Offset Retirements */}
      {activeSubTab === 'RETIREMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRetirements.length === 0 ? (
            <div className="col-span-full trust-card p-12 text-center text-slate-400 text-xs">
              No permanent offset retirements recorded yet.
            </div>
          ) : (
            filteredRetirements.map((ret) => (
              <div
                key={ret.certificate_id}
                onClick={() => setSelectedRetirement(ret)}
                className="trust-card-hover p-6 cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                      {ret.corporate_beneficiary}
                    </span>
                    <span className="trust-badge-emerald px-2 py-0.5 text-[9px]">
                      Retired
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{ret.reason || 'Clean Energy Offset'}</p>
                  <p className="text-[10px] font-mono text-slate-400">ID: {ret.certificate_id.slice(0, 18)}...</p>
                </div>

                <div className="text-right">
                  <span className="font-display font-extrabold text-xl text-emerald-600 font-mono">
                    {ret.amount_tonnes.toFixed(1)} <span className="text-xs font-sans">Tons</span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {new Date(ret.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <CertificateModal
        retirement={selectedRetirement}
        onClose={() => setSelectedRetirement(null)}
      />

      <IPFSModal
        cid={selectedIPFSCid}
        onClose={() => setSelectedIPFSCid(null)}
      />

    </div>
  );
};
