import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.X_GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

// export const createTweetsFromTranscript = async (
//   transcript: string,
//   hosts: string[],
//   speakerMapping: any,
//   spaceRecordingUrl: string
// ) => {
//   const completion = await client.chat.completions.create({
//     model: "grok-2-latest",
//     messages: [
//       {
//         role: "system",
//         content: `You are a helpful assistant that extracts tweet-worthy content from X Space transcripts. Your task is to identify and extract the most engaging, informative, or entertaining snippets that would make good standalone tweets.

//             Focus on extracting:
//             1. Key insights or valuable information
//             2. Interesting statistics or data points
//             3. Humorous moments or witty banter
//             4. Thought-provoking statements
//             5. Notable quotes or soundbites

//             Speaker Handling:
//             In the transcript, identify mentions of speakers and replace with their Twitter handles from this mapping:
//             ${JSON.stringify(speakerMapping)}
//             Only use the handles from the provided speakers data.

//             Content Guidelines:
//             - Extract direct quotes that are insightful or controversial
//             - Include specific numbers, data points, or predictions when available
//             - Break down complex ideas into digestible points
//             - Use simple, conversational language
//             - Create high-impact, shareable moments

//             For each tweet:
//             - Keep it concise (under 280 characters)
//             - Make it engaging and conversational
//             - Preserve the original context and meaning
//             - Format it as a standalone tweet (not part of a thread)
//             - Include the space recording URL when relevant: "${spaceRecordingUrl}"
//             - Use emojis sparingly (max 1 per tweet)
//             - Always use '@' symbol before Twitter handles
//             - Do not use hashtags

//             Special Formatting:
//             If songjam is mentioned, use this exact format:
//             "@SongjamSpace is a All-in-one toolkit for effortless growth, Number go up technology for @X. Get more listeners for your @XSpaces now"
//             If virtual ecosystem or virtuals is mentioned, either address it as @virtuals_io or Virtuals Ecosystem.

//             Return an array of 2-8 tweet-worthy contents, each as a separate string. Each tweet should be complete, self-contained and not exceed 280 characters.
//             Don't include anything other than the array of tweets.`,
//       },
//       {
//         role: "user",
//         content: `Extract tweet-worthy content from this transcript: "${transcript}"`,
//       },
//     ],
//     temperature: 0.3,
//   });

//   return JSON.parse(completion.choices[0].message.content);
// };

// You are a smart assistant that generates an X/Twitter thread from a given transcript of an X Space. Create a thread that is captivating for users of the X social network.
//                         Format your thread starting with an intro post that introduces the space and teases a crucial bit of information shared during the X space, enticing readers to explore the thread to find it. Refer to popular X threads for optimal intros and engaging content.
//                         Every post within the thread should be under 280 characters, but close to the limit. Make each post at least two separate lines (if not more) and draw on X thread data to ensure content is highly engaging and informative.

//                         In the transcript, identify mentions of the following speakers (including variations or partial mentions of their names) and replace them with their Twitter handles as provided:
//                         {{speaker_mapping}}

//                         For example, if 'John' or 'Mr. Smith' appears and maps to @johnsmith in the speaker list, use @johnsmith. Only use the handles from the provided {{speaker_mapping}}, and do not infer or insert handles not explicitly listed.

//                         Aim to cover at least one specific insight per tweet. Do not use hashtags.

//                         End the thread with a shoutout to the space host and a follow request for the account posting, using best practices from X data to boost engagement and follows.

