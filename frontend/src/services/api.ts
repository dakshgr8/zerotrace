import { Project, Claim, MarketplaceListing, Retirement, PlatformStats, TelemetryDataPoint } from '../types';
import { DEMO_ACCOUNTS, generateCryptoHash } from './web3';

// ==========================================
// DEFAULT SEED DATA FOR DEMO & PROTOTYPE
// ==========================================
export const DEFAULT_PROJECTS: Project[] = [
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

// Helper to generate 24-hr diurnal solar curve telemetry points
const generateDiurnalPoints = (totalGen: number = 850, gridLossRatio: number = 0.975): TelemetryDataPoint[] => {
  const now = new Date();
  const points: TelemetryDataPoint[] = [];
  const totalGrid = totalGen * gridLossRatio;

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

const DEFAULT_CLAIMS: Claim[] = [
  {
    id: 1,
    claim_uid: 'CLM-PRJ-SOLAR-BHADLA-01-A4F9',
    project_id: 1,
    project_code: 'PRJ-SOLAR-BHADLA-01',
    project_name: 'Bhadla Solar Phase IV (500 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: new Date(Date.now() - 86400000).toISOString(),
    period_end: new Date().toISOString(),
    vintage_year: 2026,
    requested_mwh: 850.0,
    validated_mwh: 828.8,
    co2_offset_tonnes: 593.42,
    risk_score: 9.2,
    status: 'APPROVED',
    ipfs_cid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    claim_digest: '0x4a8c9b2f183d7e5069a1e0b57f02d4e8b3c9a1d2e3f405162738495a6b7c8d9e',
    oracle_signature: '0x7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901a2b3c4d5e6f7a8b9c0d1e2f3a1b',
    verifier_address: DEMO_ACCOUNTS[1].address,
    verifier_notes: 'Verified against multi-source telemetry and CEA regional baseline models.',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    reviewed_at: new Date(Date.now() - 3600000).toISOString(),
    telemetry_points: generateDiurnalPoints(850, 0.975),
  },
  {
    id: 2,
    claim_uid: 'CLM-PRJ-SOLAR-REWA-02-C7E2',
    project_id: 2,
    project_code: 'PRJ-SOLAR-REWA-02',
    project_name: 'Rewa Ultra Mega Solar Park (250 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: new Date(Date.now() - 86400000).toISOString(),
    period_end: new Date().toISOString(),
    vintage_year: 2026,
    requested_mwh: 420.0,
    validated_mwh: 409.5,
    co2_offset_tonnes: 293.20,
    risk_score: 8.5,
    status: 'PENDING_REVIEW',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    telemetry_points: generateDiurnalPoints(420, 0.975),
  },
  {
    id: 3,
    claim_uid: 'CLM-PRJ-SOLAR-PAVAGADA-03-9B1D',
    project_id: 3,
    project_code: 'PRJ-SOLAR-PAVAGADA-03',
    project_name: 'Pavagada Solar Park (300 MW)',
    corporate_wallet: DEMO_ACCOUNTS[0].address,
    period_start: new Date(Date.now() - 172800000).toISOString(),
    period_end: new Date(Date.now() - 86400000).toISOString(),
    vintage_year: 2026,
    requested_mwh: 510.0,
    validated_mwh: 497.25,
    co2_offset_tonnes: 356.03,
    risk_score: 7.8,
    status: 'MINTED',
    tx_hash: '0x3f5b72e1a90c48d2e8b61a7c5d9f04e28b1a3c7e9f02d4e8b3c9a1d2e3f40516',
    ipfs_cid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    claim_digest: '0x1c8b9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901',
    oracle_signature: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b1c',
    verifier_address: DEMO_ACCOUNTS[1].address,
    verifier_notes: 'Substation meter validated with 0 anomaly index.',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    reviewed_at: new Date(Date.now() - 120000000).toISOString(),
    telemetry_points: generateDiurnalPoints(510, 0.975),
  },
];

const DEFAULT_LISTINGS: MarketplaceListing[] = [
  {
    id: 1,
    listing_id: 1,
    seller_wallet: DEMO_ACCOUNTS[0].address,
    project_type: 'Mega Solar Park',
    project_name: 'Bhadla Solar Phase IV (500 MW)',
    vintage_year: 2026,
    total_amount: 150.0,
    remaining_amount: 120.0,
    unit_price_inr: 1250,
    unit_price_eth: 0.005,
    active: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    tx_hash: '0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
  },
  {
    id: 2,
    listing_id: 2,
    seller_wallet: DEMO_ACCOUNTS[0].address,
    project_type: 'Mega Solar Park',
    project_name: 'Rewa Ultra Mega Solar Park (250 MW)',
    vintage_year: 2026,
    total_amount: 100.0,
    remaining_amount: 85.0,
    unit_price_inr: 1200,
    unit_price_eth: 0.0048,
    active: true,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    tx_hash: '0x42cd0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
  },
  {
    id: 3,
    listing_id: 3,
    seller_wallet: DEMO_ACCOUNTS[0].address,
    project_type: 'Floating Solar',
    project_name: 'Pavagada Floating Solar Park',
    vintage_year: 2026,
    total_amount: 80.0,
    remaining_amount: 60.0,
    unit_price_inr: 1350,
    unit_price_eth: 0.0054,
    active: true,
    created_at: new Date(Date.now() - 21600000).toISOString(),
    tx_hash: '0xef120123456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
  },
];

const DEFAULT_RETIREMENTS: Retirement[] = [
  {
    id: 1,
    certificate_id: '0x9b3c7e1a90c48d2e8b61a7c5d9f04e28b1a3c7e9f02d4e8b3c9a1d2e3f40516',
    burner_wallet: DEMO_ACCOUNTS[2].address,
    corporate_beneficiary: 'Infosys Technologies Ltd',
    reason: 'Scope 2 Clean Energy Neutralization (Q1 2026)',
    amount_tonnes: 45.0,
    tx_hash: '0x2a1b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
    block_number: 18429210,
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    certificate_id: '0x5f1e8b2a3c7e9f02d4e8b3c9a1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5',
    burner_wallet: DEMO_ACCOUNTS[0].address,
    corporate_beneficiary: 'Tata Power Renewable Energy Ltd',
    reason: 'Voluntary Corporate Sustainability Offset',
    amount_tonnes: 30.0,
    tx_hash: '0x7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f90',
    block_number: 18429245,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// Local Storage Helper Store Keys
const STORE_CLAIMS = 'zerotrace_store_claims_v5';
const STORE_LISTINGS = 'zerotrace_store_listings_v5';
const STORE_RETIREMENTS = 'zerotrace_store_retirements_v5';

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
// LIGHTNING-FAST DEMO API SERVICE (0ms latency)
// ==========================================
export const api = {
  // Stats & Platform Health
  getStats: async (): Promise<PlatformStats> => {
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
    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const project = DEFAULT_PROJECTS.find(p => p.id === payload.project_id) || DEFAULT_PROJECTS[0];

    const totalActivePower = payload.data_points.reduce((a, b) => a + b.scada_active_power_mw, 0);
    const totalGridPower = payload.data_points.reduce((a, b) => a + b.grid_export_power_mw, 0);
    const validatedMwh = totalGridPower > 0 ? totalGridPower : totalActivePower * 0.975;
    const credits = validatedMwh * project.grid_emission_factor;

    const newClaim: Claim = {
      id: claims.length + 1,
      claim_uid: `CLM-${project.project_code}-${generateCryptoHash('').slice(2, 6).toUpperCase()}`,
      project_id: project.id,
      project_code: project.project_code,
      project_name: project.name,
      corporate_wallet: payload.corporate_wallet,
      period_start: payload.period_start,
      period_end: payload.period_end,
      vintage_year: payload.vintage_year,
      requested_mwh: parseFloat(totalActivePower.toFixed(2)),
      validated_mwh: parseFloat(validatedMwh.toFixed(2)),
      co2_offset_tonnes: parseFloat(credits.toFixed(2)),
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
    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    return claims.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'FLAGGED');
  },

  getAllClaims: async (wallet?: string, status?: string): Promise<Claim[]> => {
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
    const claims = getStore<Claim[]>(STORE_CLAIMS, DEFAULT_CLAIMS);
    const found = claims.find(c => c.id === id);
    if (!found) throw new Error('Claim not found');
    return found;
  },

  approveClaim: async (id: number, verifierAddress: string, notes?: string): Promise<Claim> => {
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
    const listings = getStore<MarketplaceListing[]>(STORE_LISTINGS, DEFAULT_LISTINGS);
    return listings.filter(l => l.active);
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
      id: listings.length + 1,
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
      if (listings[index].remaining_amount <= 0) {
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
