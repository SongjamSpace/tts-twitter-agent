import { db } from "../firebase.service.js";

const DB_NAME = "pyannote_jobs";

export type JobType = {
  id: string;
  status: boolean;
  audioPath: string;
  audioUrl: string;
  diarization?: {
    start: number;
    end: number;
    speaker: string;
  }[];
  speakers?: string[];
};

const createJobDoc = async (
  docId: string,
  status: boolean,
  audioPath: string,
  audioUrl: string
) => {
  const d = db.doc(`/${DB_NAME}/${docId}`);
  await d.set({
    id: docId,
    status: status,
    audioPath: audioPath,
    audioUrl,
  });
};
const getJobDoc = async (docId: string) => {
  const d = db.doc(`/${DB_NAME}/${docId}`);
  const ss = await d.get();
  if (ss.exists) return ss.data() as JobType;
  return null;
};
const updateOnPyannoteJob = async (docId: string, obj: Partial<JobType>) => {
  const d = db.doc(`/${DB_NAME}/${docId}`);
  await d.update(obj);
};

export { createJobDoc, getJobDoc, updateOnPyannoteJob };
