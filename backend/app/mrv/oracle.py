"""
ZeroTrace Cryptographic Oracle & Verifier Signing Engine
Signs authorized mint claims with EIP-712 Typed Data standards using the Oracle's private key.
"""

from typing import Dict, Any, Tuple
from eth_account import Account
from eth_account.messages import encode_typed_data, encode_defunct
from web3 import Web3
from app.config import settings

class CryptographicOracle:
    def __init__(self, private_key: str = None, verifying_contract: str = None, chain_id: int = None):
        self.private_key = private_key or settings.ORACLE_PRIVATE_KEY
        self.account = Account.from_key(self.private_key)
        self.oracle_address = self.account.address
        self.verifying_contract = verifying_contract or settings.CARBON_TOKEN_ADDRESS or "0x0000000000000000000000000000000000000000"
        self.chain_id = chain_id or settings.CHAIN_ID

    def get_oracle_address(self) -> str:
        return self.oracle_address

    def sign_mint_authorization(
        self,
        corporate_wallet: str,
        amount_ztc: float,
        claim_digest: str,
        verifying_contract: str = None,
        chain_id: int = None
    ) -> Tuple[str, str]:
        """
        Signs an EIP-712 authorization for the corporate wallet to mint `amount_ztc` on-chain.
        Amount is converted to 18 decimal fixed-point integer (wei).
        """
        contract_addr = verifying_contract or self.verifying_contract
        cid = chain_id or self.chain_id

        # Convert float ZTC credits to 18-decimal uint256 integer
        amount_wei = int(round(amount_ztc * 10**18))
        claim_digest_bytes32 = bytes.fromhex(claim_digest[2:] if claim_digest.startswith("0x") else claim_digest)

        # Build EIP-712 structured data dict
        structured_data = {
            "types": {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "version", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"},
                ],
                "MintVerification": [
                    {"name": "corporate", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "claimDigest", "type": "bytes32"},
                ],
            },
            "domain": {
                "name": "ZeroTrace MRV Oracle",
                "version": "1",
                "chainId": cid,
                "verifyingContract": Web3.to_checksum_address(contract_addr) if contract_addr != "0x0000000000000000000000000000000000000000" else "0x0000000000000000000000000000000000000000",
            },
            "primaryType": "MintVerification",
            "message": {
                "corporate": Web3.to_checksum_address(corporate_wallet),
                "amount": amount_wei,
                "claimDigest": claim_digest_bytes32,
            },
        }

        # Encode and sign with EIP-712
        try:
            encoded_data = encode_typed_data(full_message=structured_data)
            signed_message = self.account.sign_message(encoded_data)
            signature = signed_message.signature.hex()
        except Exception:
            # Fallback to standard packed eth_sign digest
            packed_hash = Web3.solidity_keccak(
                ['address', 'uint256', 'bytes32'],
                [Web3.to_checksum_address(corporate_wallet), amount_wei, claim_digest_bytes32]
            )
            signable_msg = encode_defunct(hexstr=packed_hash.hex())
            signed_msg = self.account.sign_message(signable_msg)
            signature = signed_msg.signature.hex()

        if not signature.startswith("0x"):
            signature = "0x" + signature

        return signature, str(amount_wei)

oracle_service = CryptographicOracle()
