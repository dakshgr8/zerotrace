// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title CarbonCreditToken
 * @dev Production-grade ERC20 Token for Verified Carbon Units (VCU) with EIP-712 / ECDSA Oracle verification
 *      and permanent burn-for-offset mechanics.
 */
contract CarbonCreditToken is ERC20, Ownable, EIP712 {
    using ECDSA for bytes32;

    // Authorized HITL Verifier / Cryptographic Oracle address
    address public oracleSigner;

    // Replay attack prevention mapping for verified claims
    mapping(bytes32 => bool) public executedClaims;

    // Total metric tons of CO2 offset retired permanently
    uint256 public totalRetiredCredits;

    // Struct for storing retirement audit records
    struct RetirementCertificate {
        bytes32 certificateId;
        address burner;
        string corporateBeneficiary;
        string reason;
        uint256 amount;
        uint256 timestamp;
    }

    // Mapping from certificateId to Retirement details
    mapping(bytes32 => RetirementCertificate) public certificates;
    bytes32[] public certificateIds;

    // Project metadata registry
    struct ProjectMetadata {
        string projectId;
        uint256 vintageYear;
        string location;
        string methodologyHash;
    }
    mapping(string => ProjectMetadata) public projectRegistry;

    // EIP-712 TypeHash for Claim Minting
    bytes32 public constant MINT_CLAIM_TYPEHASH = keccak256(
        "MintVerification(address corporate,uint256 amount,bytes32 claimDigest)"
    );

    // Events
    event OracleSignerUpdated(address indexed previousSigner, address indexed newSigner);
    event CarbonMinted(
        address indexed corporate,
        uint256 amount,
        bytes32 indexed claimDigest,
        address indexed verifier
    );
    event CarbonRetired(
        address indexed burner,
        string corporateBeneficiary,
        uint256 amount,
        uint256 timestamp,
        bytes32 indexed certificateId
    );
    event ProjectRegistered(
        string indexed projectId,
        uint256 vintageYear,
        string location,
        string methodologyHash
    );

    /**
     * @dev Constructor initializes the ERC20 token and sets up EIP-712 domain separator
     */
    constructor(
        address _oracleSigner,
        address _initialOwner
    ) 
        ERC20("ZeroTrace Verified Carbon Unit", "ZTC") 
        EIP712("ZeroTrace MRV Oracle", "1")
        Ownable(_initialOwner)
    {
        require(_oracleSigner != address(0), "Invalid oracle address");
        oracleSigner = _oracleSigner;
    }

    /**
     * @notice Updates the authorized Oracle Signer
     * @param _newSigner New oracle signer address
     */
    function setOracleSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid oracle address");
        emit OracleSignerUpdated(oracleSigner, _newSigner);
        oracleSigner = _newSigner;
    }

    /**
     * @notice Register project methodology and metadata
     */
    function registerProject(
        string memory projectId,
        uint256 vintageYear,
        string memory location,
        string memory methodologyHash
    ) external onlyOwner {
        projectRegistry[projectId] = ProjectMetadata({
            projectId: projectId,
            vintageYear: vintageYear,
            location: location,
            methodologyHash: methodologyHash
        });
        emit ProjectRegistered(projectId, vintageYear, location, methodologyHash);
    }

    /**
     * @notice Mint carbon credits with cryptographic oracle / HITL signature verification
     * @param corporate Corporate beneficiary wallet receiving the minted credits
     * @param amount Number of carbon credit units to mint (in 18 decimals)
     * @param claimDigest Unique hash of the telemetry batch and verification report (e.g. IPFS CID hash)
     * @param signature Cryptographic ECDSA signature from the authorized oracle signer
     */
    function mintWithVerification(
        address corporate,
        uint256 amount,
        bytes32 claimDigest,
        bytes calldata signature
    ) external {
        require(corporate != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(!executedClaims[claimDigest], "Claim already executed / replayed");

        // Recover signer from EIP-712 typed data or standard signed message hash
        bytes32 structHash = keccak256(
            abi.encode(MINT_CLAIM_TYPEHASH, corporate, amount, claimDigest)
        );
        bytes32 typedDigest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(typedDigest, signature);

        // Fallback check: if EIP-712 didn't match, verify standard eth_sign hash
        if (recoveredSigner != oracleSigner) {
            bytes32 ethSignedDigest = MessageHashUtils.toEthSignedMessageHash(
                keccak256(abi.encodePacked(corporate, amount, claimDigest))
            );
            recoveredSigner = ECDSA.recover(ethSignedDigest, signature);
        }

        require(recoveredSigner == oracleSigner, "Invalid verifier signature");

        // Mark claim as executed to prevent replay attacks
        executedClaims[claimDigest] = true;

        // Mint verified carbon units directly to corporate
        _mint(corporate, amount);

        emit CarbonMinted(corporate, amount, claimDigest, recoveredSigner);
    }

    /**
     * @notice Permanently burn credits for corporate ESG / compliance offset and generate certificate
     * @param amount Amount of carbon credit tokens to retire (in 18 decimals)
     * @param corporateBeneficiary Name / identifier of the corporate entity claiming the offset
     * @param reason Purpose of retirement (e.g. "FY2026 Scope 1 & 2 Neutralization")
     * @return certificateId Unique bytes32 identifier of the on-chain retirement certificate
     */
    function burnForOffset(
        uint256 amount,
        string memory corporateBeneficiary,
        string memory reason
    ) external returns (bytes32 certificateId) {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance to burn");
        require(bytes(corporateBeneficiary).length > 0, "Beneficiary name required");

        // Permanently burn tokens from caller balance
        _burn(msg.sender, amount);

        // Compute unique certificate ID
        certificateId = keccak256(
            abi.encodePacked(
                msg.sender,
                corporateBeneficiary,
                amount,
                block.timestamp,
                totalRetiredCredits
            )
        );

        // Store retirement certificate
        certificates[certificateId] = RetirementCertificate({
            certificateId: certificateId,
            burner: msg.sender,
            corporateBeneficiary: corporateBeneficiary,
            reason: reason,
            amount: amount,
            timestamp: block.timestamp
        });
        certificateIds.push(certificateId);

        totalRetiredCredits += amount;

        emit CarbonRetired(
            msg.sender,
            corporateBeneficiary,
            amount,
            block.timestamp,
            certificateId
        );

        return certificateId;
    }

    /**
     * @notice Get total number of retirement certificates generated
     */
    function getCertificateCount() external view returns (uint256) {
        return certificateIds.length;
    }

    /**
     * @notice Retrieve certificate details by certificateId
     */
    function getCertificate(bytes32 _certificateId) external view returns (RetirementCertificate memory) {
        require(certificates[_certificateId].timestamp > 0, "Certificate not found");
        return certificates[_certificateId];
    }
}
