import express from "express";
import { Router } from "express";
import {
  getTweetSpacePipelineById,
  updateTweetSpacePipeline,
} from "./services/db/tweetSpacesPipeline.js";
import {
  createTweetFromFinalSummary,
  // createTweetsFromTranscript,
  // generateTwitterThread,
} from "./services/grok.js";
import {
  getSpaceById,
  // getSpaceFinalSummaryById,
  getSpaceFullTranscriptById,
} from "./services/db/spaces.js";
import { sendTweetOnScraper, sendTweetThreadOnScraper } from "./scraper.js";
import { TwitterApi } from "twitter-api-v2";
import { TwitterApiRateLimitPlugin } from "@twitter-api-v2/plugin-rate-limit";
import dotenv from "dotenv";
dotenv.config();

const router: Router = express.Router();

router.get("/", (req, res) => {
  res.send("songjam agent is running");
});

const sendApiTweet = async (tweetMessage: string) => {
  const rateLimitPlugin = new TwitterApiRateLimitPlugin();
  const client = new TwitterApi(
    {
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    { plugins: [rateLimitPlugin] }
  );
  const currentRateLimitForTweets = await rateLimitPlugin.v2.getRateLimit(
    "tweets"
  );
  console.log("Current Rate Limit: ", currentRateLimitForTweets);
  console.log(
    "Rate Limit Status: ",
    rateLimitPlugin.hasHitRateLimit(currentRateLimitForTweets)
  );
  console.log(
    "Rate Limit Status Obsolete: ",
    rateLimitPlugin.isRateLimitStatusObsolete(currentRateLimitForTweets)
  );
  const tweet = await client.v2.tweet(tweetMessage);
  return tweet.data.id;
};
// const sendTweetThread = async (tweets: string[]) => {
//   const tweet = await client.v2.tweetThread(tweets);
//   return tweet[0].data.id;
// };

// const tweetIds = [];
// let lastTweetId = "";
// for (const tweet of tweets) {
//   if (lastTweetId) {
//     const tweetResponse = await client.v2.tweet(tweet, {
//       reply: {
//         in_reply_to_tweet_id: lastTweetId,
//       },
//     });
//     tweetIds.push(tweetResponse.data.id);
//   } else {
//     const tweetResponse = await client.v2.tweet(tweet);
//     tweetIds.push(tweetResponse.data.id);
//   }
//   lastTweetId = tweetIds[tweetIds.length - 1];
//   await new Promise((resolve) => setTimeout(resolve, 3000));
// }
// return tweetIds[0];

router.post("/tweet-by-idx", async (req, res) => {
  const { spaceId, idx } = req.body;
  const tweetSpacePipeline = await getTweetSpacePipelineById(spaceId);
  const tweetMessage = tweetSpacePipeline.tweets[idx];
  if (!tweetMessage) {
    res.send("No tweet message found");
    return;
  }
  const tweetId = await sendTweetOnScraper(tweetMessage);
  res.send({ status: "success", tweetId });
});

/**
 * Attempts to send a tweet thread using the scraper, falling back to the Twitter API if needed.
 * Updates the tweet space pipeline as appropriate.
 * Returns an object: { success, tweetId, error }
 */
async function attemptSendTweetThread({ thread, spaceId, updateExtra = {} }) {
  try {
    const tweetId = await sendTweetThreadOnScraper(thread);
    await updateTweetSpacePipeline(spaceId, {
      isThread: true,
      isSent: true,
      tweetId,
      status: "SENT",
      updatedAt: Date.now(),
      ...updateExtra,
    });
    return { success: true, tweetId };
  } catch (error) {
    console.log("Scraper errored, trying API: ", error);
    try {
      const rateLimitPlugin = new TwitterApiRateLimitPlugin();
      const client = new TwitterApi(
        {
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        },
        { plugins: [rateLimitPlugin] }
      );
      const currentRateLimitForTweets = await rateLimitPlugin.v2.getRateLimit(
        "tweets"
      );
      console.log(
        "Rate Limit Status: ",
        rateLimitPlugin.hasHitRateLimit(currentRateLimitForTweets)
      );
      console.log(
        "Rate Limit Status Obsolete: ",
        rateLimitPlugin.isRateLimitStatusObsolete(currentRateLimitForTweets)
      );
      console.log("Current Rate Limit: ", currentRateLimitForTweets);
      if (
        rateLimitPlugin.isRateLimitStatusObsolete(currentRateLimitForTweets)
      ) {
        // Check Rate Limit
        const tweets = await client.v2.tweetThread(thread);
        await updateTweetSpacePipeline(spaceId, {
          isThread: true,
          isSent: true,
          tweetId: tweets[0].data.id,
          status: "SENT",
          updatedAt: Date.now(),
          ...updateExtra,
        });
        return { success: true, tweetId: tweets[0].data.id };
      }
      return { success: false, error: "Rate limit not obsolete, cannot send" };
    } catch (e) {
      await updateTweetSpacePipeline(spaceId, {
        isThread: true,
        isSent: false,
        status: "ERROR",
        updatedAt: Date.now(),
        ...updateExtra,
      });
      return { success: false, error: e.message || e };
    }
  }
}

router.post("/tweet-thread", async (req, res) => {
  const { spaceId } = req.body;
  const tweetSpacePipeline = await getTweetSpacePipelineById(spaceId);
  if (!tweetSpacePipeline || !tweetSpacePipeline.tweets) {
    res.send("No tweet spaces pipeline found");
    return;
  }
  const thread = tweetSpacePipeline.tweets;
  const result = await attemptSendTweetThread({ thread, spaceId });
  if (result.success) {
    res.send({ status: "success", tweetId: result.tweetId, tweets: thread });
  } else {
    res.send({ status: "error", error: result.error });
  }
});

router.post("/send-tweet", async (req, res) => {
  const { spaceId } = req.body;
  const tweetSpacePipeline = await getTweetSpacePipelineById(spaceId);
  if (!tweetSpacePipeline || !tweetSpacePipeline.tweet) {
    res.send("No tweet spaces pipeline found");
    return;
  }
  if (tweetSpacePipeline.isSent) {
    res.send({
      status: "success",
      message: "Tweet already sent",
      tweetId: tweetSpacePipeline.tweetId,
    });
    return;
  }
  const tweet = tweetSpacePipeline.tweet;
  const tweetId = await sendApiTweet(tweet);
  await updateTweetSpacePipeline(spaceId, {
    isSent: true,
    tweetId,
    status: "SENT",
    updatedAt: Date.now(),
  });
  res.send({ status: "success", tweetId });
});

router.post("/handle-space-tweet", async (req, res) => {
  const { spaceId } = req.body;
  const tweetSpacePipeline = await getTweetSpacePipelineById(spaceId);
  if (!tweetSpacePipeline) {
    res.send("No tweet spaces pipeline found");
    return;
  }
  const spaceDoc = await getSpaceById(spaceId);
  const transcript = await getSpaceFullTranscriptById(spaceId);
  console.log("Transcription retrieved");
  const admins = spaceDoc.admins.map((s) => s.twitterScreenName);
  const speakerMapping = [
    ...spaceDoc.admins.map((speaker: any) => ({
      name: speaker.displayName,
      twitterHandle: speaker.twitterScreenName,
    })),
    ...spaceDoc.speakers.map((speaker: any) => ({
      name: speaker.displayName,
      twitterHandle: speaker.twitterScreenName,
    })),
  ];
  const tweet = await createTweetFromFinalSummary(
    transcript.text,
    spaceDoc.title,
    spaceDoc.isBroadcast,
    admins,
    speakerMapping,
    `https://x.com/i/${
      spaceDoc.isBroadcast ? "broadcasts" : "spaces"
    }/${spaceId}`
  );
  console.log("Tweet created: ", tweet);
  const tweetId = await sendApiTweet(tweet);
  await updateTweetSpacePipeline(spaceId, {
    isThread: false,
    isSent: true,
    tweetId: "test",
    tweet,
    status: "SENT",
    updatedAt: Date.now(),
  });
  res.send({ status: "success" });

  // const spaceDurationInMs = spaceDoc.endedAt - spaceDoc.startedAt;
  // const isSpaceMoreThan60Minutes = true;
  // // spaceDurationInMs > 60 * 60 * 1000;
  // if (isSpaceMoreThan60Minutes) {
  //   console.log("Space is more than 60 minutes");
  //   const speakerMapping = [
  //     ...spaceDoc.admins.map((speaker: any) => ({
  //       name: speaker.displayName,
  //       twitterHandle: speaker.twitterScreenName,
  //     })),
  //     ...spaceDoc.speakers.map((speaker: any) => ({
  //       name: speaker.displayName,
  //       twitterHandle: speaker.twitterScreenName,
  //     })),
  //   ];

  //   const thread = await generateTwitterThread(
  //     transcript.text,
  //     spaceDoc.title,
  //     spaceDoc.admins.map((s) => s.twitterScreenName),
  //     speakerMapping,
  //     `x.com/i/spaces/${spaceId}`
  //   );
  //   console.log("Thread generated");

  //   if (thread.length === 0) {
  //     res.send("No tweet spaces pipeline found");
  //     return;
  //   }
  //   const result = await attemptSendTweetThread({
  //     thread,
  //     spaceId,
  //     updateExtra: { tweets: thread },
  //   });
  //   if (result.success) {
  //     res.send({ status: "success", tweetId: result.tweetId, tweets: thread });
  //   } else {
  //     res.send({ status: "error", error: result.error });
  //   }
  //   return;
  // } else {
  //   console.log("Space is less than 60 minutes");
  //   const speakerMapping = [
  //     ...spaceDoc.admins.map((speaker: any) => ({
  //       name: speaker.displayName,
  //       twitterHandle: speaker.twitterScreenName,
  //     })),
  //     ...spaceDoc.speakers.map((speaker: any) => ({
  //       name: speaker.displayName,
  //       twitterHandle: speaker.twitterScreenName,
  //     })),
  //   ];
  //   const tweets = await createTweetsFromTranscript(
  //     transcript.text,
  //     spaceDoc.admins.map((s) => s.twitterScreenName),
  //     speakerMapping,
  //     `x.com/i/spaces/${spaceId}`
  //   );
  //   console.log("Tweets created");
  //   await updateTweetSpacePipeline(tweetSpacePipeline.spaceId, {
  //     tweets,
  //     isThread: false,
  //     isSent: false,
  //     currentTweetIdx: 0,
  //     status: "PROCESSING",
  //     updatedAt: Date.now(),
  //   });
  //   // const tweetId = await sendTweet(tweetSpacePipeline.tweets[0]);
  //   const tweetId = "test";
  //   // TODO: Schedule next tweet
  //   res.send({ status: "success", tweetId, tweets });
  // }
});

// router.post("/generate-twitter-thread", async (req, res) => {
//   const { spaceId } = req.body;
//   const spaceDoc = await getSpaceById(spaceId);
//   const transcript = await getSpaceTranscriptById(spaceId);

//   const tweets = await createTweetsFromTranscript(transcript.text);
//   await updateTweetSpacePipeline(spaceId, tweets);

//   const speakerMapping = [...spaceDoc.admins, ...spaceDoc.speakers].map(
//     (speaker: any) => ({
//       name: speaker.displayName,
//       twitterHandle: speaker.twitterScreenName,
//     })
//   );

//   const thread = await generateTwitterThread(
//     transcript.text,
//     spaceDoc.admins.map((s) => s.twitterScreenName),
//     speakerMapping
//   );

//   if (thread.length === 0) {
//     res.send("No tweet spaces pipeline found");
//     return;
//   }

//   // Tweet as a thread
//   const tweetId = await sendTweetThread(thread);
//   res.send({ status: "success", tweetId });
// });

// const rateLimitPlugin = new TwitterApiRateLimitPlugin();
// const client = new TwitterApi(
//   {
//     appKey: process.env.TWITTER_API_KEY,
//     appSecret: process.env.TWITTER_API_SECRET,
//     accessToken: process.env.TWITTER_ACCESS_TOKEN,
//     accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
//   },
//   { plugins: [rateLimitPlugin] }
// );
// const currentRateLimitForTweets = await rateLimitPlugin.v2.getRateLimit(
//   "tweets"
// );
// console.log(
//   "Rate Limit Status: ",
//   rateLimitPlugin.hasHitRateLimit(currentRateLimitForTweets)
// );
// console.log(
//   "Rate Limit Status Obsolete: ",
//   rateLimitPlugin.isRateLimitStatusObsolete(currentRateLimitForTweets)
// );
export default router;
