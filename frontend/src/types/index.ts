export type UserRole = 'CORPORATE' | 'VERIFIER' | 'BUYER';

export interface User {
  id: number;
  wallet_address: string;
  organization_name: string;
  compliance_registry_id?: string;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: number;
  project_code: string;
  name: string;
  project_type: 'SOLAR' | 'SOLAR_UTILITY' | 'SOLAR_ROOFTOP' | 'FLOATING_SOLAR';
  location: string;
  latitude: number;
  longitude: number;
  peak_capacity_mw: number;
  baseline_cuf: number;
  grid_emission_factor: number;
  methodology_hash?: string;
  created_at: string;
}

export interface ExplainableAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  title: string;
  description: string;
  impact_mwh: number;
}

export interface AIMetrics {
  scada_total_mwh: number;
  grid_export_total_mwh: number;
  disparity_pct: number;
  capacity_utilization_factor: number;
  baseline_expected_cuf: number;
  satellite_correlation_score: number;
  isolation_forest_anomaly_ratio: number;
  recommended_action: string;
}

export interface Claim {
  id: number;
  claim_uid: string;
  corporate_id: number;
  corporate_wallet: string;
  project_id: number;
  project_name?: string;
  project_type?: string;
  vintage_year: number;
  requested_mwh: number;
  validated_mwh: number;
  co2_offset_tonnes: number;
  risk_score: number;
  status: 'PENDING_REVIEW' | 'FLAGGED' | 'APPROVED' | 'MINTED' | 'REJECTED';
  explainable_alerts: ExplainableAlert[];
  ai_metrics?: AIMetrics;
  telemetry_points?: TelemetryDataPoint[];
  ipfs_cid?: string;
  claim_digest?: string;
  oracle_signature?: string;
  verifier_address?: string;
  verifier_notes?: string;
  tx_hash?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface TelemetryDataPoint {
  timestamp: string;
  scada_active_power_mw: number;
  inverter_efficiency_pct: number;
  global_horizontal_irradiance: number; // W/m2 (Pyranometer)
  grid_export_power_mw: number;
  ambient_temp_c?: number;
  cell_temp_c?: number;
  wind_speed_ms?: number;
}

export interface MarketplaceListing {
  id: number;
  listing_id: number;
  seller_wallet: string;
  amount: number;
  remaining_amount: number;
  unit_price_inr: number;
  unit_price_eth?: number;
  vintage_year: number;
  project_type: string;
  project_name?: string;
  active: boolean;
  created_at: string;
}

export interface Retirement {
  id: number;
  certificate_id: string;
  burner_wallet: string;
  corporate_beneficiary: string;
  reason?: string;
  amount_tonnes: number;
  tx_hash: string;
  block_number?: number;
  timestamp: string;
  ipfs_certificate_uri?: string;
}

export interface PlatformStats {
  total_projects: number;
  total_claims: number;
  pending_review: number;
  approved_claims: number;
  minted_claims: number;
  total_validated_mwh: number;
  total_carbon_credits_minted_ztc: number;
  total_retired_offset_tonnes: number;
  oracle_address: string;
}
