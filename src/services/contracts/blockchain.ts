import { ethers } from "ethers";

// Example contract write interaction
async function deployAIVoiceNFT(
  voiceName: string,
  nftName: string,
  nftSymbol: string,
  baseUri: string
) {
  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.CHAIN_RPC_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

  // Create contract instance
  const factory = new ethers.Contract(
    process.env.NFT_FACTORY_ADDRESS as string,
    [
      {
        inputs: [
          {
            internalType: "string",
            name: "_voiceName",
            type: "string",
          },
          {
            internalType: "string",
            name: "_name",
            type: "string",
          },
          {
            internalType: "string",
            name: "_symbol",
            type: "string",
          },
          {
            internalType: "string",
            name: "_baseUri",
            type: "string",
          },
        ],
        name: "deployAIVoiceNFT",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    signer
  );

  try {
    console.log("Deploying AIVoiceNFT with voiceName:", voiceName);
    // Send the transaction
    const tx = await factory.deployAIVoiceNFT(
      voiceName,
      nftName,
      nftSymbol,
      baseUri
    );
    console.log("Transaction sent:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Error writing to contract:", error);
    throw error;
  }
}

export { deployAIVoiceNFT };
