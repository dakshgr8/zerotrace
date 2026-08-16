import { Project, Claim, MarketplaceListing, Retirement, PlatformStats, TelemetryDataPoint } from '../types';
import { DEMO_ACCOUNTS, generateCryptoHash } from './web3';

const API_BASE = '/api';

// ==========================================
// DEFAULT SEED DATA FOR VERCEL / STANDALONE
// ==========================================
const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    project_code: 'PRJ-SOLAR-BHADLA-01',
    name: 'Bhadla Solar Phase IV (500 MW)',
    project_type: 'SOLAR',
    location: 'Bhadla, Phalodi, Rajasthan, India',
    developer_name: 'Tata Power Renewable Energy Ltd',
    peak_capacity_mw: 500.0,
    grid_emission_factor: 0.716,
    vintage_year: 2026,
    active: true,
  },
  {
    id: 2,
    project_code: 'PRJ-SOLAR-REWA-02',
    name: 'Rewa Ultra Mega Solar Park (250 MW)',
    project_type: 'SOLAR',
    location: 'Rewa, Madhya Pradesh, India',
    developer_name: 'Rewa Ultra Mega Solar Ltd (RUMSL)',
    peak_capacity_mw: 250.0,
    grid_emission_factor: 0.716,
    vintage_year: 2026,
    active: true,
  },
  {
    id: 3,
    project_code: 'PRJ-SOLAR-PAVAGADA-03',
    name: 'Pavagada Solar Park (300 MW)',
    project_type: 'SOLAR',
    location: 'Pavagada, Tumakuru, Karnataka, India',
    developer_name: 'Karnataka Solar Power Dev Corp (KSPDCL)',
    peak_capacity_mw: 300.0,
    grid_emission_factor: 0.716,
    vintage_year: 2026,
    active: true,
  },
];

const DEFAULT_CLAIMS: Claim[] = [];
const DEFAULT_LISTINGS: MarketplaceListing[] = [];
const DEFAULT_RETIREMENTS: Retirement[] = [];

// Local Storage Helper Store Keys
const STORE_CLAIMS = 'zerotrace_store_claims_v4';
const STORE_LISTINGS = 'zerotrace_store_listings_v4';
const STORE_RETIREMENTS = 'zerotrace_store_retirements_v4';

const getStore = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
};

const setStore = <T>(key: string, val: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage set error:', e);
  }
};

