import { Scraper } from "agent-twitter-client";

const loginScraper = async () => {
  const scraper = new Scraper();
  await scraper.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL,
    process.env.TWITTER_2FA_SECRET
    // process.env.TWITTER_API_KEY,
    // process.env.TWITTER_API_SECRET,
    // process.env.TWITTER_ACCESS_TOKEN,
    // process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
  console.log("Scraper initialized successfully");
  return scraper;
};

export const sendTweet = async (tweetMessage: string) => {
  const scraper = await loginScraper();
  const tweetResponse = await scraper.sendTweet(tweetMessage);
  console.log("tweetResponse: ", tweetResponse);
  const json = await tweetResponse.json();
  const tweetId = json.data.create_tweet.tweet_results?.result?.rest_id;
  console.log("json: ", JSON.stringify(json.data.create_tweet.tweet_results));
  if (!tweetId) {
    const latestTweet = await scraper.getLatestTweet("SongjamSpace", false);
    if (latestTweet) {
      return latestTweet.id;
    } else {
      console.error("No latest tweet found");
      return null;
    }
  }
  return tweetId;
};

export const sendTweetThread = async (tweets: string[]) => {
  const scraper = await loginScraper();
  let lastTweetId = null;
  for (const tweet of tweets) {
    const tweetResponse = await scraper.sendTweet(tweet, lastTweetId);
    const json = await tweetResponse.json();
    lastTweetId = json.data.create_tweet.tweet_results?.result?.rest_id;
    if (!lastTweetId) {
      const latestTweet = await scraper.getLatestTweet("SongjamSpace", false);
      if (latestTweet) {
        lastTweetId = latestTweet.id;
      } else {
        console.error("No latest tweet found");
        return null;
      }
    }
  }
  return lastTweetId;
};
