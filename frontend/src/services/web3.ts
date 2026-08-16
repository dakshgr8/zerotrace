import { ethers } from 'ethers';
import deployedData from '../contracts/deployedAddresses.json';

// Contract Addresses
export const CARBON_TOKEN_ADDRESS = deployedData.contracts.CarbonCreditToken.address;
export const MARKETPLACE_ADDRESS = deployedData.contracts.CarbonMarketplace.address;

// ABIs
export const CARBON_TOKEN_ABI = deployedData.contracts.CarbonCreditToken.abi;
export const MARKETPLACE_ABI = deployedData.contracts.CarbonMarketplace.abi;

// Fixed INR Exchange Rate for on-chain settlement: 1 ETH = ₹2,50,000 INR
export const INR_PER_ETH = 250000;

export const inrToEth = (inr: number): number => {
  return inr / INR_PER_ETH;
};

export const ethToInr = (eth: number): number => {
  return eth * INR_PER_ETH;
};

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Standard demo test accounts on local Hardhat node
export const DEMO_ACCOUNTS = [
  {
    name: 'Tata Power (Energy Producer)',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x47e179ec197488593b10d2d318b6828f6b0d45da7a05ece92a3f779ac00ffb42',
    role: 'CORPORATE' as const,
  },
  {
    name: 'Bureau Veritas (Independent Auditor)',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
    role: 'VERIFIER' as const,
  },
  {
    name: 'Corporate ESG Carbon Buyer',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
    role: 'BUYER' as const,
  },
];

export class Web3Service {
  private rpcUrl = 'http://127.0.0.1:8545';