// ==========================================
// UNIFIED BULLETPROOF API SERVICE
// ==========================================
export const api = {
  // Stats & Platform Health
  getStats: async (): Promise<PlatformStats> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/stats`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const retirements = getStore<Retirement[]>(STORE_RETIREMENTS, DEFAULT_RETIREMENTS);
    const listings = getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);

    const totalMwh = claims.reduce((acc, c) => acc + (c.status === 'MINTED' || c.status === 'APPROVED' ? c.validated_mwh : 0), 0);
    const totalMinted = claims.reduce((acc, c) => acc + (c.status === 'MINTED' ? c.co2_offset_tonnes : 0), 0);
    const totalRetired = retirements.reduce((acc, r) => acc + r.amount_tonnes, 0);
    const totalTrades = listings.reduce((acc, l) => acc + (l.total_amount - l.remaining_amount > 0 ? 1 : 0), 0);
    const totalVolINR = listings.reduce((acc, l) => acc + (l.total_amount - l.remaining_amount) * (l.unit_price_inr || 1250), 0);

    return {
      total_projects: DEFAULT_PROJECTS.length,
      total_generation_mwh: parseFloat(totalMwh.toFixed(1)),
      total_credits_minted: parseFloat(totalMinted.toFixed(2)),
      total_credits_retired: parseFloat(totalRetired.toFixed(2)),
      total_trades: totalTrades,
      total_volume_inr: totalVolINR,
      active_listings_count: listings.filter(l => l.active).length,
    };
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    try {
      const res = await fetch(`${API_BASE}/projects`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}
    return DEFAULT_PROJECTS;
  },

  // Telemetry Ingestion
  ingestTelemetry: async (payload: {
    project_id: number;
    corporate_wallet: string;
    period_start: string;
    period_end: string;
    vintage_year: number;
    data_points: TelemetryDataPoint[];
    satellite_irradiance_avg?: number;
  }): Promise<Claim> => {
    try {
      const res = await fetch(`${API_BASE}/telemetry/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const project = DEFAULT_PROJECTS.find(p => p.id === payload.project_id) || DEFAULT_PROJECTS[0];

    const totalActivePower = payload.data_points.reduce((a, b) => a + b.scada_active_power_mw, 0);
    const totalGridPower = payload.data_points.reduce((a, b) => a + b.grid_export_power_mw, 0);
    const validatedMwh = totalGridPower > 0 ? totalGridPower : totalActivePower * 0.975;
    const credits = validatedMwh * project.grid_emission_factor;

    const newClaim: Claim = {
      id: claims.length + 1,
      claim_uid: `CLM-${project.project_code}-${generateCryptoHash('').slice(2, 10).toUpperCase()}`,
      project_id: project.id,
      project_code: project.project_code,
      project_name: project.name,
      corporate_wallet: payload.corporate_wallet,
      period_start: payload.period_start,
      period_end: payload.period_end,
      vintage_year: payload.vintage_year,
      requested_mwh: parseFloat(totalActivePower.toFixed(2)),
      validated_mwh: parseFloat(validatedMwh.toFixed(2)),
      co2_offset_tonnes: parseFloat(credits.toFixed(4)),
      risk_score: 9.2,
      status: 'PENDING_REVIEW',
      created_at: new Date().toISOString(),
      telemetry_points: payload.data_points,
    };

    claims.unshift(newClaim);
    setStore(STORE_CLAIMS, claims);
    return newClaim;
  },

  // Claims
  getPendingClaims: async (): Promise<Claim[]> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/pending-claims`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    return claims.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'FLAGGED');
  },

  getAllClaims: async (wallet?: string, status?: string): Promise<Claim[]> => {
    try {
      const params = new URLSearchParams();
      if (wallet) params.append('corporate_wallet', wallet);
      if (status) params.append('status', status);
      const res = await fetch(`${API_BASE}/mrv/claims?${params.toString()}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    let claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    if (wallet) {
      claims = claims.filter(c => c.corporate_wallet.toLowerCase() === wallet.toLowerCase());
    }
    if (status) {
      claims = claims.filter(c => c.status === status);
    }
    return claims;
  },

  getClaim: async (id: number): Promise<Claim> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/claims/${id}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const found = claims.find(c => c.id === id);
    if (!found) throw new Error('Claim not found');
    return found;
  },

  approveClaim: async (id: number, verifierAddress: string, notes?: string): Promise<Claim> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/approve-claim/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifier_address: verifierAddress,
          verifier_notes: notes || 'Verified against multi-source telemetry and CEA regional baseline models.',
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const index = claims.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Claim not found');

    const digest = generateCryptoHash('0x');
    const sig = generateCryptoHash('0x') + generateCryptoHash('').slice(2);
    const cid = `Qm${generateCryptoHash('').slice(2, 46)}`;

    claims[index].status = 'APPROVED';
    claims[index].ipfs_cid = cid;
    claims[index].claim_digest = digest;
    claims[index].oracle_signature = sig;
    claims[index].verifier_address = verifierAddress;
    claims[index].verifier_notes = notes || 'Verified against multi-source telemetry and CEA regional baseline models.';
    claims[index].reviewed_at = new Date().toISOString();

    setStore(STORE_CLAIMS, claims);
    return claims[index];
  },

  rejectClaim: async (id: number, verifierAddress: string, reason: string): Promise<Claim> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/reject-claim/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifier_address: verifierAddress, reason }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const index = claims.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Claim not found');

    claims[index].status = 'REJECTED';
    claims[index].verifier_address = verifierAddress;
    claims[index].verifier_notes = `REJECTED: ${reason}`;
    claims[index].reviewed_at = new Date().toISOString();

    setStore(STORE_CLAIMS, claims);
    return claims[index];
  },

  confirmMint: async (id: number, txHash: string): Promise<Claim> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/confirm-mint/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: txHash }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const index = claims.findIndex(c => c.id === id);
    if (index !== -1) {
      claims[index].status = 'MINTED';
      claims[index].tx_hash = txHash;
      setStore(STORE_CLAIMS, claims);
      return claims[index];
    }
    throw new Error('Claim not found');
  },

  getIPFSReport: async (cid: string): Promise<any> => {
    try {
      const res = await fetch(`${API_BASE}/mrv/ipfs/${cid}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    return {
      "@context": "https://www.w3.org/2018/credentials/v1",
      "type": ["VerifiableCredential", "ZeroTraceMRVReport"],
      "issuer": "did:zerotrace:verifier:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "issuanceDate": new Date().toISOString(),
      "credentialSubject": {
        "id": cid,
        "standard": "UNFCCC ACM0002 / CEA India Grid Baseline",
        "methodology": "Solar PV Generation Substation Meter Validation",
        "integrityProof": "EIP-712 Cryptographic Signature",
        "auditStatus": "VERIFIED_AUTHENTIC",
      }
    };
  },

  getIPFSDocument: async (cid: string): Promise<any> => {
    return api.getIPFSReport(cid);
  },

  // Marketplace
  getListings: async (): Promise<MarketplaceListing[]> => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/listings`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    return getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);
  },

  syncListing: async (payload: {
    listing_id: number;
    seller_wallet: string;
    amount: number;
    remaining_amount?: number;
    total_amount?: number;
    unit_price_inr?: number;
    unit_price_eth?: number;
    vintage_year?: number;
    project_type?: string;
    project_name?: string;
    tx_hash?: string;
  }): Promise<MarketplaceListing> => {
    const listings = getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);
    const newListing: MarketplaceListing = {
      listing_id: payload.listing_id || listings.length + 1,
      seller_wallet: payload.seller_wallet,
      project_type: payload.project_type || 'Mega Solar Park',
      project_name: payload.project_name || 'Solar PV Generation Asset',
      vintage_year: payload.vintage_year || 2026,
      total_amount: payload.amount || payload.total_amount || 25,
      remaining_amount: payload.remaining_amount !== undefined ? payload.remaining_amount : (payload.amount || payload.total_amount || 25),
      unit_price_inr: payload.unit_price_inr || 1250,
      unit_price_eth: payload.unit_price_eth || 0.005,
      active: true,
      created_at: new Date().toISOString(),
      tx_hash: payload.tx_hash || generateCryptoHash('0x'),
    };

    listings.unshift(newListing);
    setStore(STORE_LISTINGS, listings);
    return newListing;
  },

  createListing: async (payload: any): Promise<MarketplaceListing> => {
    return api.syncListing(payload);
  },

  syncPurchase: async (listingId: number, amount: number): Promise<any> => {
    const listings = getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);
    const index = listings.findIndex(l => l.listing_id === listingId);
    if (index !== -1) {
      listings[index].remaining_amount = Math.max(0, listings[index].remaining_amount - amount);
      if (listings[index].remaining_amount === 0) {
        listings[index].active = false;
      }
      setStore(STORE_LISTINGS, listings);
    }
    return { success: true };
  },

  syncCancel: async (listingId: number): Promise<any> => {
    const listings = getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);
    const index = listings.findIndex(l => l.listing_id === listingId);
    if (index !== -1) {
      listings[index].active = false;
      setStore(STORE_LISTINGS, listings);
    }
    return { success: true };
  },

  // Retirements
  getRetirements: async (): Promise<Retirement[]> => {
    try {
      const res = await fetch(`${API_BASE}/retirements`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    return getStore<Retirement[]>(STORE_RETIREMENTS, DEFAULT_RETIREMENTS);
  },

  recordRetirement: async (payload: {
    certificate_id: string;
    burner_wallet: string;
    corporate_beneficiary: string;
    reason?: string;
    amount_tonnes: number;
    tx_hash: string;
    block_number?: number;
    ipfs_certificate_uri?: string;
  }): Promise<Retirement> => {
    try {
      const res = await fetch(`${API_BASE}/retirements/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return await res.json();
    } catch {}

    const retirements = getStore<Retirement[]>(STORE_RETIREMENTS, DEFAULT_RETIREMENTS);
    const newRetirement: Retirement = {
      id: retirements.length + 1,
      certificate_id: payload.certificate_id,
      burner_wallet: payload.burner_wallet,
      corporate_beneficiary: payload.corporate_beneficiary,
      reason: payload.reason || 'Clean Energy Offset',
      amount_tonnes: payload.amount_tonnes,
      tx_hash: payload.tx_hash,
      block_number: payload.block_number || 18429200,
      timestamp: new Date().toISOString(),
    };

    retirements.unshift(newRetirement);
    setStore(STORE_RETIREMENTS, retirements);
    return newRetirement;
  },
};
