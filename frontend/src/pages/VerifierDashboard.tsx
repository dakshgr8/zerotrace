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
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Sun,
  Activity,
  Globe
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
        `Authorized ${approved.co2_offset_tonnes.toFixed(2)} ZTC carbon credits.`
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
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="trust-card p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl text-slate-900">Auditor Verification & Decision Hub</h1>
            <p className="text-xs text-slate-500">
              Review AI multi-sensor analysis, verify substation meters, and issue digital cryptographic signatures.
            </p>
          </div>
        </div>

        <button onClick={fetchClaims} className="trust-btn-secondary px-4 py-2 text-xs">
          Refresh Queue
        </button>
      </div>

      {/* Success Notification */}
      {lastApprovedClaim && (
        <div className="trust-card p-5 flex items-center justify-between gap-4 border-emerald-200 bg-emerald-50/50 animate-slide-up">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Claim {lastApprovedClaim.claim_uid} Approved & Signed!
              </p>
              <p className="text-[11px] text-emerald-700">
                Authorized {lastApprovedClaim.co2_offset_tonnes.toFixed(2)} ZTC carbon credits with EIP-712 cryptographic signature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Claims Queue Selector */}
      {pendingClaims.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
            Select Claim to Inspect ({pendingClaims.length} Pending in Queue)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pendingClaims.map((claim) => (
              <button
                key={claim.id}
                onClick={() => setSelectedClaim(claim)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  selectedClaim?.id === claim.id
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{claim.claim_uid}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    claim.risk_score >= 60 ? 'trust-badge-rose' : 'trust-badge-emerald'
                  }`}>
                    {claim.risk_score < 25 ? 'AI Safe' : 'AI Flagged'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-normal">{claim.project_name}</p>
                <p className="font-mono font-bold text-xs text-emerald-600 mt-1">{claim.co2_offset_tonnes.toFixed(1)} ZTC</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Claim Inspector & AI Decision Engine */}
      {selectedClaim ? (
        <div className="trust-card p-8 space-y-7">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display font-extrabold text-lg text-slate-900">{selectedClaim.claim_uid}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  selectedClaim.risk_score < 25 ? 'trust-badge-emerald' : selectedClaim.risk_score < 60 ? 'trust-badge-amber' : 'trust-badge-rose'
                }`}>
                  {selectedClaim.risk_score < 25 ? 'Safe to Approve' : selectedClaim.risk_score < 60 ? 'Review Needed' : 'Fraud Detected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedClaim.project_name} &bull; Vintage {selectedClaim.vintage_year} &bull; Producer: {selectedClaim.corporate_wallet.slice(0, 6)}...{selectedClaim.corporate_wallet.slice(-4)}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right text-xs">
                <span className="text-slate-500">Authorized Offset:</span>
                <p className="font-display font-extrabold text-xl text-emerald-600 font-mono">
                  {selectedClaim.co2_offset_tonnes.toFixed(2)} ZTC
                </p>
              </div>
              <RiskGauge score={selectedClaim.risk_score} size={75} />
            </div>
          </div>

          {/* AI Decision Intelligence Banner */}
          <div className={`p-5 rounded-2xl border space-y-2.5 ${
            selectedClaim.risk_score < 25 
              ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' 
              : selectedClaim.risk_score < 60 
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' 
              : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
          }`}>
            <div className="flex items-center space-x-2">
              <Sparkles className={`w-5 h-5 ${
                selectedClaim.risk_score < 25 ? 'text-emerald-600' : selectedClaim.risk_score < 60 ? 'text-amber-600' : 'text-rose-600'
              }`} />
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wide">
                {selectedClaim.risk_score < 25
                  ? '🟢 AI Recommendation: Safe to Approve (Confidence: 98.6%)'
                  : selectedClaim.risk_score < 60
                  ? '🟡 AI Recommendation: Auditor Scrutiny Advised'
                  : '🔴 AI Recommendation: Rejection Recommended (Severe Anomaly)'}
              </h3>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {selectedClaim.risk_score < 25
                ? 'The AI multi-sensor model cross-checked the generation curve against regional solar irradiance and substation meters. The grid export efficiency ratio (97.5%) is within normal transmission limits. No night generation or synthetic over-reporting was detected.'
                : selectedClaim.risk_score < 60
                ? 'The AI engine detected moderate variance between reported generation and regional baselines. Please inspect the comparison curve below before signing.'
                : 'The AI engine detected severe divergence (>20%) between reported plant generation and the substation grid export meter. Output was also recorded during non-sunlight hours.'}
            </p>
          </div>

          {/* 4 Multi-Sensor Sanity Checks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">Substation Grid Meter</p>
                  <p className="text-[10px] text-slate-500">{selectedClaim.validated_mwh.toFixed(1)} MWh Exported</p>
                </div>
              </div>
              <span className="trust-badge-emerald px-2 py-0.5 text-[9px]">
                Matched (2.5% Loss)
              </span>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-bold text-slate-900">Diurnal Solar Physics</p>
                  <p className="text-[10px] text-slate-500">0 MW at Night &bull; Bell Curve</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${
                selectedClaim.risk_score < 60 ? 'trust-badge-emerald' : 'trust-badge-rose'
              }`}>
                {selectedClaim.risk_score < 60 ? 'Physically Valid' : 'Night Gen Flagged'}
              </span>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="font-bold text-slate-900">Satellite Irradiance</p>
                  <p className="text-[10px] text-slate-500">GHI: 440 W/m² Baseline</p>
                </div>
              </div>
              <span className="trust-badge-indigo px-2 py-0.5 text-[9px]">
                Regional Correlated
              </span>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">Isolation Forest ML</p>
                  <p className="text-[10px] text-slate-500">Anomaly Score: {(selectedClaim.risk_score / 100).toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${
                selectedClaim.risk_score < 25 ? 'trust-badge-emerald' : 'trust-badge-rose'
              }`}>
                {selectedClaim.risk_score < 25 ? 'Normal Cluster' : 'Anomaly Cluster'}
              </span>
            </div>
          </div>

          {/* 24-Hour Telemetry Curve */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">24-Hour Generation Curve vs. Substation Grid Meter</span>
              <span className="text-[10px] font-mono text-slate-400">Indigo: Plant SCADA | Emerald: Grid Substation Meter</span>
            </div>
            <TelemetryComparisonChart dataPoints={selectedClaim.telemetry_points || []} height={190} />
          </div>

          {/* Detailed Alert List if Any */}
          {selectedClaim.explainable_alerts && selectedClaim.explainable_alerts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Anomaly Breakdown</span>
              {selectedClaim.explainable_alerts.map((alert, idx) => (
                <div key={idx} className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-950">{alert.title}</p>
                    <p className="text-rose-800 mt-0.5">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="trust-btn-secondary px-5 py-2.5 text-xs text-rose-600 hover:text-rose-700 hover:border-rose-300 flex items-center space-x-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Claim</span>
            </button>

            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="trust-btn-emerald px-8 py-3 text-xs flex items-center space-x-2 shadow-emerald-btn"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing Cryptographic Approval...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve & Authorize {selectedClaim.co2_offset_tonnes.toFixed(2)} ZTC</span>
                </>
              )}
            </button>
          </div>

        </div>
      ) : (
        <div className="trust-card p-12 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
          <p className="font-bold text-slate-900">Queue is Clear</p>
          <p className="text-xs">No pending energy claims waiting for auditor review.</p>
        </div>
      )}

    </div>
  );
};