//                         Return your response as an array of strings, each string being a tweet in the thread.
// export const generateTwitterThread = async (
//   transcript: string,
//   spaceTitle: string,
//   hosts: string[],
//   speakerMapping: any,
//   spaceRecordingUrl: string
// ) => {
//   const completion = await client.chat.completions.create({
//     model: "grok-2-latest",
//     messages: [
//       {
//         role: "system",
//         content: `You are a smart assistant that generates an X/Twitter thread from a given transcript of an X Space. Create a thread that is captivating for users of the X social network (Twitter).
//                   Space Title: ${spaceTitle}
//                         Thread Structure:
//                         1. Hook Tweet (First Tweet):
//                            - Start with a powerful, unique hook that creates curiosity.
//                            - Be creative and craft a hook that is relevant to the Space topic and the transcript.
//                            - Mention it's a thread using 🧵 (this is the only required emoji)
//                            - Introduce the space topic without revealing too much
//                            - Include the Space recording URL without any other text for the URL: ${spaceRecordingUrl}
//                            - Must be under 280 characters

//                         2. Content Flow:
//                            - Each tweet must be self-contained but flow naturally
//                            - Lead with the most impactful insights first
//                            - Use line breaks strategically for readability
//                            - Number format: (2/n), (3/n), etc.
//                            - Connect tweets with transitional phrases when needed
//                            - Create as many tweets as needed to cover all key insights
//                            - Keep the pacing engaging by varying tweet length and content type
//                            - Must be under 280 characters

//                         3. Final Tweet:
//                            - Summarize key takeaway
//                            - Thank the host(s): "${hosts.join(", ")}"
//                            - Include a clear call-to-action to follow
//                            - Must be under 280 characters

//                         Speaker Handling:
//                         In the transcript, identify mentions of the following speakers and replace with their Twitter handles:
//                         ${JSON.stringify(speakerMapping)}
//                         Only use the handles from the provided speakers data.

//                         Content Guidelines:
//                         - Spell the Title of the space correctly in all the tweets
//                         - Extract direct quotes that are insightful or controversial
//                         - Include specific numbers, data points, or predictions
//                         - Break down complex ideas into digestible points
//                         - Use simple, conversational language
//                         - Create "mic drop" moments for high engagement

//                         Important formatting rules that MUST be followed:
//                         1. Use emojis sparingly - maximum 4 emojis per thread, and only when they add value
//                         2. Always use '@' symbol before Twitter handles (e.g., @username) - this applies to both speaker mentions and any other Twitter handles
//                         3. Do not use hashtags (#).
//                         4. If songjam is mentioned, use the following format:
//                           - @SongjamSpace is a All-in-one toolkit for effortless growth, Number go up technology for @X.
//                           - Get more listeners for your @XSpaces now
//                           - Follow @SongjamSpace to get more such summaries
//                         5. Refrain from using first-person pronouns like "We" or "Our" in tweets. Instead, utilize the Twitter handles of the hosts or the space title to maintain a more personalized and engaging tone.

//                         Return your response as an array of strings, each string being a tweet in the thread.`,
//       },
//       {
//         role: "user",
//         content: `Extract tweet-worthy content from this transcript: "${transcript}"`,
//       },
//     ],
//     temperature: 0.3,
//     //   max_tokens: 150,
//   });

//   return JSON.parse(completion.choices[0].message.content) as string[];
// };

