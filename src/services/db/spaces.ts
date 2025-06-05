import { db } from "../firebase.service.js";

export type Space = {
  title: string;
  startedAt: number;
  endedAt: number;
  admins: {
    avatarUrl: string;
    displayName: string;
    isVerified: boolean;
    twitterScreenName: string;
    userId: string;
  }[];
  speakers: {
    avatarUrl: string;
    displayName: string;
    isVerified: boolean;
    twitterScreenName: string;
    userId: string;
  }[];
};

export const getSpaceById = async (spaceId: string) => {
  const space = await db.collection("spaces").doc(spaceId).get();
  return space.data() as Space;
};

export type SpaceTranscript = {
  createdAt: number;
  text: string;
};

export const getSpaceTranscriptById = async (spaceId: string) => {
  const transcriptDocId = "full_transcript";
  const transcriptDoc = await db
    .doc(`spaces/${spaceId}/summaries/${transcriptDocId}`)
    .get();
  return transcriptDoc.data() as SpaceTranscript;
};
