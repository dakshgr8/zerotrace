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

const DEFAULT_CLAIMS: Claim[] = [
  {
    id: 1,
    claim_uid: 'CLM-PRJ-SOLAR-BHADLA-01-987CA446',
    project_id: 1,
    project_code: 'PRJ-SOLAR-BHADLA-01',
    project_name: 'Bhadla Solar Phase IV (500 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: '2026-08-16T00:00:00Z',
    period_end: '2026-08-16T23:59:59Z',
    vintage_year: 2026,
    requested_mwh: 849.6,
    validated_mwh: 828.36,
    co2_offset_tonnes: 594.57,
    risk_score: 8.5,
    status: 'APPROVED',
    ipfs_cid: 'QmX7zBhadlaSolarMRVComplianceReportBatch001',
    claim_digest: '0xcb4bcda3f48ed7cf06d0a1680e54604e785cf71f448df7a8cdb92f54c357878b',
    oracle_signature: '0xd89a500d9ce281a91763784618274a9182374618273648172634817263481726348172634817263481726348172634817263481726348172634817263481721b',
    verifier_address: DEMO_ACCOUNTS[1].address,
    verifier_notes: 'Verified against substation grid export meter (97.5% efficiency ratio) and satellite baseline.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    reviewed_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 2,
    claim_uid: 'CLM-PRJ-SOLAR-REWA-02-B1498C22',
    project_id: 2,
    project_code: 'PRJ-SOLAR-REWA-02',
    project_name: 'Rewa Ultra Mega Solar Park (250 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: '2026-08-15T00:00:00Z',
    period_end: '2026-08-15T23:59:59Z',
    vintage_year: 2026,
    requested_mwh: 1250.0,
    validated_mwh: 1218.75,
    co2_offset_tonnes: 872.63,
    risk_score: 11.2,
    status: 'MINTED',
    ipfs_cid: 'QmR8wRewaSolarMRVComplianceReportBatch002',
    claim_digest: '0xce5554308eb3690b41067a06bd5e2a7f4bcfc2328ae811defe19296703b8fa18',
    oracle_signature: '0x1162b5d6cb8105cd9db55d2849b626f3458402d8fe41df4fbac2226ae388820d7d4765741a9eb0f419ffbee0adcf97af3f1991103c2fdb2f2d29a63719f7e9621b',
    tx_hash: '0x7a98019d7f261d0d30fcfb525fc3e53cc68d79cc6df86a467cdce2268c0e9bda',
    verifier_address: DEMO_ACCOUNTS[1].address,
    verifier_notes: 'Substation meter match confirmed.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reviewed_at: new Date(Date.now() - 80000000).toISOString(),
  },
  {
    id: 3,
    claim_uid: 'CLM-PRJ-SOLAR-PAVAGADA-03-D82A0F11',
    project_id: 3,
    project_code: 'PRJ-SOLAR-PAVAGADA-03',
    project_name: 'Pavagada Solar Park (300 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: '2026-08-16T06:00:00Z',
    period_end: '2026-08-16T18:00:00Z',
    vintage_year: 2026,
    requested_mwh: 650.0,
    validated_mwh: 633.75,
    co2_offset_tonnes: 453.77,
    risk_score: 12.0,
    status: 'PENDING_REVIEW',
    created_at: new Date().toISOString(),
  }
];

const DEFAULT_LISTINGS: MarketplaceListing[] = [
  {
    listing_id: 1,
    seller_wallet: DEMO_ACCOUNTS[0].address,
    project_type: 'Mega Solar Park',
    project_name: 'Bhadla Solar Phase IV',
    vintage_year: 2026,
    total_amount: 50.0,
    remaining_amount: 50.0,
    unit_price_inr: 1250.0,
    unit_price_eth: 0.005,
    active: true,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    tx_hash: '0x0ad667b3c4211742e980a8d6af69655b325a7a38865e0105e70c5eabbddbac5c',
  },
  {
    listing_id: 2,
    seller_wallet: DEMO_ACCOUNTS[0].address,
    project_type: 'C&I Rooftop & Ground Solar',
    project_name: 'Rewa Solar Mega Park',
    vintage_year: 2026,
    total_amount: 35.0,
    remaining_amount: 35.0,
    unit_price_inr: 1320.0,
    unit_price_eth: 0.00528,
    active: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    tx_hash: '0xedf439587eb0741054a8e3213b33ef9547ca9fc912f1854473d3566f81c3f441',
  },
];

const DEFAULT_RETIREMENTS: Retirement[] = [
  {
    id: 1,
    certificate_id: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    burner_wallet: DEMO_ACCOUNTS[2].address,
    corporate_beneficiary: 'Corporate ESG Sustainability Fund',
    reason: 'Scope 1 & 2 Net Zero Neutralization',
    amount_tonnes: 15.0,
    tx_hash: '0xb098acb20e42ad1c91754c2a3da0cfbd4c9f8c67caafafc830d5417c69d772d4',
    block_number: 18429210,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
];

// Local Storage Helper Store Keys
const STORE_CLAIMS = 'zerotrace_store_claims_v3';
const STORE_LISTINGS = 'zerotrace_store_listings_v3';
const STORE_RETIREMENTS = 'zerotrace_store_retirements_v3';

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
      total_trades: totalTrades + 1,
      total_volume_inr: totalVolINR + 18750,
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
