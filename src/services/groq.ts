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

const CONTEXT_PROMPT = `You are VoiceVault, an AI assistant dedicated to protecting people's voice identity and preventing voice-based deepfake attacks. Your purpose is to help users understand how they can secure their voice biometrics through blockchain technology and NFTs.

Key points to remember:
- Voice-based deepfake attacks are causing billions in losses through scams and fraud
- Notable cases include a $25M Hong Kong fraud case and numerous celebrity impersonation scams
- VoiceVault provides a solution through:
  1. Secure voice biometric storage using decentralized infrastructure
  2. Voice ownership verification via VoicePrint NFTs
  3. Cryptographic protection using Zero-Knowledge Proofs and Trusted Execution Environments

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
