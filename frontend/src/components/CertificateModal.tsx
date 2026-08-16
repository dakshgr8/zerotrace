import React from 'react';
import { Retirement } from '../types';
import { 
  Award, 
  CheckCircle2, 
  ExternalLink, 
  Printer, 
  X, 
  ShieldCheck, 
  Globe, 
  Leaf, 
  QrCode 
} from 'lucide-react';
import { CARBON_TOKEN_ADDRESS } from '../services/web3';

interface CertificateModalProps {
  retirement: Retirement | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ retirement, onClose }) => {
  if (!retirement) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Verified On-Chain Retirement Certificate
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="trust-btn-secondary px-3 py-1.5 text-xs flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Proof</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body Canvas */}
        <div className="p-8 sm:p-10 space-y-6 bg-gradient-to-b from-white to-slate-50 relative">
          
          {/* Subtle Watermark */}
          <div className="absolute right-6 top-8 opacity-5 pointer-events-none">
            <Leaf className="w-72 h-72 text-indigo-900" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200/80 pb-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-primary-btn">
                  <Leaf className="w-5 h-5" />
                </div>
                <span className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                  ZeroTrace
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">Decentralized Carbon Credit Registry</p>
            </div>

            <div className="text-right">
              <div className="trust-badge-emerald px-3 py-1 text-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Permanently Retired</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Registry Standard: CEA / GHG</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1.5 py-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Certificate of Carbon Offset
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              This cryptographic proof confirms the permanent retirement and neutralization of verified carbon credits.
            </p>
          </div>

          {/* Recipient & Amount Badge */}
          <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm text-center space-y-3 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500"></div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Awarded To</span>
            <h3 className="font-display font-extrabold text-2xl text-indigo-900 tracking-tight">
              {retirement.corporate_beneficiary}
            </h3>

            <div className="flex items-center justify-center space-x-2 pt-1">
              <span className="font-display font-extrabold text-4xl text-emerald-600 font-mono">
                {retirement.amount_tonnes.toFixed(2)}
              </span>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-800 block">Metric Tons CO₂</span>
                <span className="text-[10px] text-slate-500">Neutralized via Solar/Wind Generation</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Offset Purpose</span>
              <span className="font-sans font-semibold text-slate-800">{retirement.reason || 'Corporate Sustainability Neutralization'}</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Retirement Date</span>
              <span className="text-slate-800">{new Date(retirement.timestamp).toLocaleString()}</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Certificate ID</span>
              <span className="text-indigo-600 font-bold truncate block">{retirement.certificate_id}</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block mb-1">Burner Wallet</span>
              <span className="text-slate-600 truncate block">{retirement.burner_wallet}</span>
            </div>
          </div>

          {/* Verification Hash & QR placeholder */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-[11px]">
            <div className="space-y-0.5">
              <span className="text-slate-500 font-sans font-medium">Smart Contract Token:</span>
              <p className="font-mono text-slate-600 text-[10px]">{CARBON_TOKEN_ADDRESS}</p>
              <p className="font-mono text-emerald-600 text-[10px]">Tx: {retirement.tx_hash}</p>
            </div>

            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
              <QrCode className="w-7 h-7" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
