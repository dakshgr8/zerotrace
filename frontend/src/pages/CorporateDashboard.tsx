import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { web3Service } from '../services/web3';
import { Project, Claim, Retirement, TelemetryDataPoint } from '../types';
import { TelemetryComparisonChart } from '../components/Charts';
import { CertificateModal } from '../components/CertificateModal';
import { IPFSModal } from '../components/IPFSModal';
import { 
  Sun, 
  UploadCloud, 
  Coins, 
  Loader2, 
  Database, 
  ArrowUpRight, 
  Zap, 
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  IndianRupee
} from 'lucide-react';

interface CorporateDashboardProps {
  onNavigateToAuditor?: () => void;
}

export const CorporateDashboard: React.FC<CorporateDashboardProps> = ({ onNavigateToAuditor }) => {
  const { walletAddress, ztcBalance, inrBalance, activeAccount, refreshBalances, addNotification } = useWeb3();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Fields
  const [generationMWh, setGenerationMWh] = useState<string>('850');
  const [gridExportMWh, setGridExportMWh] = useState<string>('828');
  const [vintageYear, setVintageYear] = useState<number>(2026);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [mintingClaimId, setMintingClaimId] = useState<number | null>(null);

  // Burn / Offset State
  const [burnAmount, setBurnAmount] = useState<string>('10');
  const [beneficiary, setBeneficiary] = useState<string>('Tata Power Renewable Energy Ltd');
  const [isBurning, setIsBurning] = useState<boolean>(false);

  // Modals
  const [selectedRetirement, setSelectedRetirement] = useState<Retirement | null>(null);
  const [selectedIPFSCid, setSelectedIPFSCid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, claimData, retData] = await Promise.all([
        api.getProjects(),
        api.getAllClaims(walletAddress),
        api.getRetirements(),
      ]);
      setProjects(projData);
      if (projData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData[0].id);
      }
      setClaims(claimData);
      setRetirements(retData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [walletAddress]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // 24-hour solar diurnal generation curve (sunrise ~6 AM, peak solar noon 12 PM, sunset ~6 PM)
  const computeTelemetryPoints = (): TelemetryDataPoint[] => {
    const now = new Date();
    const points: TelemetryDataPoint[] = [];
    const totalGen = parseFloat(generationMWh) || 850;
    const totalGrid = parseFloat(gridExportMWh) || totalGen * 0.975;

    let dayFactorSum = 0;
    const hourlyFactors: number[] = [];

    for (let h = 0; h < 24; h++) {
      const factor = h >= 6 && h <= 18 ? Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) : 0;
      hourlyFactors.push(factor);
      dayFactorSum += factor;
    }

    for (let h = 0; h < 24; h++) {
      const timeStr = new Date(now.getTime() - (24 - h) * 3600 * 1000).toISOString();
      const fraction = dayFactorSum > 0 ? hourlyFactors[h] / dayFactorSum : 0;
      const hourlyGen = totalGen * fraction;
      const hourlyGrid = totalGrid * fraction;
      const ghi = h >= 6 && h <= 18 ? hourlyFactors[h] * 950 : 0;

      points.push({
        timestamp: timeStr,
        scada_active_power_mw: parseFloat(hourlyGen.toFixed(2)),
        inverter_efficiency_pct: 98.4,
        global_horizontal_irradiance: parseFloat(ghi.toFixed(1)),
        grid_export_power_mw: parseFloat(hourlyGrid.toFixed(2)),
        ambient_temp_c: 30.0,
        cell_temp_c: 45.0,
        wind_speed_ms: 0.0,
      });
    }
    return points;
  };

  const handleIngestTelemetry = async () => {
    try {
      setIngesting(true);
      const points = computeTelemetryPoints();
      const satelliteAvg = 440.0;

      await api.ingestTelemetry({
        project_id: selectedProjectId,
        corporate_wallet: walletAddress,
        period_start: points[0].timestamp,
        period_end: points[points.length - 1].timestamp,
        vintage_year: vintageYear,
        data_points: points,
        satellite_irradiance_avg: satelliteAvg,
      });

      addNotification(
        'success',
        'Generation Submitted',
        'Solar generation telemetry dispatched to Auditor queue for verification.'
      );

      await loadData();
    } catch (err: any) {
      addNotification('error', 'Submission Failed', err.message || 'Error submitting energy batch');
    } finally {
      setIngesting(false);
    }
  };

  const handleMintClaim = async (claim: Claim) => {
    if (!claim.oracle_signature || !claim.claim_digest) {
      addNotification('error', 'Signature Missing', 'Auditor must approve the claim first.');
      return;
    }

    try {
      setMintingClaimId(claim.id);
      addNotification('info', 'Minting Credits', 'Minting verified carbon tokens to your wallet on-chain...');

      const result = await web3Service.mintWithVerification(
        claim.corporate_wallet,
        claim.co2_offset_tonnes,
        claim.claim_digest,
        claim.oracle_signature,
        activeAccount.privateKey
      );

      await api.confirmMint(claim.id, result.txHash);
      await refreshBalances();
      await loadData();

      addNotification('success', 'Minted!', `Received ${claim.co2_offset_tonnes.toFixed(2)} ZTC tokens.`);
    } catch (err: any) {
      addNotification('error', 'Mint Error', err.reason || err.message || 'Failed to mint tokens');
    } finally {
      setMintingClaimId(null);
    }
  };

  const handleBurnForOffset = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(burnAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > parseFloat(ztcBalance)) {
      addNotification('error', 'Invalid Amount', 'Please check available balance.');
      return;
    }

    try {
      setIsBurning(true);
      addNotification('info', 'Retiring Credits', 'Permanently neutralizing carbon units on blockchain...');

      const result = await web3Service.burnForOffset(
        amountNum,
        beneficiary,
        'Clean Solar Energy Offset',
        activeAccount.privateKey
      );

      const ret = await api.recordRetirement({
        certificate_id: result.certificateId,
        burner_wallet: walletAddress,
        corporate_beneficiary: beneficiary,
        reason: 'Clean Solar Energy Offset',
        amount_tonnes: amountNum,
        tx_hash: result.txHash,
        block_number: result.blockNumber,
      });

      await refreshBalances();
      await loadData();
      addNotification('success', 'Offset Neutralized!', `Retired ${amountNum} ZTC. Certificate generated!`);
      setSelectedRetirement(ret);
    } catch (err: any) {
      addNotification('error', 'Retirement Failed', err.reason || err.message || 'Failed to retire');
    } finally {
      setIsBurning(false);
    }
  };

  const previewPoints = computeTelemetryPoints();

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      
      {/* 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="trust-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Credits</span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display font-extrabold text-3xl text-indigo-600 font-mono">{ztcBalance}</span>
              <span className="text-xs font-bold text-slate-900">ZTC</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">1 ZTC = 1 Ton CO₂ Offset</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="trust-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Treasury</span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="font-display font-extrabold text-2xl text-slate-900 font-mono">{inrBalance}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Operational Settlement Balance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="trust-card p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Generation</span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display font-extrabold text-3xl text-emerald-600 font-mono">
                {claims.reduce((acc, c) => acc + (c.status === 'MINTED' || c.status === 'APPROVED' ? c.validated_mwh : 0), 0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-900">MWh</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Substation Meter Verified</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Step 1: Submit Energy Generation */}
      <div className="trust-card p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base text-slate-900">Step 1: Submit Solar PV Generation</h2>
              <p className="text-xs text-slate-500">Record plant inverter output and grid substation meter reading</p>
            </div>
          </div>
        </div>

        {/* Plant Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">Select Solar Asset</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-3.5 rounded-xl text-left text-xs transition-all border ${
                  selectedProjectId === p.id
                    ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="font-bold truncate">{p.name.split('(')[0]}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1">{p.peak_capacity_mw} MW &bull; {p.location.split(',')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Active Output (MWh)</label>
            <input
              type="number"
              step="10"
              value={generationMWh}
              onChange={(e) => {
                const val = e.target.value;
                setGenerationMWh(val);
                const num = parseFloat(val);
                if (!isNaN(num)) {
                  setGridExportMWh((num * 0.975).toFixed(1));
                }
              }}
              className="w-full trust-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Grid Export Meter (MWh)</label>
            <input
              type="number"
              step="10"
              value={gridExportMWh}
              onChange={(e) => setGridExportMWh(e.target.value)}
              className="w-full trust-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Vintage Year</label>
            <input
              type="number"
              value={vintageYear}
              onChange={(e) => setVintageYear(parseInt(e.target.value) || 2026)}
              className="w-full trust-input font-mono"
              required
            />
          </div>
        </div>

        {/* Live Diurnal Solar Curve Preview */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-700">
              24-Hour Diurnal Solar Distribution (Live Model Preview)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Indigo: Plant Inverters | Emerald: Substation Meter</span>
          </div>
          <TelemetryComparisonChart dataPoints={previewPoints} height={180} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleIngestTelemetry}
            disabled={ingesting}
            className="trust-btn-primary px-8 py-3.5 text-xs flex items-center space-x-2"
          >
            {ingesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Generation...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Submit Generation for Auditor Approval</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Approved Claims & Minting */}
      <div className="trust-card p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-900">Step 2: Approved Claims & Minting</h2>
            <p className="text-xs text-slate-500">When an auditor approves your batch, click "Mint" to receive tokens.</p>
          </div>
          <button onClick={loadData} className="trust-btn-secondary px-4 py-2 text-xs">
            Refresh
          </button>
        </div>

        {claims.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No submitted claims yet. Use Step 1 above to submit.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{claim.claim_uid}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      claim.status === 'MINTED' ? 'trust-badge-emerald' : claim.status === 'APPROVED' ? 'trust-badge-indigo' : claim.status === 'REJECTED' ? 'trust-badge-rose' : 'trust-badge-amber'
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {claim.project_name} &bull; {claim.requested_mwh.toFixed(1)} MWh &bull; <strong className="text-emerald-600 font-mono">{claim.co2_offset_tonnes.toFixed(2)} ZTC</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {claim.status === 'APPROVED' && (
                    <button
                      onClick={() => handleMintClaim(claim)}
                      disabled={mintingClaimId === claim.id}
                      className="trust-btn-primary px-5 py-2 text-xs flex items-center space-x-1.5 shadow-sm"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Mint Tokens to Wallet</span>
                    </button>
                  )}

                  {claim.status === 'PENDING_REVIEW' && (
                    <span className="text-xs text-amber-600 font-medium flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Waiting for Auditor</span>
                    </span>
                  )}

                  {claim.ipfs_cid && (
                    <button
                      onClick={() => setSelectedIPFSCid(claim.ipfs_cid!)}
                      className="trust-btn-secondary p-2 text-indigo-600"
                      title="View IPFS Audit Document"
                    >
                      <Database className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Retire Credits */}
      <div className="trust-card p-8 space-y-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-base text-slate-900">Retire Carbon Credits</h2>
            <p className="text-xs text-slate-500">Permanently burn credits on blockchain to claim official clean energy offset.</p>
          </div>
        </div>

        <form onSubmit={handleBurnForOffset} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Credits to Retire (ZTC)</label>
            <input
              type="number"
              min="1"
              max={parseFloat(ztcBalance) || 1000}
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              className="w-full trust-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Beneficiary Name</label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className="w-full trust-input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBurning || parseFloat(ztcBalance) <= 0}
            className="trust-btn-secondary py-3 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-center space-x-1.5"
          >
            <Flame className="w-4 h-4" />
            <span>Retire & Get Certificate</span>
          </button>
        </form>
      </div>

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
