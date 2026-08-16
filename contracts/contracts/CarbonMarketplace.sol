// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonMarketplace
 * @dev High-security Peer-to-Peer Escrow & Trading Engine for ZeroTrace Carbon Credits (ZTC).
 *      Supports atomic purchases with native currency or settlement tokens, partial fills,
 *      and transparent order book event emission.
 */
contract CarbonMarketplace is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable carbonToken;

    // Optional fee recipient & fee basis points (e.g. 50 = 0.5%)
    address public feeRecipient;
    uint256 public feeBasisPoints = 0; // 0 for zero-fee enterprise mode

    struct Listing {
        uint256 listingId;
        address seller;
        uint256 amount;          // Total original listed amount (in 18 decimals)
        uint256 remainingAmount; // Remaining available credits (in 18 decimals)
        uint256 unitPrice;       // Price per 1 credit (1e18) in wei (ETH)
        uint256 vintageYear;
        string projectType;
        bool active;
        uint256 createdAt;
    }

    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    // Events
    event CreditListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 amount,
        uint256 unitPrice,
        uint256 vintageYear,
        string projectType,
        uint256 timestamp
    );
    event ListingCancelled(uint256 indexed listingId, address indexed seller, uint256 remainingAmount);
    event CreditPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 totalCost,
        uint256 remainingAmount
    );
    event FeeConfigUpdated(address indexed feeRecipient, uint256 feeBasisPoints);

    constructor(address _carbonToken, address _initialOwner) Ownable(_initialOwner) {
        require(_carbonToken != address(0), "Invalid token address");
        carbonToken = IERC20(_carbonToken);
        feeRecipient = _initialOwner;
    }

    /**
     * @notice Set marketplace protocol fee
     */
    function setFeeConfig(address _feeRecipient, uint256 _feeBasisPoints) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_feeBasisPoints <= 500, "Fee cannot exceed 5%");
        feeRecipient = _feeRecipient;
        feeBasisPoints = _feeBasisPoints;
        emit FeeConfigUpdated(_feeRecipient, _feeBasisPoints);
    }

    /**
     * @notice List carbon credits for sale on the marketplace
     * @param amount Amount of carbon tokens to sell (in 18 decimals)
     * @param unitPrice Price per 1.0 token in wei (ETH)
     * @param vintageYear Vintage year of the carbon credit (e.g. 2026)
     * @param projectType Project category (e.g. "Solar Utility", "Wind Onshore")
     * @return listingId The newly generated listing identifier
     */
    function listCredits(
        uint256 amount,
        uint256 unitPrice,
        uint256 vintageYear,
        string memory projectType
    ) external nonReentrant returns (uint256 listingId) {
        require(amount > 0, "Amount must be greater than zero");
        require(unitPrice > 0, "Unit price must be greater than zero");

        // Transfer tokens into marketplace escrow
        carbonToken.safeTransferFrom(msg.sender, address(this), amount);

        listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            amount: amount,
            remainingAmount: amount,
            unitPrice: unitPrice,
            vintageYear: vintageYear,
            projectType: projectType,
            active: true,
            createdAt: block.timestamp
        });

        emit CreditListed(
            listingId,
            msg.sender,
            amount,
            unitPrice,
            vintageYear,
            projectType,
            block.timestamp
        );

        return listingId;
    }

    /**
     * @notice Cancel an active listing and recover unsold carbon credits from escrow
     * @param listingId Identifier of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(
            msg.sender == listing.seller || msg.sender == owner(),
            "Not authorized to cancel listing"
        );

        uint256 remaining = listing.remainingAmount;
        listing.active = false;
        listing.remainingAmount = 0;

        if (remaining > 0) {
            carbonToken.safeTransfer(listing.seller, remaining);
        }

        emit ListingCancelled(listingId, listing.seller, remaining);
    }

    /**
     * @notice Buy carbon credits from an active listing using native currency (ETH)
     * @param listingId Listing ID to purchase from
     * @param amount Amount of carbon tokens to buy (in 18 decimals)
     */
    function buyCredits(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing is not active");
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= listing.remainingAmount, "Requested amount exceeds available inventory");

        // Calculate total cost: (amount * unitPrice) / 1e18
        uint256 totalCost = (amount * listing.unitPrice) / 1e18;
        require(msg.value >= totalCost, "Insufficient payment sent");

        // Update listing inventory state
        listing.remainingAmount -= amount;
        if (listing.remainingAmount == 0) {
            listing.active = false;
        }

        // Calculate platform fee and seller payout
        uint256 feeAmount = (totalCost * feeBasisPoints) / 10000;
        uint256 sellerPayout = totalCost - feeAmount;

        // Pay seller
        (bool sellerPaid, ) = payable(listing.seller).call{value: sellerPayout}("");
        require(sellerPaid, "Failed to send payment to seller");

        // Pay platform fee if applicable
        if (feeAmount > 0) {
            (bool feePaid, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feePaid, "Failed to send fee to recipient");
        }

        // Refund excess ETH if buyer overpaid
        uint256 excessPayment = msg.value - totalCost;
        if (excessPayment > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: excessPayment}("");
            require(refundSuccess, "Failed to refund excess payment");
        }

        // Transfer purchased carbon credits to buyer from escrow
        carbonToken.safeTransfer(msg.sender, amount);

        emit CreditPurchased(
            listingId,
            msg.sender,
            listing.seller,
            amount,
            totalCost,
            listing.remainingAmount
        );
    }

    /**
     * @notice View listing information
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /**
     * @notice Get all active listing IDs
     */
    function getActiveListingsCount() external view returns (uint256 count) {
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active) {
                count++;
            }
        }
        return count;
    }
}
