import { db } from "../firebase.service.js";

const COLLECTION_NAME = "user-voice-samples";

export const getUserVoiceSamplesDocs = async () => {
  const docs = await db.collection(COLLECTION_NAME).get();
  return docs.docs.map((doc) => doc.data());
};
