import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, X, Copy, Check } from 'lucide-react';

interface IPFSModalProps {
  cid: string | null;
  onClose: () => void;
}

export const IPFSModal: React.FC<IPFSModalProps> = ({ cid, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (cid) {
      setLoading(true);
      api.getIPFSDocument(cid)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [cid]);

  if (!cid) return null;

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-pop-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border-2 border-[#1E293B] shadow-pop-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1E293B] bg-[#FFFDF5]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE9FE] border-2 border-[#1E293B] flex items-center justify-center text-[#8B5CF6] shadow-pop-xs">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-[#1E293B]">Decentralized IPFS Audit Document (W3C JSON-LD)</h3>
              <p className="text-[11px] font-mono text-[#64748B] truncate max-w-md">CID: {cid}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="pop-btn-secondary px-3.5 py-1.5 text-xs flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#047857] stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] transition"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#1E293B] text-white font-mono text-xs">
          {loading ? (
            <div className="py-12 text-center text-[#94A3B8]">
              Loading decentralized JSON-LD verification report...
            </div>
          ) : data ? (
            <pre className="whitespace-pre-wrap leading-relaxed text-[#34D399]">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div className="py-12 text-center text-[#F472B6]">
              Failed to retrieve IPFS document for CID: {cid}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
