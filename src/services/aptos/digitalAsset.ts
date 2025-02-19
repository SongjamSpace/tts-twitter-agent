import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";

const APTOS_NETWORK: Network = Network.TESTNET;

const aptos = new Aptos(
  new AptosConfig({
    network: APTOS_NETWORK,
  })
);

const collectionName = "Voiceprint NFT - Test";
const collectionDescription = "Voiceprint NFT Test on Aptos";
const collectionURI = "";

const deployer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY),
});

export const createCollection = async () => {
  const createCollectionTransaction = await aptos.createCollectionTransaction({
    creator: deployer,
    description: collectionDescription,
    name: collectionName,
    uri: collectionURI,
  });
  const tx = await aptos.signAndSubmitTransaction({
    transaction: createCollectionTransaction,
    signer: deployer,
  });
  const receipt = await aptos.waitForTransaction({
    transactionHash: tx.hash,
  });
  return `https://explorer.aptoslabs.com/txn/${receipt.version}?network=testnet`;
};

export const mintNFT = async (
  description: string,
  name: string,
  uri: string
) => {
  const mintNFTTransaction = await aptos.mintDigitalAssetTransaction({
    creator: deployer,
    collection: collectionName,
    description,
    name,
    uri,
  });
  const tx = await aptos.signAndSubmitTransaction({
    transaction: mintNFTTransaction,
    signer: deployer,
  });
  const receipt = await aptos.waitForTransaction({
    transactionHash: tx.hash,
  });
  return `https://explorer.aptoslabs.com/txn/${receipt.version}?network=testnet`;
};
