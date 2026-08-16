import { Project, Claim, MarketplaceListing, Retirement, PlatformStats, TelemetryDataPoint } from '../types';

const API_BASE = '/api';

export const api = {
  // Stats & Health
  getStats: async (): Promise<PlatformStats> => {
    const res = await fetch(`${API_BASE}/mrv/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
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
    const res = await fetch(`${API_BASE}/telemetry/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Ingestion failed' }));
      throw new Error(err.detail || 'Failed to ingest telemetry');
    }
    return res.json();
  },

  // Claims
  getPendingClaims: async (): Promise<Claim[]> => {
    const res = await fetch(`${API_BASE}/mrv/pending-claims`);
    if (!res.ok) throw new Error('Failed to fetch pending claims');
    return res.json();
  },

  getAllClaims: async (wallet?: string, status?: string): Promise<Claim[]> => {
    const params = new URLSearchParams();
    if (wallet) params.append('corporate_wallet', wallet);
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/mrv/claims?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch claims');
    return res.json();
  },

  getClaim: async (id: number): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/mrv/claims/${id}`);
    if (!res.ok) throw new Error('Failed to fetch claim details');
    return res.json();
  },

  approveClaim: async (id: number, verifierAddress: string, notes?: string): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/mrv/approve-claim/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifier_address: verifierAddress,
        verifier_notes: notes || 'Verified against multi-source telemetry and CEA regional baseline models.',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Approval failed' }));
      throw new Error(err.detail || 'Failed to approve claim');
    }
    return res.json();
  },

  rejectClaim: async (id: number, verifierAddress: string, reason: string): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/mrv/reject-claim/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifier_address: verifierAddress,
        reason,
      }),
    });
    if (!res.ok) throw new Error('Failed to reject claim');
    return res.json();
  },

  confirmMint: async (id: number, txHash: string): Promise<Claim> => {
    const res = await fetch(`${API_BASE}/mrv/confirm-mint/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx_hash: txHash }),
    });
    if (!res.ok) throw new Error('Failed to confirm mint');
    return res.json();
  },

  getIPFSReport: async (cid: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/mrv/ipfs/${cid}`);
    if (!res.ok) throw new Error('Failed to fetch IPFS document');
    return res.json();
  },

  // Marketplace
  getListings: async (): Promise<MarketplaceListing[]> => {
    const res = await fetch(`${API_BASE}/marketplace/listings`);
    if (!res.ok) throw new Error('Failed to fetch listings');
    return res.json();
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
    const res = await fetch(`${API_BASE}/marketplace/sync-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: payload.listing_id,
        seller_wallet: payload.seller_wallet,
        amount: payload.amount || payload.total_amount,
        remaining_amount: payload.remaining_amount !== undefined ? payload.remaining_amount : (payload.amount || payload.total_amount),
        unit_price_inr: payload.unit_price_inr || 1250.0,
        unit_price_eth: payload.unit_price_eth || 0.005,
        vintage_year: payload.vintage_year || 2026,
        project_type: payload.project_type || 'Solar Utility',
        project_name: payload.project_name || 'Renewable Asset',
      }),
    });
    if (!res.ok) throw new Error('Failed to sync listing');
    return res.json();
  },

  createListing: async (payload: any): Promise<MarketplaceListing> => {
    return api.syncListing(payload);
  },

  syncPurchase: async (listingId: number, amount: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/marketplace/sync-purchase/${listingId}?amount=${amount}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to sync purchase');
    return res.json();
  },

  syncCancel: async (listingId: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/marketplace/sync-cancel/${listingId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to sync cancel');
    return res.json();
  },

  // Retirements
  getRetirements: async (): Promise<Retirement[]> => {
    const res = await fetch(`${API_BASE}/retirements`);
    if (!res.ok) throw new Error('Failed to fetch retirements');
    return res.json();
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
    const res = await fetch(`${API_BASE}/retirements/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to record retirement');
    return res.json();
  },
};
