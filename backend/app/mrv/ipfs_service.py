"""
ZeroTrace Decentralized IPFS Storage Service
Generates auditable W3C JSON-LD MRV compliance packets and simulates IPFS CID generation
and retrieval for decentralized verification records.
"""

import json
import hashlib
from typing import Dict, Any, Optional, Tuple

# Pure Python Base58 Alphabet for IPFS CIDv0 generation
B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def b58encode(data: bytes) -> str:
    origlen = len(data)
    data = data.lstrip(b'\0')
    newlen = len(data)

    acc = int.from_bytes(data, 'big')
    result = []
    while acc > 0:
        acc, mod = divmod(acc, 58)
        result.append(B58_ALPHABET[mod])

    # Add leading zeros
    pad = (origlen - newlen) * '1'
    return pad + ''.join(reversed(result))

class IPFSService:
    def __init__(self):
        # In-memory storage for mock IPFS nodes
        self._ipfs_store: Dict[str, str] = {}

    def generate_mrv_json_ld(
        self,
        claim_uid: str,
        corporate_wallet: str,
        project: Any,
        batch: Any,
        validated_mwh: float,
        co2_offset_tonnes: float,
        risk_score: float,
        verifier_address: str,
        alerts: list,
        ai_metrics: dict,
    ) -> Dict[str, Any]:
        """
        Builds standard JSON-LD MRV verification report according to W3C Verifiable Credentials
        and UNFCCC / Gold Standard digital MRV schema standards.
        """
        json_ld_packet = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://schema.zerotrace.io/mrv/v1.jsonld"
            ],
            "id": f"urn:zerotrace:mrv:claim:{claim_uid}",
            "type": ["VerifiableCredential", "CarbonMRVCertificate"],
            "issuer": {
                "id": f"did:pkh:eip155:31337:{verifier_address}",
                "name": "ZeroTrace Autonomous AI-MRV Verifier & HITL Oracle",
                "role": "Accredited Independent Verifier"
            },
            "issuanceDate": batch.created_at.isoformat() if hasattr(batch, 'created_at') and batch.created_at else "",
            "credentialSubject": {
                "id": f"did:pkh:eip155:31337:{corporate_wallet}",
                "claimId": claim_uid,
                "project": {
                    "projectCode": project.project_code,
                    "name": project.name,
                    "type": project.project_type.value if hasattr(project.project_type, 'value') else str(project.project_type),
                    "location": project.location,
                    "coordinates": {
                        "latitude": project.latitude,
                        "longitude": project.longitude
                    },
                    "peakCapacityMW": project.peak_capacity_mw,
                    "baselineGridEmissionFactor": project.grid_emission_factor
                },
                "telemetryPeriod": {
                    "start": batch.period_start.isoformat() if hasattr(batch.period_start, 'isoformat') else str(batch.period_start),
                    "end": batch.period_end.isoformat() if hasattr(batch.period_end, 'isoformat') else str(batch.period_end),
                    "dataPointsIngested": batch.data_points_count
                },
                "verificationFindings": {
                    "rawSCADAGenerationMWh": batch.scada_raw_mwh,
                    "gridExportMeterMWh": batch.grid_export_mwh,
                    "conservativelyValidatedMWh": validated_mwh,
                    "eligibleCarbonCreditsZTC": co2_offset_tonnes,
                    "aiRiskScore": risk_score,
                    "verdict": "VERIFIED_COMPLIANT" if risk_score < 60.0 else "CONDITIONAL_APPROVAL"
                },
                "explainableAlerts": alerts,
                "aiTriangulationMetrics": ai_metrics
            }
        }
        return json_ld_packet

    def pin_json(self, data: Dict[str, Any]) -> Tuple[str, str]:
        """
        Simulates IPFS pinning: serializes JSON, generates canonical CIDv0 (Qm...) and Keccak256 digest
        """
        content_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
        raw_bytes = content_str.encode('utf-8')

        # Generate sha256 multihash for IPFS CIDv0: <0x12 (sha256)><0x20 (32 bytes len)><hash>
        sha256_hash = hashlib.sha256(raw_bytes).digest()
        multihash = b'\x12\x20' + sha256_hash
        cid = b58encode(multihash)

        # Keccak256 / SHA256 digest for Solidity smart contract claimDigest
        keccak_digest = hashlib.sha256(raw_bytes).hexdigest()
        solidity_claim_digest = "0x" + keccak_digest

        # Store in local IPFS store
        self._ipfs_store[cid] = content_str

        return cid, solidity_claim_digest

    def get_json(self, cid: str) -> Optional[Dict[str, Any]]:
        """Retrieves pinned JSON content by CID"""
        content_str = self._ipfs_store.get(cid)
        if content_str:
            return json.loads(content_str)
        return None

ipfs_service = IPFSService()
