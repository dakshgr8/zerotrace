import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Database, FileCode, X, Copy, Check, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">Decentralized IPFS Audit Document</h3>
              <p className="text-[11px] font-mono text-slate-500 truncate max-w-md">CID: {cid}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="trust-btn-secondary px-3 py-1.5 text-xs flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              Loading decentralized JSON-LD verification report...
            </div>
          ) : data ? (
            <pre className="whitespace-pre-wrap leading-relaxed text-indigo-300">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div className="py-12 text-center text-rose-400">
              Failed to retrieve IPFS document for CID: {cid}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
