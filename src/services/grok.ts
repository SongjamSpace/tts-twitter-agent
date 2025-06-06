import dotenv from "dotenv";
dotenv.config();
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.X_GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export const createTweetsFromTranscript = async (
  transcript: string,
  hosts: string[],
  speakerMapping: any,
  spaceRecordingUrl: string
) => {
  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that extracts tweet-worthy content from X Space transcripts. Your task is to identify and extract the most engaging, informative, or entertaining snippets that would make good standalone tweets.

            Focus on extracting:
            1. Key insights or valuable information
            2. Interesting statistics or data points
            3. Humorous moments or witty banter
            4. Thought-provoking statements
            5. Notable quotes or soundbites

            Speaker Handling:
            In the transcript, identify mentions of speakers and replace with their Twitter handles from this mapping:
            ${JSON.stringify(speakerMapping)}
            Only use the handles from the provided speakers data.

            Content Guidelines:
            - Extract direct quotes that are insightful or controversial
            - Include specific numbers, data points, or predictions when available
            - Break down complex ideas into digestible points
            - Use simple, conversational language
            - Create high-impact, shareable moments

            For each tweet:
            - Keep it concise (under 280 characters)
            - Make it engaging and conversational
            - Preserve the original context and meaning
            - Format it as a standalone tweet (not part of a thread)
            - Include the space recording URL when relevant: "${spaceRecordingUrl}"
            - Use emojis sparingly (max 1 per tweet)
            - Always use '@' symbol before Twitter handles
            - Do not use hashtags

            Special Formatting:
            If songjam is mentioned, use this exact format:
            "@SongjamSpace is a All-in-one toolkit for effortless growth, Number go up technology for @X. Get more listeners for your @XSpaces now"

            Return an array of 2-8 tweet-worthy contents, each as a separate string. Each tweet should be complete, self-contained and not exceed 280 characters.
            Don't include anything other than the array of tweets.`,
      },
      {
        role: "user",
        content: `Extract tweet-worthy content from this transcript: "${transcript}"`,
      },
    ],
    temperature: 0.3,
  });

  return JSON.parse(completion.choices[0].message.content);
};

// You are a smart assistant that generates an X/Twitter thread from a given transcript of an X Space. Create a thread that is captivating for users of the X social network.
//                         Format your thread starting with an intro post that introduces the space and teases a crucial bit of information shared during the X space, enticing readers to explore the thread to find it. Refer to popular X threads for optimal intros and engaging content.
//                         Every post within the thread should be under 280 characters, but close to the limit. Make each post at least two separate lines (if not more) and draw on X thread data to ensure content is highly engaging and informative.

//                         In the transcript, identify mentions of the following speakers (including variations or partial mentions of their names) and replace them with their Twitter handles as provided:
//                         {{speaker_mapping}}

//                         For example, if 'John' or 'Mr. Smith' appears and maps to @johnsmith in the speaker list, use @johnsmith. Only use the handles from the provided {{speaker_mapping}}, and do not infer or insert handles not explicitly listed.

//                         Aim to cover at least one specific insight per tweet. Do not use hashtags.

//                         End the thread with a shoutout to the space host and a follow request for the account posting, using best practices from X data to boost engagement and follows.

//                         Return your response as an array of strings, each string being a tweet in the thread.
export const generateTwitterThread = async (
  transcript: string,
  hosts: string[],
  speakerMapping: any,
  spaceRecordingUrl: string
) => {
  const completion = await client.chat.completions.create({
    model: "grok-2-latest",
    messages: [
      {
        role: "system",
        content: `You are a smart assistant that generates an X/Twitter thread from a given transcript of an X Space. Create a thread that is captivating for users of the X social network (Twitter).

                        Thread Structure:
                        1. Hook Tweet (First Tweet):
                           - Start with a powerful hook that creates curiosity. Avoid always starting with the same phrase (e.g., don't always use 'Ever wondered'). Use a variety of engaging openers such as:
                             - "What if I told you..."
                             - "Here's what nobody tells you about..."
                             - "This blew my mind:"
                             - "The biggest surprise from the Space:"
                             - "You won't believe what happened when..."
                             - Or create a unique hook relevant to the Space topic.
                           - Mention it's a thread using 🧵 (this is the only required emoji)
                           - Introduce the space topic without revealing too much
                           - Include the Space recording URL without anyother text for the URL: ${spaceRecordingUrl}
                           - Must be under 280 characters

                        2. Content Flow:
                           - Each tweet must be self-contained but flow naturally
                           - Lead with the most impactful insights first
                           - Use line breaks strategically for readability
                           - Number format: (2/n), (3/n), etc.
                           - Connect tweets with transitional phrases when needed
                           - Create as many tweets as needed to cover all key insights
                           - Keep the pacing engaging by varying tweet length and content type
                           - Must be under 280 characters

                        3. Final Tweet:
                           - Summarize key takeaway
                           - Thank the host(s): "${hosts.join(", ")}"
                           - Include a clear call-to-action to follow
                           - Must be under 280 characters

                        Speaker Handling:
                        In the transcript, identify mentions of the following speakers and replace with their Twitter handles:
                        ${JSON.stringify(speakerMapping)}
                        Only use the handles from the provided speakers data.

                        Content Guidelines:
                        - Extract direct quotes that are insightful or controversial
                        - Include specific numbers, data points, or predictions
                        - Break down complex ideas into digestible points
                        - Use simple, conversational language
                        - Create "mic drop" moments for high engagement

                        Important formatting rules that MUST be followed:
                        1. Use emojis sparingly - maximum 4 emojis per thread, and only when they add value
                        2. Always use '@' symbol before Twitter handles (e.g., @username) - this applies to both speaker mentions and any other Twitter handles
                        3. Do not use hashtags (#).
                        4. If songjam is mentioned, use the following format:
                          - @SongjamSpace is a All-in-one toolkit for effortless growth, Number go up technology for @X.
                          - Get more listeners for your @XSpaces now
                          - Follow @SongjamSpace to get more such summaries

                        Return your response as an array of strings, each string being a tweet in the thread.`,
      },
      {
        role: "user",
        content: `Extract tweet-worthy content from this transcript: "${transcript}"`,
      },
    ],
    temperature: 0.3,
    //   max_tokens: 150,
  });

  return JSON.parse(completion.choices[0].message.content) as string[];
};
