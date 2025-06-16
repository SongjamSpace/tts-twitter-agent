import { db } from "../firebase.service.js";

export type TweetSpacePipeline = {
  status: "NEW" | "PROCESSING" | "SENT" | "ERROR";
  spaceId: string;
  createdAt: number;
  tweets: string[];
  tweet: string;
  isThread?: boolean;
  tweetId?: string;
  isSent?: boolean;
  currentTweetIdx?: number;
  updatedAt?: number;
};

export const getTweetSpacePipelineById = async (spaceId: string) => {
  const tweetSpaces = await db
    .collection("tweetSpacesPipeline")
    .doc(spaceId)
    .get();
  return tweetSpaces.data() as TweetSpacePipeline;
};

export const createTweetSpacePipeline = async (
  spaceId: string,
  obj: Partial<TweetSpacePipeline>
) => {
  await db.collection("tweetSpacesPipeline").doc(spaceId).set(obj);
};

export const updateTweetSpacePipeline = async (
  spaceId: string,
  obj: Partial<TweetSpacePipeline>
) => {
  await db.collection("tweetSpacesPipeline").doc(spaceId).update(obj);
};

export const getLatestTweetSpacesPipeline = async () => {
  const tweetSpaces = await db
    .collection("tweetSpacesPipeline")
    .where("status", "==", "NEW")
    .limit(1)
    // .orderBy("createdAt", "desc")
    .get();
  return tweetSpaces.docs.map((doc) => doc.data() as TweetSpacePipeline);
};
