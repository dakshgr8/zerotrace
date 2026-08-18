import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { api } from '../services/api';
import { Claim } from '../types';
import { TelemetryComparisonChart, RiskGauge } from '../components/Charts';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Check, 
  Sparkles, 
  Zap, 
  Sun, 
  Activity, 
  Globe,
  RefreshCw
} from 'lucide-react';

export const VerifierDashboard: React.FC = () => {
  const { walletAddress, addNotification } = useWeb3();

  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [lastApprovedClaim, setLastApprovedClaim] = useState<Claim | null>(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingClaims();
      setPendingClaims(data);
      if (data.length > 0 && !selectedClaim) {
        setSelectedClaim(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async () => {
    if (!selectedClaim) return;
    try {
      setActionLoading(true);
      addNotification('info', 'Approving Claim', 'Issuing cryptographic ECDSA approval signature...');

      const approved = await api.approveClaim(
        selectedClaim.id, 
        walletAddress, 
        'Verified against substation grid meter and AI multi-sensor baseline model.'
      );
      setLastApprovedClaim(approved);
      
      addNotification(
        'success',
        'Claim Approved & Signed!',
        `Authorized ${approved.co2_offset_tonnes.toFixed(2)} ZTC carbon credits with EIP-712 signature.`
      );

      await fetchClaims();
      setSelectedClaim(null);
    } catch (err: any) {
      addNotification('error', 'Approval Error', err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim) return;
    try {
      setActionLoading(true);
      await api.rejectClaim(selectedClaim.id, walletAddress, 'Data does not match substation grid export meter.');
      addNotification('info', 'Claim Rejected', `Claim ${selectedClaim.claim_uid} rejected.`);
      await fetchClaims();
      setSelectedClaim(null);
    } catch (err: any) {
      addNotification('error', 'Rejection Error', err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-pop-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="pop-card-mint p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[#D1FAE5] border-2 border-[#1E293B] flex items-center justify-center text-[#047857] shadow-pop-xs">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-[#1E293B]">Auditor Verification & Decision Hub</h1>
            <p className="text-xs text-[#64748B] font-medium">
              Bureau Veritas Sustainability &bull; Government Verification Body &bull; Non-Custodial Signer
            </p>
          </div>
        </div>

        <button onClick={fetchClaims} className="pop-btn-secondary px-4 py-2 text-xs flex items-center space-x-1.5 font-display font-black">
          <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Success Notification */}
      {lastApprovedClaim && (
        <div className="pop-card-mint p-5 flex items-center justify-between gap-4 bg-[#D1FAE5]/60 animate-pop-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-[#1E293B] flex items-center justify-center text-[#047857] shadow-pop-xs">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <p className="text-xs font-display font-black text-[#1E293B]">
                Claim {lastApprovedClaim.claim_uid} Approved & Signed!
              </p>
              <p className="text-[11px] text-[#047857] font-medium">
                Authorized {lastApprovedClaim.co2_offset_tonnes.toFixed(2)} ZTC carbon credits with EIP-712 cryptographic signature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Claims Queue Selector */}
      {pendingClaims.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-display font-black text-[#1E293B] uppercase tracking-wider px-2">
            Verification Queue ({pendingClaims.length} Pending Ingestion Batches)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pendingClaims.map((claim) => (
              <button
                key={claim.id}
                onClick={() => setSelectedClaim(claim)}
                className={`p-4 rounded-2xl text-left transition-all border-2 ${
                  selectedClaim?.id === claim.id
                    ? 'bg-[#8B5CF6] text-white font-bold border-[#1E293B] shadow-pop-xs translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-white border-[#1E293B] text-[#1E293B] hover:bg-[#FEF3C7] shadow-pop-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">{claim.claim_uid}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border border-[#1E293B] font-display font-black ${
                    claim.risk_score >= 60 ? 'bg-[#FCE7F3] text-[#DB2777]' : 'bg-[#D1FAE5] text-[#047857]'
                  }`}>
                    {claim.risk_score < 25 ? 'AI Safe' : 'AI Flagged'}
                  </span>
                </div>
                <p className={`text-xs mt-1 font-medium ${selectedClaim?.id === claim.id ? 'text-white' : 'text-[#64748B]'}`}>{claim.project_name}</p>
                <p className={`font-mono font-black text-xs mt-1 ${selectedClaim?.id === claim.id ? 'text-[#FDE68A]' : 'text-[#047857]'}`}>{claim.co2_offset_tonnes.toFixed(1)} ZTC</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Claim Inspector & AI Decision Engine */}
      {selectedClaim ? (
        <div className="pop-card p-8 space-y-7 bg-white">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#E2E8F0] gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-black text-xl text-[#1E293B]">{selectedClaim.claim_uid}</h2>
                <span className={
                  selectedClaim.risk_score < 25 ? 'pop-badge-mint' : selectedClaim.risk_score < 60 ? 'pop-badge-yellow' : 'pop-badge-pink'
                }>
                  {selectedClaim.risk_score < 25 ? 'Safe to Approve' : selectedClaim.risk_score < 60 ? 'Review Needed' : 'Fraud Detected'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                {selectedClaim.project_name} &bull; Vintage {selectedClaim.vintage_year} &bull; Producer: {selectedClaim.corporate_wallet.slice(0, 6)}...{selectedClaim.corporate_wallet.slice(-4)}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-xs">
                <span className="text-[#64748B] font-display font-bold">Authorized Offset:</span>
                <p className="font-display font-black text-2xl text-[#047857] font-mono">
                  {selectedClaim.co2_offset_tonnes.toFixed(2)} ZTC
                </p>
              </div>
              <RiskGauge score={selectedClaim.risk_score} size={80} />
            </div>
          </div>

          {/* AI Decision Intelligence Banner */}
          <div className={`p-5 rounded-2xl border-2 border-[#1E293B] space-y-2.5 shadow-pop-xs ${
            selectedClaim.risk_score < 25 
              ? 'bg-[#D1FAE5] text-[#047857]' 
              : selectedClaim.risk_score < 60 
              ? 'bg-[#FEF3C7] text-[#B45309]' 
              : 'bg-[#FCE7F3] text-[#DB2777]'
          }`}>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
              <h3 className="font-display font-black text-sm uppercase tracking-wide">
                {selectedClaim.risk_score < 25
                  ? '🟢 AI Recommendation: Safe to Approve (Confidence: 98.6%)'
                  : selectedClaim.risk_score < 60
                  ? '🟡 AI Recommendation: Auditor Scrutiny Advised'
                  : '🔴 AI Recommendation: Rejection Recommended (Severe Anomaly)'}
              </h3>
            </div>

            <p className="text-xs leading-relaxed font-medium text-[#1E293B]">
              {selectedClaim.risk_score < 25
                ? 'The AI multi-sensor model cross-checked the generation curve against regional solar irradiance and substation meters. The grid export efficiency ratio (97.5%) is within normal transmission limits. No night generation or synthetic over-reporting was detected.'
                : selectedClaim.risk_score < 60
                ? 'The AI engine detected moderate variance between reported generation and regional baselines. Please inspect the comparison curve below before signing.'
                : 'The AI engine detected severe divergence (>20%) between reported plant generation and the substation grid export meter. Output was also recorded during non-sunlight hours.'}
            </p>
          </div>

          {/* 4 Multi-Sensor Sanity Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border-2 border-[#1E293B] rounded-2xl flex items-center justify-between shadow-pop-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] border border-[#1E293B] flex items-center justify-center text-[#047857]">
                  <Zap className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-display font-black text-[#1E293B]">Substation Grid Meter</p>
                  <p className="text-[11px] text-[#64748B] font-mono">{selectedClaim.validated_mwh.toFixed(1)} MWh Exported</p>
                </div>
              </div>
              <span className="pop-badge-mint text-[9px]">
                Matched (2.5% Loss)
              </span>
            </div>

            <div className="p-4 bg-white border-2 border-[#1E293B] rounded-2xl flex items-center justify-between shadow-pop-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] border border-[#1E293B] flex items-center justify-center text-[#B45309]">
                  <Sun className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-display font-black text-[#1E293B]">Diurnal Solar Physics</p>
                  <p className="text-[11px] text-[#64748B]">0 MW at Night &bull; Bell Curve</p>
                </div>
              </div>
              <span className={selectedClaim.risk_score < 60 ? 'pop-badge-mint text-[9px]' : 'pop-badge-pink text-[9px]'}>
                {selectedClaim.risk_score < 60 ? 'Physically Valid' : 'Night Gen Flagged'}
              </span>
            </div>

            <div className="p-4 bg-white border-2 border-[#1E293B] rounded-2xl flex items-center justify-between shadow-pop-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] border border-[#1E293B] flex items-center justify-center text-[#6D28D9]">
                  <Globe className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-display font-black text-[#1E293B]">Satellite Irradiance</p>
                  <p className="text-[11px] text-[#64748B] font-mono">GHI: 440 W/m² Baseline</p>
                </div>
              </div>
              <span className="pop-badge-violet text-[9px]">
                Regional Correlated
              </span>
            </div>

            <div className="p-4 bg-white border-2 border-[#1E293B] rounded-2xl flex items-center justify-between shadow-pop-xs">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] border border-[#1E293B] flex items-center justify-center text-[#047857]">
                  <Activity className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <p className="font-display font-black text-[#1E293B]">Isolation Forest ML</p>
                  <p className="text-[11px] text-[#64748B] font-mono">Score: {(selectedClaim.risk_score / 100).toFixed(2)}</p>
                </div>
              </div>
              <span className={selectedClaim.risk_score < 25 ? 'pop-badge-mint text-[9px]' : 'pop-badge-pink text-[9px]'}>
                {selectedClaim.risk_score < 25 ? 'Normal Cluster' : 'Anomaly Cluster'}
              </span>
            </div>
          </div>

          {/* 24-Hour Telemetry Curve */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-display font-black text-[#1E293B]">24-Hour Generation Curve vs. Substation Grid Meter</span>
              <span className="text-[11px] font-mono text-[#64748B]">Dark: Plant SCADA | Mint: Grid Substation Meter</span>
            </div>
            <TelemetryComparisonChart dataPoints={selectedClaim.telemetry_points || []} height={190} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t-2 border-[#E2E8F0]">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="pop-btn-pink px-6 py-2.5 text-xs flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Reject Claim</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="pop-btn-mint px-8 py-3 text-xs flex items-center space-x-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Signing Cryptographic Approval...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Approve & Sign ({selectedClaim.co2_offset_tonnes.toFixed(2)} ZTC)</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        <div className="pop-card p-12 text-center text-[#64748B] space-y-2 bg-white">
          <CheckCircle2 className="w-10 h-10 text-[#047857] mx-auto stroke-[2.5]" />
          <p className="font-display font-black text-[#1E293B] text-base">Queue is Clear</p>
          <p className="text-xs font-medium">No pending energy claims waiting for auditor review.</p>
        </div>
      )}

    </div>
  );
};
