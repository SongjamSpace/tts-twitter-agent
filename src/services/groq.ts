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

export {
  getVoiceNameFromTextGroq,
  analyzeVideoTitlesGroq,
  getNFTNameAndSymbolGroq,
  getTokenomicsGroq,
};
