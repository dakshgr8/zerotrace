import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ZeroTrace AI-MRV & Carbon Credit Platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zerotrace.db")
    
    # Cryptographic Oracle Verifier Key
    # Default Hardhat account #1 (Verifier Oracle): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    ORACLE_PRIVATE_KEY: str = os.getenv(
        "ORACLE_PRIVATE_KEY", 
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    )
    ORACLE_ADDRESS: str = os.getenv(
        "ORACLE_ADDRESS", 
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    )
    
    # Web3 / EVM RPC
    EVM_RPC_URL: str = os.getenv("EVM_RPC_URL", "http://127.0.0.1:8545")
    CHAIN_ID: int = int(os.getenv("CHAIN_ID", "31337"))
    
    # Carbon Token & Marketplace Contracts (Auto-detected from deployment artifacts if not specified in env)
    CARBON_TOKEN_ADDRESS: str = os.getenv("CARBON_TOKEN_ADDRESS", "")
    MARKETPLACE_ADDRESS: str = os.getenv("MARKETPLACE_ADDRESS", "")
    
    # Standard Grid Emission Baseline Factors (CEA India Default: ~0.716 tCO2/MWh)
    DEFAULT_GRID_EMISSION_FACTOR: float = 0.716

def _resolve_settings() -> Settings:
    s = Settings()
    if not s.CARBON_TOKEN_ADDRESS or not s.MARKETPLACE_ADDRESS:
        import json
        # Try finding deployed contract addresses
        current_dir = os.path.dirname(os.path.abspath(__file__))
        candidate_paths = [
            os.path.abspath(os.path.join(current_dir, "..", "..", "contracts", "deployments.json")),
            os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "src", "contracts", "deployedAddresses.json")),
        ]
        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        data = json.load(f)
                        contracts = data.get("contracts", {})
                        if not s.CARBON_TOKEN_ADDRESS and "CarbonCreditToken" in contracts:
                            s.CARBON_TOKEN_ADDRESS = contracts["CarbonCreditToken"]["address"]
                        if not s.MARKETPLACE_ADDRESS and "CarbonMarketplace" in contracts:
                            s.MARKETPLACE_ADDRESS = contracts["CarbonMarketplace"]["address"]
                        break
                except Exception as e:
                    pass
    return s

settings = _resolve_settings()
