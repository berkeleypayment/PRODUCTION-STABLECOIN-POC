import { ethers } from "ethers";

// USDC contract address on Base Mainnet (fixed, do not change)
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

/**
 * Transfer USDC on Base from sender's wallet (private key) to recipient address.
 * Returns the transaction hash once confirmed on-chain.
 */
export async function transferUSDC(params: {
  senderPrivateKey: string;
  recipientAddress: string;
  amountUsd: string; // dollar amount as string, e.g. "10.50"
}): Promise<{ txHash: string; blockNumber: number }> {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL?.trim());
  const signer = new ethers.Wallet(params.senderPrivateKey.trim(), provider);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

  const amount = ethers.parseUnits(params.amountUsd, 6); // USDC has 6 decimals
  const tx = await usdc.transfer(params.recipientAddress.trim(), amount);
  const receipt = await tx.wait();

  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
}