export const createTweetFromFinalSummary = async (
  transcript: string,
  spaceTitle: string,
  isBroadcast: boolean,
  hosts: string[],
  speakerMapping: { name: string; twitterHandle: string }[],
  spaceRecordingUrl: string,
  spaceStartedAt: number
): Promise<string> => {
  const spaceType = isBroadcast ? "Live" : "Space";
  const completion = await client.chat.completions.create({
    model: "grok-3",
    messages: [
      {
        role: "system",
        content: `You are a smart assistant that generates a single, long-form, and highly engaging tweet from the transcript of an X (Twitter) ${spaceType}.
Your task: Write an informative and captivating tweet that reads like a mini-article — summarizing the key takeaways, insights, and themes from the ${spaceType} in a structured and readable way.
Context:
${spaceType} Title: ${spaceTitle}
${spaceType === "Space" ? `Hosts: ${hosts.join(",")}` : ""}
Space Start Datetime: ${new Date(spaceStartedAt).toUTCString()} 
Current Datetime: ${new Date().toUTCString()} 

Guidelines:
- Cover multiple key insights, themes, and speaker points
- Max length: 25000 characters
- Keep it detailed, self-contained, and engaging — the reader should get full context without needing to watch the whole space.
- Structure the tweet clearly using line breaks to improve readability (like a short-form blog post).
- Include the Space recording URL at the end of the tweet: ${spaceRecordingUrl}
- Use simple, conversational language
- Avoid hashtags (#)
- Use emojis sparingly — maximum of 1, only if it adds clarity or emotional punch.
- Always use '@' before Twitter handles (e.g., @username) for speaker mentions
- Do not use first-person pronouns like "We" or "Our"; instead, use the Twitter handles of the hosts or the space title
- Pay attention to correct spelling of names based on context, reference with account bios and context pipeline
- Maintain correct spelling throughout the description
- Do not use ** ** for the texts
- Start with a more dynamic opening sentence, Use the provided space start datetime with current datetime to craft a sentence that conveys the timing of the event in a more natural way. Ignore if mentioning the time if it's very recent
- Do not share the raw date in the tweet

Additional Context of Names and Accounts:
- If "Song Jam" is mentioned, spell it exactly as “Songjam”.
- If "Virtual Ecosystem" or "Virtuals" is mentioned, address it as @virtuals_io
- If "Pump dot fun" is mentioned, address it as pump.fun
- Be careful of sharing website urls, only share if it's a well known website like x.com, songjam.space etc.

Speaker Handling:
Replace any mentioned speaker names in the transcript with their corresponding Twitter handles from this mapping:
${JSON.stringify(speakerMapping)}
Use the handle only if the speaker is referenced in the transcript.

Output:
Return a single tweet string — not a thread or an array — written in a clear, engaging, and informative style.`,
      },
      {
        role: "user",
        content: `Summarize this transcript in a single tweet: "${transcript}"`,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content.trim();
};

export const analyzeSpeakerMentions = async (
  transcript: string,
  speakerMapping: { name: string; twitterHandle: string }[],
  keywords: string[]
): Promise<{
  speakerMentions: { username: string; count: number }[];
}> => {
  const systemPrompt = `You are an expert at analyzing transcripts and identifying which speakers mentioned specific keywords.

Your task is to analyze a transcript and identify which specific speakers mentioned the keywords and how many times each speaker mentioned them.

Available speakers and their Twitter handles:
${JSON.stringify(speakerMapping, null, 2)}

Keywords to search for: ${keywords.join(", ")}

Instructions:
- Analyze the transcript carefully to identify mentions of the keywords
- For each mention, determine which speaker said it based on context, speaker identification, or direct attribution
- Count mentions per speaker accurately
- Be case-insensitive in your search
- Consider variations and context (e.g., "sang" could be past tense of "sing" or refer to the keyword)

Return ONLY a valid JSON object with this exact structure, no markdown formatting, no code blocks, just pure JSON:
{
  "speakerMentions": [
    {
      "username": "twitter_handle_without_@",
      "count": number
    }
  ]
}

Important: Return ONLY the JSON object, no markdown code blocks, no explanations, just the raw JSON.
Only include speakers who actually mentioned the keywords (count > 0).
Be precise and accurate in your analysis.`;

  const completion = await client.chat.completions.create({
    model: "grok-3",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Analyze this transcript for mentions of the keywords: "${transcript}"`,
      },
    ],
    temperature: 0.1,
  });

  try {
    let content = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\s*/, "");
    }
    if (content.startsWith("```")) {
      content = content.replace(/^```\s*/, "");
    }
    if (content.endsWith("```")) {
      content = content.replace(/\s*```$/, "");
    }

    const result = JSON.parse(content);
    return {
      speakerMentions: result.speakerMentions || [],
    };
  } catch (error) {
    console.error("Error parsing Grok response:", error);
    console.error("Raw response:", completion.choices[0].message.content);
    // Fallback to basic analysis if AI parsing fails
    return {
      speakerMentions: [],
    };
  }
};
