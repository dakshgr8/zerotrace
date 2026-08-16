const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ZeroTrace CarbonCreditToken & Marketplace Test Suite", function () {
  let token;
  let marketplace;
  let owner, verifierOracle, corporate, buyer, attacker;

  // EIP-712 Domain & Types definition matching the smart contract
  const DOMAIN_NAME = "ZeroTrace MRV Oracle";
  const DOMAIN_VERSION = "1";

  beforeEach(async function () {
    [owner, verifierOracle, corporate, buyer, attacker] = await ethers.getSigners();

    const CarbonCreditTokenFactory = await ethers.getContractFactory("CarbonCreditToken");
    token = await CarbonCreditTokenFactory.deploy(verifierOracle.address, owner.address);
    await token.waitForDeployment();

    const CarbonMarketplaceFactory = await ethers.getContractFactory("CarbonMarketplace");
    marketplace = await CarbonMarketplaceFactory.deploy(await token.getAddress(), owner.address);
    await marketplace.waitForDeployment();
  });

  describe("Token Deployment & Metadata Configuration", function () {
    it("should initialize token with correct name, symbol, and decimals", async function () {
      expect(await token.name()).to.equal("ZeroTrace Verified Carbon Unit");
      expect(await token.symbol()).to.equal("ZTC");
      expect(await token.decimals()).to.equal(18n);
      expect(await token.oracleSigner()).to.equal(verifierOracle.address);
    });

    it("should allow owner to register project metadata", async function () {
      const tx = await token.registerProject(
        "PRJ-SOLAR-001",
        2026,
        "Rajasthan, India (26.9124 N, 75.7873 E)",
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      );
      await expect(tx)
        .to.emit(token, "ProjectRegistered")
        .withArgs(
          "PRJ-SOLAR-001",
          2026,
          "Rajasthan, India (26.9124 N, 75.7873 E)",
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
        );

      const prj = await token.projectRegistry("PRJ-SOLAR-001");
      expect(prj.projectId).to.equal("PRJ-SOLAR-001");
      expect(prj.vintageYear).to.equal(2026n);
    });
  });

  describe("Cryptographic Oracle Minting (EIP-712 & ECDSA)", function () {
    async function createTypedSignature(signer, corporateAddress, amount, claimDigest) {
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: chainId,
        verifyingContract: await token.getAddress(),
      };

      const types = {
        MintVerification: [
          { name: "corporate", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "claimDigest", type: "bytes32" },
        ],
      };

      const value = {
        corporate: corporateAddress,
        amount: amount,
        claimDigest: claimDigest,
      };

      return await signer.signTypedData(domain, types, value);
    }

    it("should successfully mint tokens when valid oracle signature is provided", async function () {
      const mintAmount = ethers.parseEther("150.5");
      const claimDigest = ethers.keccak256(ethers.toUtf8Bytes("IPFS-CID-QmXyzMRVReportBatch001"));

      const signature = await createTypedSignature(
        verifierOracle,
        corporate.address,
        mintAmount,
        claimDigest
      );

      const tx = await token.connect(corporate).mintWithVerification(
        corporate.address,
        mintAmount,
        claimDigest,
        signature
      );

      await expect(tx)
        .to.emit(token, "CarbonMinted")
        .withArgs(corporate.address, mintAmount, claimDigest, verifierOracle.address);

      expect(await token.balanceOf(corporate.address)).to.equal(mintAmount);
      expect(await token.executedClaims(claimDigest)).to.be.true;
    });

    it("should reject forged signatures from non-authorized verifiers", async function () {
      const mintAmount = ethers.parseEther("100");
      const claimDigest = ethers.keccak256(ethers.toUtf8Bytes("ForgedClaim001"));

      // Signed by attacker instead of verifierOracle
      const signature = await createTypedSignature(
        attacker,
        corporate.address,
        mintAmount,
        claimDigest
      );

      await expect(
        token.connect(corporate).mintWithVerification(
          corporate.address,
          mintAmount,
          claimDigest,
          signature
        )
      ).to.be.revertedWith("Invalid verifier signature");
    });

    it("should prevent replay attacks using the same claimDigest", async function () {
      const mintAmount = ethers.parseEther("50");
      const claimDigest = ethers.keccak256(ethers.toUtf8Bytes("SingleUseClaimDigest"));

      const signature = await createTypedSignature(
        verifierOracle,
        corporate.address,
        mintAmount,
        claimDigest
      );

      // First mint succeeds
      await token.connect(corporate).mintWithVerification(
        corporate.address,
        mintAmount,
        claimDigest,
        signature
      );

      // Replay attempt fails
      await expect(
        token.connect(corporate).mintWithVerification(
          corporate.address,
          mintAmount,
          claimDigest,
          signature
        )
      ).to.be.revertedWith("Claim already executed / replayed");
    });
  });

  describe("Burn For Offset & Permanent Retirement", function () {
    beforeEach(async function () {
      const mintAmount = ethers.parseEther("200");
      const claimDigest = ethers.keccak256(ethers.toUtf8Bytes("BatchRetirementTest"));
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: chainId,
        verifyingContract: await token.getAddress(),
      };

      const types = {
        MintVerification: [
          { name: "corporate", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "claimDigest", type: "bytes32" },
        ],
      };

      const signature = await verifierOracle.signTypedData(domain, types, {
        corporate: corporate.address,
        amount: mintAmount,
        claimDigest: claimDigest,
      });

      await token.connect(corporate).mintWithVerification(
        corporate.address,
        mintAmount,
        claimDigest,
        signature
      );
    });

    it("should burn tokens and generate an on-chain retirement certificate", async function () {
      const burnAmount = ethers.parseEther("75");
      const beneficiary = "Acme Corp International";
      const reason = "FY2026 Scope 1 Neutralization";

      const tx = await token.connect(corporate).burnForOffset(burnAmount, beneficiary, reason);
      const receipt = await tx.wait();

      expect(await token.balanceOf(corporate.address)).to.equal(ethers.parseEther("125"));
      expect(await token.totalRetiredCredits()).to.equal(burnAmount);
      expect(await token.getCertificateCount()).to.equal(1n);

      // Find the CarbonRetired event
      const event = receipt.logs
        .map((log) => {
          try {
            return token.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "CarbonRetired");

      expect(event).to.not.be.undefined;
      expect(event.args.burner).to.equal(corporate.address);
      expect(event.args.corporateBeneficiary).to.equal(beneficiary);
      expect(event.args.amount).to.equal(burnAmount);

      const certId = event.args.certificateId;
      const cert = await token.getCertificate(certId);
      expect(cert.corporateBeneficiary).to.equal(beneficiary);
      expect(cert.amount).to.equal(burnAmount);
    });

    it("should revert if user attempts to burn more than their available balance", async function () {
      const excessiveAmount = ethers.parseEther("500");
      await expect(
        token.connect(corporate).burnForOffset(excessiveAmount, "Acme Corp", "Test")
      ).to.be.revertedWith("Insufficient token balance to burn");
    });
  });

  describe("Carbon Marketplace Escrow & Trading Engine", function () {
    beforeEach(async function () {
      // Mint 100 ZTC to seller (corporate)
      const mintAmount = ethers.parseEther("100");
      const claimDigest = ethers.keccak256(ethers.toUtf8Bytes("MarketplaceSeedBatch"));
      const chainId = (await ethers.provider.getNetwork()).chainId;

      const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: chainId,
        verifyingContract: await token.getAddress(),
      };

      const types = {
        MintVerification: [
          { name: "corporate", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "claimDigest", type: "bytes32" },
        ],
      };

      const signature = await verifierOracle.signTypedData(domain, types, {
        corporate: corporate.address,
        amount: mintAmount,
        claimDigest: claimDigest,
      });

      await token.connect(corporate).mintWithVerification(
        corporate.address,
        mintAmount,
        claimDigest,
        signature
      );

      // Approve marketplace contract to spend tokens
      await token.connect(corporate).approve(await marketplace.getAddress(), ethers.MaxUint256);
    });

    it("should allow a corporate seller to list carbon credits into escrow", async function () {
      const listAmount = ethers.parseEther("50");
      const unitPrice = ethers.parseEther("0.02"); // 0.02 ETH per ZTC

      const tx = await marketplace.connect(corporate).listCredits(
        listAmount,
        unitPrice,
        2026,
        "Solar Utility"
      );

      await expect(tx)
        .to.emit(marketplace, "CreditListed");

      // Escrow balance verification
      expect(await token.balanceOf(await marketplace.getAddress())).to.equal(listAmount);
      expect(await token.balanceOf(corporate.address)).to.equal(ethers.parseEther("50"));

      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.true;
      expect(listing.remainingAmount).to.equal(listAmount);
    });

    it("should allow partial and full credit purchases with atomic payment", async function () {
      const listAmount = ethers.parseEther("50");
      const unitPrice = ethers.parseEther("0.01"); // 0.01 ETH per credit

      await marketplace.connect(corporate).listCredits(listAmount, unitPrice, 2026, "Solar Utility");

      // Buy 20 credits: cost = 20 * 0.01 = 0.2 ETH
      const buyAmount = ethers.parseEther("20");
      const totalCost = ethers.parseEther("0.2");

      const sellerInitialEth = await ethers.provider.getBalance(corporate.address);

      await marketplace.connect(buyer).buyCredits(1, buyAmount, { value: totalCost });

      // Check buyer received tokens
      expect(await token.balanceOf(buyer.address)).to.equal(buyAmount);

      // Check listing remaining inventory
      const listingAfterPartial = await marketplace.getListing(1);
      expect(listingAfterPartial.remainingAmount).to.equal(ethers.parseEther("30"));
      expect(listingAfterPartial.active).to.be.true;

      // Check seller received payment
      const sellerFinalEth = await ethers.provider.getBalance(corporate.address);
      expect(sellerFinalEth - sellerInitialEth).to.equal(totalCost);

      // Buy remaining 30 credits: cost = 30 * 0.01 = 0.3 ETH
      const remainingBuyAmount = ethers.parseEther("30");
      const remainingCost = ethers.parseEther("0.3");

      await marketplace.connect(buyer).buyCredits(1, remainingBuyAmount, { value: remainingCost });

      expect(await token.balanceOf(buyer.address)).to.equal(ethers.parseEther("50"));
      const listingFinal = await marketplace.getListing(1);
      expect(listingFinal.remainingAmount).to.equal(0n);
      expect(listingFinal.active).to.be.false;
    });

    it("should refund excess ETH if buyer overpays", async function () {
      const listAmount = ethers.parseEther("10");
      const unitPrice = ethers.parseEther("0.05"); // 0.05 ETH per credit

      await marketplace.connect(corporate).listCredits(listAmount, unitPrice, 2026, "Wind Onshore");

      const buyAmount = ethers.parseEther("10");
      const actualCost = ethers.parseEther("0.5");
      const overpayment = ethers.parseEther("1.0");

      const buyerInitialEth = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyCredits(1, buyAmount, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerFinalEth = await ethers.provider.getBalance(buyer.address);
      // Buyer should only have spent actualCost + gas
      expect(buyerInitialEth - buyerFinalEth - gasUsed).to.equal(actualCost);
    });

    it("should allow seller to cancel an active listing and recover tokens", async function () {
      const listAmount = ethers.parseEther("25");
      const unitPrice = ethers.parseEther("0.02");

      await marketplace.connect(corporate).listCredits(listAmount, unitPrice, 2026, "Solar Utility");

      await expect(marketplace.connect(corporate).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(1n, corporate.address, listAmount);

      expect(await token.balanceOf(corporate.address)).to.equal(ethers.parseEther("100"));
      const listing = await marketplace.getListing(1);
      expect(listing.active).to.be.false;
      expect(listing.remainingAmount).to.equal(0n);
    });
  });
});
