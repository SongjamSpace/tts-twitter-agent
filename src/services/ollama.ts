const ollamaUrl = "http://localhost:11434";

const getVoiceNameFromText = async (
  prompt: string
): Promise<{
  voice_name: string;
}> => {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: `
      Given this text: "${prompt}"
      
      Task: Find a name of a person or character mentioned in the text.
      1. If a specific name is found, return: {"voice_name": "name"}
      2. If no name is found, return: {"voice_name": "None"}
      Dont include anything other than the JSON response. Response MUST be in VALID JSON format.
      `,
      stream: false,
      options: {
        temperature: 0.7,
        stop: ["\n"],
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        num_predict: 256,
      },
    }),
  });
  const data = await response.json();
  console.log({ res: data.response });
  const voiceName = JSON.parse(data.response) as {
    voice_name: string;
    suggestions: string[];
  };
  return voiceName;
};

const analyzeVideoTitles = async (titles: string[]): Promise<string | null> => {
  // TODO: Run the title through LLM to find a matching video from youtube
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: `
      Analyze the following youtube video titles and find a youtube video that I can use to retrieve the voice, interviews, speeches, talks, etc are useful: "${titles.join(
        ", "
      )}"
      Only return one of the titles. Do not include any extra text. If you cannot find the name, return "None".
      `,
      stream: false,
      options: {
        temperature: 0.7,
        stop: ["\n"],
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        num_predict: 256,
      },
    }),
  });
  const data = await response.json();
  console.log({ data });
  const title = data.response;
  if (title === "None") {
    return null;
  }
  return title;
};

const getNFTNameAndSymbol = async (
  text: string
): Promise<{
  name: string;
  symbol: string;
}> => {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: `
      Given this text: "${text}"
      
      Task: Find a meaningful NFT name and an NFT symbol (must be 3 characters).
      return in the json format: {"name": "", "symbol": ""}
      Dont include anything other than the JSON response. Response MUST be in VALID JSON format.
      `,
      stream: false,
      options: {
        temperature: 0.7,
        stop: ["\n"],
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        num_predict: 256,
      },
    }),
  });
  const data = await response.json();
  console.log({ res: data.response });
  const nftInfo = JSON.parse(data.response) as {
    name: string;
    symbol: string;
  };
  return nftInfo;
};

export { getVoiceNameFromText, analyzeVideoTitles, getNFTNameAndSymbol };
