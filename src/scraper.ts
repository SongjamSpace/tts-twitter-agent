import { Scraper } from "agent-twitter-client";

const loginScraper = async () => {
  const scraper = new Scraper();
  await scraper.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL,
    process.env.TWITTER_2FA_SECRET,
    process.env.TWITTER_API_KEY,
    process.env.TWITTER_API_SECRET,
    process.env.TWITTER_ACCESS_TOKEN,
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
  console.log("Scraper initialized successfully");
  return scraper;
};

export const sendTweet = async (tweetMessage: string) => {
  const scraper = await loginScraper();
  const tweetResponse = await scraper.sendTweetV2(tweetMessage);
  return tweetResponse.id;
};

export const sendTweetThread = async (tweets: string[]) => {
  const scraper = await loginScraper();
  let lastTweetId = "";
  for (const tweet of tweets) {
    if (lastTweetId) {
      const tweetResponse = await scraper.sendTweetV2(tweet, lastTweetId);
      lastTweetId = tweetResponse.id;
    } else {
      const tweetResponse = await scraper.sendTweetV2(tweet);
      lastTweetId = tweetResponse.id;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return lastTweetId;
};
