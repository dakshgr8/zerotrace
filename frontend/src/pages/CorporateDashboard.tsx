import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { web3Service } from '../services/web3';
import { Project, Claim, TelemetryDataPoint } from '../types';
import { TelemetryComparisonChart } from '../components/Charts';
import { IPFSModal } from '../components/IPFSModal';
import { 
  Sun, 
  UploadCloud, 
  Coins, 
  Loader2, 
  Database, 
  ArrowUpRight, 
  Zap, 
  Clock,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export const CorporateDashboard: React.FC = () => {
  const { walletAddress, ztcBalance, inrBalance, activeAccount, refreshBalances, addNotification } = useWeb3();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form Fields
  const [generationMWh, setGenerationMWh] = useState<string>('850');
  const [gridExportMWh, setGridExportMWh] = useState<string>('828');
  const [vintageYear, setVintageYear] = useState<number>(2026);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [mintingClaimId, setMintingClaimId] = useState<number | null>(null);

  // IPFS Modal
  const [selectedIPFSCid, setSelectedIPFSCid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projData, claimData] = await Promise.all([
        api.getProjects(),
        api.getAllClaims(walletAddress),
      ]);
      setProjects(projData);
      if (projData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projData[0].id);
      }
      setClaims(claimData);
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
    try {
      setMintingClaimId(claim.id);
      addNotification('info', 'Minting Credits', 'Executing smart contract mint verification on-chain...');

      const result = await web3Service.mintWithVerification(
        claim.corporate_wallet,
        claim.co2_offset_tonnes,
        claim.claim_digest || '0x' + Array(64).fill('a').join(''),
        claim.oracle_signature || '0x' + Array(130).fill('b').join(''),
        activeAccount.privateKey
      );

      await api.confirmMint(claim.id, result.txHash);
      await refreshBalances();
      await loadData();

      addNotification(
        'success',
        'Carbon Tokens Minted!',
        `Received ${claim.co2_offset_tonnes.toFixed(2)} ZTC tokens in wallet on Block #${result.blockNumber}. Tx: ${result.txHash.slice(0, 8)}...${result.txHash.slice(-6)}`
      );
    } catch (err: any) {
      addNotification('error', 'Mint Error', err.reason || err.message || 'Failed to mint tokens');
    } finally {
      setMintingClaimId(null);
    }
  };

  const previewPoints = computeTelemetryPoints();

  return (
    <div className="space-y-10 animate-pop-in max-w-5xl mx-auto">
      
      {/* 3 Summary Pop Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="pop-card-violet p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-display font-black text-[#6D28D9] uppercase tracking-wider">Available Credits</span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display font-black text-4xl text-[#8B5CF6] font-mono">{ztcBalance}</span>
              <span className="text-xs font-display font-extrabold text-[#1E293B]">ZTC</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">1 ZTC = 1 Ton CO₂ Offset</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-[#EDE9FE] border-2 border-[#1E293B] flex items-center justify-center text-[#8B5CF6] shadow-pop-xs">
            <Coins className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        <div className="pop-card-yellow p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-display font-black text-[#B45309] uppercase tracking-wider">Corporate Treasury</span>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="font-display font-black text-3xl text-[#1E293B] font-mono">{inrBalance}</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Operational Settlement Balance</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-[#FEF3C7] border-2 border-[#1E293B] flex items-center justify-center text-[#B45309] shadow-pop-xs">
            <IndianRupee className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        <div className="pop-card-mint p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-display font-black text-[#047857] uppercase tracking-wider">Verified Generation</span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display font-black text-4xl text-[#059669] font-mono">
                {claims.reduce((acc, c) => acc + (c.status === 'MINTED' || c.status === 'APPROVED' ? c.validated_mwh : 0), 0).toFixed(1)}
              </span>
              <span className="text-xs font-display font-extrabold text-[#1E293B]">MWh</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">Substation Meter Verified</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-[#D1FAE5] border-2 border-[#1E293B] flex items-center justify-center text-[#059669] shadow-pop-xs">
            <Zap className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Step 1: Submit Energy Generation */}
      <div className="pop-card p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#E2E8F0] gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EDE9FE] border-2 border-[#1E293B] flex items-center justify-center text-[#8B5CF6] shadow-pop-xs">
              <UploadCloud className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#1E293B]">Step 1: Submit Solar PV Generation</h2>
              <p className="text-xs text-[#64748B] font-medium">Record plant inverter output and grid substation meter reading</p>
            </div>
          </div>
        </div>

        {/* Plant Selector */}
        <div>
          <label className="text-xs font-display font-black text-[#1E293B] block mb-2 uppercase tracking-wide">Select Solar Asset</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-4 rounded-2xl text-left text-xs transition-all border-2 ${
                  selectedProjectId === p.id
                    ? 'bg-[#FEF3C7] border-[#1E293B] text-[#1E293B] font-bold shadow-pop-xs translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white border-[#CBD5E1] text-[#1E293B] hover:border-[#1E293B]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-[#F59E0B] stroke-[2.5] flex-shrink-0" />
                  <p className="font-display font-black truncate">{p.name.split('(')[0]}</p>
                </div>
                <p className="text-[11px] text-[#64748B] font-mono mt-1">{p.peak_capacity_mw} MW &bull; {p.location.split(',')[0]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-display font-black text-[#1E293B] block mb-1">Active Output (MWh)</label>
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
              className="w-full pop-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-display font-black text-[#1E293B] block mb-1">Grid Export Meter (MWh)</label>
            <input
              type="number"
              step="10"
              value={gridExportMWh}
              onChange={(e) => setGridExportMWh(e.target.value)}
              className="w-full pop-input font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-display font-black text-[#1E293B] block mb-1">Vintage Year</label>
            <input
              type="number"
              value={vintageYear}
              onChange={(e) => setVintageYear(parseInt(e.target.value) || 2026)}
              className="w-full pop-input font-mono"
              required
            />
          </div>
        </div>

        {/* Live Diurnal Solar Curve Preview */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-display font-black text-[#1E293B]">
              24-Hour Diurnal Solar Distribution (Live Model Preview)
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">Violet: Inverters | Mint: Grid Meter (2.5% loss)</span>
          </div>
          <TelemetryComparisonChart dataPoints={previewPoints} height={180} />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleIngestTelemetry}
            disabled={ingesting}
            className="pop-btn-primary px-8 py-3.5 text-xs flex items-center space-x-2"
          >
            {ingesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Submitting Generation...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Generation for Auditor Approval</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 2: Approved Claims & Minting */}
      <div className="pop-card p-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#E2E8F0]">
          <div>
            <h2 className="font-display font-black text-lg text-[#1E293B]">Step 2: Approved Claims & Minting</h2>
            <p className="text-xs text-[#64748B] font-medium">When an auditor approves your batch, click "Mint" to receive tokens.</p>
          </div>
          <button onClick={loadData} className="pop-btn-secondary px-4 py-2 text-xs flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Refresh</span>
          </button>
        </div>

        {claims.length === 0 ? (
          <p className="text-xs text-[#64748B] text-center py-6 font-medium">No submitted claims yet. Use Step 1 above to submit.</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl bg-white border-2 border-[#1E293B] shadow-pop-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-[#1E293B]">{claim.claim_uid}</span>
                    <span className={
                      claim.status === 'MINTED' ? 'pop-badge-mint' : claim.status === 'APPROVED' ? 'pop-badge-violet' : claim.status === 'REJECTED' ? 'pop-badge-pink' : 'pop-badge-yellow'
                    }>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 font-medium">
                    {claim.project_name} &bull; {claim.requested_mwh.toFixed(1)} MWh &bull; <strong className="text-[#047857] font-mono font-black">{claim.co2_offset_tonnes.toFixed(2)} ZTC</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {claim.status === 'APPROVED' && (
                    <button
                      onClick={() => handleMintClaim(claim)}
                      disabled={mintingClaimId === claim.id}
                      className="pop-btn-primary px-5 py-2 text-xs flex items-center space-x-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mint Tokens to Wallet</span>
                    </button>
                  )}

                  {claim.status === 'MINTED' && (
                    <div className="flex items-center space-x-2 text-xs text-[#047857] font-bold bg-[#D1FAE5] border-2 border-[#1E293B] px-3.5 py-1.5 rounded-full shadow-pop-xs">
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Minted on-chain {claim.tx_hash ? `(${claim.tx_hash.slice(0, 6)}...${claim.tx_hash.slice(-4)})` : ''}</span>
                    </div>
                  )}

                  {claim.status === 'PENDING_REVIEW' && (
                    <div className="flex items-center space-x-2">
                      <span className="pop-badge-yellow text-xs">
                        <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Pending Auditor Review</span>
                      </span>
                    </div>
                  )}

                  {claim.ipfs_cid && (
                    <button
                      onClick={() => setSelectedIPFSCid(claim.ipfs_cid!)}
                      className="pop-btn-secondary p-2 text-[#8B5CF6]"
                      title="View IPFS Audit Document"
                    >
                      <Database className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IPFS Document Modal */}
      <IPFSModal
        cid={selectedIPFSCid}
        onClose={() => setSelectedIPFSCid(null)}
      />

    </div>
  );
};
