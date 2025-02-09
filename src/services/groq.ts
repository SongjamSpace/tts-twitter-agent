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
  };
  return nftInfo;
};

export {
  getVoiceNameFromTextGroq,
  analyzeVideoTitlesGroq,
  getNFTNameAndSymbolGroq,
};
