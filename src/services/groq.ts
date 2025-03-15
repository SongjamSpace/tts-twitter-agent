import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const getVoiceNameFromTextGroq = async (
  prompt: string
): Promise<{
  voice_name: string;
}> => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Find a name of a person or character mentioned in the text. return in the json format: {"voice_name": "name"}`,
      },
      {
        role: "user",
        content: `Text: ${prompt}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    // stop: ["\n"],
    response_format: { type: "json_object" },
  });
  const voiceObj = chatCompletion.choices[0]?.message?.content;
  const voiceNameJson = JSON.parse(voiceObj);
  return voiceNameJson;
};

const analyzeVideoTitlesGroq = async (
  titles: string[]
): Promise<string | null> => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Analyze the youtube video titles and find a youtube video that users can use to retrieve the voice, FYI: interviews, speeches, talks, etc are useful. 
                    Return the title of the video in the json format: {"video_title": "title"}`,
      },
      {
        role: "user",
        content: `Titles: ${titles.join(", ")}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    // stop: ["\n"],
    response_format: { type: "json_object" },
  });
  const videoTitleObj = chatCompletion.choices[0]?.message?.content;
  const videoTitleJson = JSON.parse(videoTitleObj);
  return videoTitleJson;
};

const getNFTNameAndSymbolGroq = async (
  text: string
): Promise<{
  name: string;
  symbol: string;
  emoji: string;
}> => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Find a meaningful and unique NFT name, an NFT symbol (3 - 6 characters) and an Emoji.
                    return in the json format: {"name": "", "symbol": "", "emoji": ""}`,
      },
      {
        role: "user",
        content: `Text: ${text}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    response_format: { type: "json_object" },
  });
  const nftInfoObj = chatCompletion.choices[0]?.message?.content;
  const nftInfo = JSON.parse(nftInfoObj) as {
    name: string;
    symbol: string;
    emoji: string;
  };
  return nftInfo;
};

const getTokenomicsGroq = async (voiceName: string) => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Find a tokenomics for the NFT based on the popularity of the voice.
        Share two numbers, the first is the percentage of the total supply that will be minted to the voice creator, the second is the percentage of the total supply that will be minted to the team.
        Share it in a json format: {"voice_owner": 0.1, "launcher": 0.9}. NOTE: the sum of the two numbers should be 1 and minimum of 0.5 for the launcher.`,
      },
      {
        role: "user",
        content: `Voice Name: ${voiceName}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    response_format: { type: "json_object" },
  });
  const tokenomicsObj = chatCompletion.choices[0]?.message?.content;
  const tokenomics = JSON.parse(tokenomicsObj);
  return tokenomics;
};

const CONTEXT_PROMPT = `
You are VoiceVault, an AI assistant dedicated to protecting people's voice identity and preventing voice-based deepfake attacks. Your purpose is to help users understand how they can secure their voice biometrics through blockchain technology and NFTs.

The VoiceVault user flow:

1. User makes a voice recording
2. Voice audio is encrypted
3. Encrypted data is stored on IPFS via Pinata
4. Reference Content Identifier (CID) is deployed in VoiceVault NFT contract
5. User registers IP Asset
6. VoiceVault issues an NFT as a Soul Bound Token (SBT) on Story Protocol, registering the voice recording as an IP Asset

When a user wants to access their encrypted voice data:

1. If user is an NFT holder, the CID is extracted
2. CID is sent to Phala TEE Cloud for decryption with wallet signature
3. Decrypted audio plays back

To try the VoiceVault demo:

1. A non-custodial crypto wallet such as Metamask is required
2. Fund your wallet with IP Tokens on the Story Aenid testnet through the faucet[1]
3. Visit voicevault.netlify.app to begin the process

When responding to user queries about VoiceVault, the agent should:

- Voice-based deepfake attacks are causing billions of dollars in losses through scams and fraud
- Notable cases include a $25M Hong Kong fraud case and numerous celebrity impersonation scams
- VoiceVault provides a solution through:
  1. Secure voice biometric storage using decentralized infrastructure
  2. Voice ownership verification via VoicePrint NFTs
  3. Cryptographic protection using Zero-Knowledge Proofs and Trusted Execution Environments
  4. Clarify the step-by-step process for using VoiceVault
  5. Address security considerations and limitations honestly
  6. Reference the future roadmap when discussing potential improvements
  7. Provide clear demo instructions when users express interest in trying VoiceVault
  8. Contextualize VoiceVault within the broader landscape of deepfake threats and solutions

Your role is to explain how VoiceVault can help users protect their voice identity in a clear, concise, and reassuring manner. Focus on practical benefits and avoid technical jargon unless specifically asked.

Keep responses brief and focused on how VoiceVault helps secure voice identities.`;

const explainVaultGroq = async (prompt: string) => {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: CONTEXT_PROMPT,
      },
      {
        role: "user",
        content: `Prompt: ${prompt}`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_completion_tokens: 1024,
  });
  const explanationObj = chatCompletion.choices[0]?.message?.content;
  return explanationObj;
};

export {
  getVoiceNameFromTextGroq,
  analyzeVideoTitlesGroq,
  getNFTNameAndSymbolGroq,
  getTokenomicsGroq,
  explainVaultGroq,
};