  getProvider(): ethers.Provider {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return new ethers.BrowserProvider((window as any).ethereum);
    }
    return new ethers.JsonRpcProvider(this.rpcUrl);
  }

  getSigner(customPrivateKey?: string): ethers.Signer | Promise<ethers.Signer> {
    if (customPrivateKey) {
      const rpcProvider = new ethers.JsonRpcProvider(this.rpcUrl);
      return new ethers.Wallet(customPrivateKey, rpcProvider);
    }
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return provider.getSigner();
    }
    // Fallback: Default demo corporate signer
    const rpcProvider = new ethers.JsonRpcProvider(this.rpcUrl);
    return new ethers.Wallet(DEMO_ACCOUNTS[0].privateKey, rpcProvider);
  }

  getCarbonTokenContract(signerOrProvider: ethers.Signer | ethers.Provider) {
    return new ethers.Contract(CARBON_TOKEN_ADDRESS, CARBON_TOKEN_ABI, signerOrProvider);
  }

  getMarketplaceContract(signerOrProvider: ethers.Signer | ethers.Provider) {
    return new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signerOrProvider);
  }

  async getTokenBalance(account: string): Promise<string> {
    try {
      const provider = this.getProvider();
      const contract = this.getCarbonTokenContract(provider);
      const bal = await contract.balanceOf(account);
      return ethers.formatEther(bal);
    } catch (e) {
      console.warn('Failed to fetch balance from chain:', e);
      return '0.0';
    }
  }

  async getInrBalance(account: string): Promise<number> {
    try {
      const provider = this.getProvider();
      const bal = await provider.getBalance(account);
      const ethVal = parseFloat(ethers.formatEther(bal));
      
      const lower = account.toLowerCase();
      // Role 1: Tata Power (Energy Producer) - Revenue Account
      if (lower === DEMO_ACCOUNTS[0].address.toLowerCase()) {
        const delta = (ethVal - 10000) * INR_PER_ETH;
        return Math.max(0, Math.round(1500000 + delta));
      }
      // Role 2: Bureau Veritas (Independent Auditor) - Gas & Audit Stipend
      else if (lower === DEMO_ACCOUNTS[1].address.toLowerCase()) {
        const delta = (ethVal - 10000) * INR_PER_ETH;
        return Math.max(0, Math.round(250000 + delta));
      }
      // Role 3: Corporate ESG Buyer - Procurement & Offset Treasury
      else if (lower === DEMO_ACCOUNTS[2].address.toLowerCase()) {
        const delta = (ethVal - 10000) * INR_PER_ETH;
        return Math.max(0, Math.round(5000000 + delta));
      }
      return Math.round(ethVal * INR_PER_ETH);
    } catch (e) {
      const lower = account.toLowerCase();
      if (lower === DEMO_ACCOUNTS[1].address.toLowerCase()) return 250000;
      if (lower === DEMO_ACCOUNTS[2].address.toLowerCase()) return 5000000;
      return 1500000;
    }
  }

  async getEthBalance(account: string): Promise<string> {
    try {
      const provider = this.getProvider();
      const bal = await provider.getBalance(account);
      return ethers.formatEther(bal);
    } catch (e) {
      return '0.0';
    }
  }

  async mintWithVerification(
    corporateWallet: string,
    amountZTC: number,
    claimDigest: string,
    signature: string,
    signerKey?: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    const signer = await this.getSigner(signerKey);
    const contract = this.getCarbonTokenContract(signer);
    
    // Format float number cleanly to avoid JS floating-point precision artifacts
    const amountStr = typeof amountZTC === 'number' ? amountZTC.toFixed(4).replace(/\.?0+$/, '') : String(amountZTC);
    const amountWei = ethers.parseEther(amountStr);

    const tx = await contract.mintWithVerification(corporateWallet, amountWei, claimDigest, signature);
    const receipt = await tx.wait();
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  }

  async burnForOffset(
    amountZTC: number,
    beneficiary: string,
    reason: string,
    signerKey?: string
  ): Promise<{ txHash: string; certificateId: string; blockNumber: number }> {
    const signer = await this.getSigner(signerKey);
    const contract = this.getCarbonTokenContract(signer);
    const amountWei = ethers.parseEther(amountZTC.toString());

    const tx = await contract.burnForOffset(amountWei, beneficiary, reason);
    const receipt = await tx.wait();

    let certId = '';
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'CarbonRetired') {
          certId = parsed.args.certificateId;
          break;
        }
      } catch {}
    }

    if (!certId) {
      certId = ethers.keccak256(ethers.toUtf8Bytes(`${beneficiary}-${amountZTC}-${Date.now()}`));
    }

    return {
      txHash: receipt.hash,
      certificateId: certId,
      blockNumber: receipt.blockNumber,
    };
  }

  async listCreditsOnMarketplace(
    amountZTC: number,
    unitPriceINR: number,
    vintageYear: number,
    projectType: string,
    signerKey?: string
  ): Promise<{ txHash: string; listingId: number }> {
    const signer = await this.getSigner(signerKey);
    const tokenContract = this.getCarbonTokenContract(signer);
    const marketplaceContract = this.getMarketplaceContract(signer);

    const amountWei = ethers.parseEther(amountZTC.toString());
    const unitPriceETH = inrToEth(unitPriceINR);
    const unitPriceWei = ethers.parseEther(unitPriceETH.toFixed(18));

    // 1. Approve Marketplace
    const approveTx = await tokenContract.approve(MARKETPLACE_ADDRESS, amountWei);
    await approveTx.wait();

    // 2. List credits
    const tx = await marketplaceContract.listCredits(amountWei, unitPriceWei, vintageYear, projectType);
    const receipt = await tx.wait();

    let listingId = 1;
    for (const log of receipt.logs) {
      try {
        const parsed = marketplaceContract.interface.parseLog(log);
        if (parsed && parsed.name === 'CreditListed') {
          listingId = Number(parsed.args.listingId);
          break;
        }
      } catch {}
    }

    return { txHash: receipt.hash, listingId };
  }

  async buyCreditsFromMarketplace(
    listingId: number,
    amountZTC: number,
    unitPriceINR: number,
    signerKey?: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    const signer = await this.getSigner(signerKey);
    const marketplaceContract = this.getMarketplaceContract(signer);

    const amountWei = ethers.parseEther(amountZTC.toString());
    const totalCostINR = amountZTC * unitPriceINR;
    const totalCostETH = inrToEth(totalCostINR);
    const totalCostWei = ethers.parseEther(totalCostETH.toFixed(18));

    const tx = await marketplaceContract.buyCredits(listingId, amountWei, {
      value: totalCostWei,
    });
    const receipt = await tx.wait();

    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  }

  async cancelListing(listingId: number, signerKey?: string): Promise<{ txHash: string }> {
    const signer = await this.getSigner(signerKey);
    const marketplaceContract = this.getMarketplaceContract(signer);

    const tx = await marketplaceContract.cancelListing(listingId);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }
}

export const web3Service = new Web3Service();
