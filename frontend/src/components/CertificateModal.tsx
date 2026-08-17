import React, { useState } from 'react';
import { Retirement } from '../types';
import { 
  ShieldCheck, 
  Printer, 
  X, 
  Leaf, 
  Copy, 
  Check, 
  Lock
} from 'lucide-react';
import { CARBON_TOKEN_ADDRESS } from '../services/web3';

interface CertificateModalProps {
  retirement: Retirement | null;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ retirement, onClose }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  if (!retirement) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handlePrint = () => {
    const certificateElem = document.getElementById('zerotrace-printable-certificate');
    if (!certificateElem) {
      window.print();
      return;
    }

    // Create an isolated hidden iframe for clean, single-page printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Collect all loaded CSS links and styles from the main document
    let styles = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      styles += node.outerHTML;
    });

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ZeroTrace_Certificate_${retirement.certificate_id.slice(0, 8)}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
          ${styles}
          <style>
            @page {
              size: A4 landscape;
              margin: 4mm;
            }
            html, body {
              background: #FFFDF9 !important;
              margin: 0 !important;
              padding: 0 !important;
              height: 100% !important;
              max-height: 100vh !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            .cert-print-wrapper {
              width: 100% !important;
              max-width: 1040px !important;
              height: 100% !important;
              max-height: 98vh !important;
              margin: 0 auto !important;
              padding: 4px !important;
              box-sizing: border-box !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #zerotrace-printable-certificate {
              padding: 8px !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="cert-print-wrapper">
            ${certificateElem.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print once iframe finishes rendering
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Print trigger error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 350);
  };

  const certShortId = retirement.certificate_id.slice(0, 10).toUpperCase();
  const dateFormatted = new Date(retirement.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:rounded-none print:max-w-full">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official ZeroTrace Registry Proof
              </span>
              <span className="text-[11px] text-slate-400 font-mono ml-2">
                Serial: ZT-CERT-2026-{certShortId}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print / Save 1-Page PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close Certificate"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* PHYSICAL CERTIFICATE CANVAS (Fits perfectly on 1 Single Page) */}
        {/* ============================================================ */}
        <div 
          id="zerotrace-printable-certificate"
          className="p-4 sm:p-7 relative bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F0] to-[#F4EFE6] text-slate-900 select-none print:p-2"
        >
          {/* Certificate Outer Guilloche Border Frame */}
          <div className="relative border-2 sm:border-[3px] border-[#C5A059]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-inner bg-white/70 backdrop-blur-sm">
            
            {/* Inner Gold Inset Border */}
            <div className="absolute inset-1.5 sm:inset-2 border border-[#C5A059]/50 rounded-lg sm:rounded-xl pointer-events-none" />
            
            {/* Ornate Corner Accents */}
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 w-4 sm:w-5 h-4 sm:h-5 border-t-2 border-l-2 border-[#C5A059] rounded-tl pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 sm:w-5 h-4 sm:h-5 border-t-2 border-r-2 border-[#C5A059] rounded-tr pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-l-2 border-[#C5A059] rounded-bl pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 w-4 sm:w-5 h-4 sm:h-5 border-b-2 border-r-2 border-[#C5A059] rounded-br pointer-events-none" />

            {/* Subtle Center Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Leaf className="w-64 h-64 text-emerald-950 stroke-[1]" />
            </div>

            {/* 1. Header Section */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7D7B8] gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-800 to-slate-900 flex items-center justify-center text-white shadow-sm border border-[#C5A059]/40">
                  <Leaf className="w-5 h-5 text-[#F5DF9E]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-display font-black text-lg sm:text-xl text-slate-950 tracking-tight">
                      ZeroTrace
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-900 text-[#F5DF9E] border border-[#C5A059]/40">
                      Standard
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-[#8C6D32] tracking-wide">
                    Decentralized Carbon Credit Registry &bull; UNFCCC ACM0002 Compliance
                  </p>
                </div>
              </div>

              {/* Certificate Status Tag */}
              <div className="text-right space-y-0.5">
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span className="tracking-wider uppercase">Permanently Retired</span>
                </div>
                <p className="text-[9px] font-mono text-slate-500">
                  Serial: <strong className="text-slate-800">ZT-2026-CERT-{certShortId}</strong>
                </p>
              </div>
            </div>

            {/* 2. Main Certificate Title */}
            <div className="text-center space-y-0.5 py-2.5 sm:py-3">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#8C6D32] uppercase tracking-[0.2em] block">
                Official Environmental Proof of Climate Action
              </span>
              <h1 className="font-display font-black text-lg sm:text-2xl text-slate-950 tracking-tight leading-tight">
                Certificate of Carbon Offset Retirement
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-600 max-w-xl mx-auto font-medium leading-snug">
                This document certifies that verified solar carbon credits have been permanently burned on the blockchain ledger and withdrawn from circulation.
              </p>
            </div>

            {/* 3. Awarded Beneficiary & Tonnes Box */}
            <div className="my-2 p-3.5 sm:p-5 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white text-center space-y-1.5 shadow-md border border-[#C5A059]/40 relative overflow-hidden">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5DF9E] block">
                Presented in Honor of Climate Neutralization to
              </span>

              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-tight px-2 truncate">
                {retirement.corporate_beneficiary}
              </h2>

              <div className="flex items-center justify-center space-x-2 pt-0.5">
                <span className="font-display font-black text-3xl sm:text-4xl text-[#F5DF9E] font-mono tracking-tight">
                  {retirement.amount_tonnes.toFixed(2)}
                </span>
                <div className="text-left leading-tight">
                  <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider block">
                    Metric Tons CO₂ (tCO₂e)
                  </span>
                  <span className="text-[9px] text-emerald-200">
                    Neutralized via Verified Utility Solar PV Generation
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Verification Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 my-2.5 text-[10px] sm:text-[11px]">
              <div className="p-2.5 rounded-lg bg-white border border-[#E7D7B8] shadow-sm">
                <span className="text-[9px] font-bold text-[#8C6D32] uppercase tracking-wider block mb-0.5">
                  Retirement Purpose
                </span>
                <span className="font-bold text-slate-900 block truncate">
                  {retirement.reason || 'Corporate Sustainability Neutralization'}
                </span>
                <span className="text-[9px] text-slate-500 block truncate">Scope 1 & 2 Neutralization</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#E7D7B8] shadow-sm">
                <span className="text-[9px] font-bold text-[#8C6D32] uppercase tracking-wider block mb-0.5">
                  Settlement & Issue Date
                </span>
                <span className="font-bold text-slate-900 block font-mono">
                  {dateFormatted}
                </span>
                <span className="text-[9px] text-slate-500 block font-mono">
                  Block #{retirement.block_number || 18429210}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-[#E7D7B8] shadow-sm">
                <span className="text-[9px] font-bold text-[#8C6D32] uppercase tracking-wider block mb-0.5">
                  Methodology Standard
                </span>
                <span className="font-bold text-slate-900 block truncate">
                  UNFCCC ACM0002 / CEA Grid
                </span>
                <span className="text-[9px] text-emerald-700 font-bold block truncate">
                  Factor: 0.716 tCO₂/MWh Solar
                </span>
              </div>
            </div>

            {/* 5. Cryptographic Proof Verification Bar */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-slate-500 font-sans font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">
                  Certificate ID:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(retirement.certificate_id, 'cert')}
                  className="flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 font-bold transition truncate text-left"
                >
                  <span className="truncate max-w-[280px] sm:max-w-md">{retirement.certificate_id}</span>
                  {copiedHash === 'cert' ? <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-sans font-bold uppercase text-[9px] tracking-wider whitespace-nowrap">
                  On-Chain Tx Hash:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(retirement.tx_hash, 'tx')}
                  className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-bold transition truncate text-left"
                >
                  <span className="truncate max-w-[280px] sm:max-w-md">{retirement.tx_hash}</span>
                  {copiedHash === 'tx' ? <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 border-t border-slate-200">
                <span className="truncate">Burner: {retirement.burner_wallet}</span>
                <span className="truncate">Contract: {CARBON_TOKEN_ADDRESS.slice(0, 10)}...{CARBON_TOKEN_ADDRESS.slice(-6)}</span>
              </div>
            </div>

            {/* 6. Bottom Signatures & Seal Bar */}
            <div className="pt-3 mt-2.5 border-t border-[#E7D7B8] flex items-center justify-between gap-2">
              
              {/* Left Signatory: Independent Auditor */}
              <div className="text-left space-y-0.5">
                <div className="font-serif italic font-bold text-xs sm:text-sm text-slate-800">
                  Bureau Veritas Sustainability
                </div>
                <div className="w-28 sm:w-36 h-0.5 bg-slate-300 my-0.5" />
                <p className="text-[8px] sm:text-[9px] font-bold text-[#8C6D32] uppercase tracking-wider">
                  Independent Verification Auditor
                </p>
                <p className="text-[8px] font-mono text-slate-400">
                  EIP-712 Cryptographic Signature
                </p>
              </div>

              {/* Center Gold & Emerald Rosette Seal */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-gradient-to-tr from-[#C5A059] via-[#F5DF9E] to-[#9C7830] p-0.5 shadow-md flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-emerald-950 border border-[#F5DF9E]/60 flex flex-col items-center justify-center text-center p-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F5DF9E]" />
                    <span className="text-[5px] sm:text-[6px] font-extrabold uppercase text-white tracking-tight leading-tight">
                      ZEROTRACE
                    </span>
                    <span className="text-[4px] sm:text-[5px] font-bold text-[#F5DF9E] uppercase tracking-widest">
                      SEAL
                    </span>
                  </div>
                </div>
                <span className="text-[7px] sm:text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Verified Authentic
                </span>
              </div>

              {/* Right Signatory: ZeroTrace Protocol Authority */}
              <div className="text-right space-y-0.5">
                <div className="font-serif italic font-bold text-xs sm:text-sm text-slate-800">
                  ZeroTrace Autonomous Oracle
                </div>
                <div className="w-28 sm:w-36 h-0.5 bg-slate-300 ml-auto my-0.5" />
                <p className="text-[8px] sm:text-[9px] font-bold text-[#8C6D32] uppercase tracking-wider">
                  Smart Contract Protocol Registry
                </p>
                <p className="text-[8px] font-mono text-slate-400">
                  Non-Custodial Atomic Burn Engine
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Footer actions for modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs print:hidden">
          <div className="flex items-center space-x-2 text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">Immutable proof permanently anchored to blockchain registry.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="trust-btn-secondary px-3.5 py-1.5 text-xs flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print 1-Page PDF</span>
            </button>

            <button
              onClick={onClose}
              className="trust-btn-primary px-5 py-1.5 text-xs"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
